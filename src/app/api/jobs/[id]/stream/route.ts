import { getJob, subscribe } from "@/lib/jobs";
import type { Job } from "@/types/analysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Flux Server-Sent Events qui pousse la progression du job a l'interface. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (job: Job) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(job)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* deja ferme */
        }
      };

      const onUpdate = (job: Job) => {
        send(job);
        if (job.status === "termine" || job.status === "erreur") {
          // Laisse le dernier evenement partir avant de fermer le flux.
          setTimeout(close, 100);
        }
      };

      const unsubscribe = subscribe(id, onUpdate);

      // Commentaire SSE periodique : empeche les proxys de couper la connexion.
      const heartbeat = setInterval(() => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(": ping\n\n"));
          } catch {
            close();
          }
        }
      }, 15000);

      request.signal.addEventListener("abort", close);

      const current = getJob(id);
      if (current) {
        send(current);
        if (current.status === "termine" || current.status === "erreur") setTimeout(close, 100);
      } else {
        send({
          id,
          url: "",
          origine: "url",
          status: "erreur",
          steps: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          error: "Analyse introuvable ou expiree.",
        });
        setTimeout(close, 100);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
