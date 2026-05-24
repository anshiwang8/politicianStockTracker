type Client = {
  id: string;
  controller: ReadableStreamDefaultController<Uint8Array>;
};

const encoder = new TextEncoder();
const clients = new Map<string, Client>();

function send(client: Client, event: string, data: unknown) {
  client.controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

export function addRealtimeClient(controller: ReadableStreamDefaultController<Uint8Array>) {
  const client = { id: crypto.randomUUID(), controller };
  clients.set(client.id, client);
  send(client, "connected", { connected: true, at: new Date().toISOString() });
  return () => clients.delete(client.id);
}

export function broadcastRealtime(event: string, data: unknown) {
  for (const client of clients.values()) {
    try {
      send(client, event, data);
    } catch {
      clients.delete(client.id);
    }
  }
}
