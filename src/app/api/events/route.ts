import { addRealtimeClient } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export async function GET() {
  let removeClient: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      removeClient = addRealtimeClient(controller);
      heartbeat = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(`event: heartbeat\ndata: ${JSON.stringify({ at: new Date() })}\n\n`));
      }, 30_000);
    },
    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      removeClient?.();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
