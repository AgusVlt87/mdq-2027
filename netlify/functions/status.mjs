import { getStore } from "@netlify/blobs";

const STATES = ["sin", "enviado", "respondio", "ok", "no", "reservada"];

export default async (req) => {
  const store = getStore({ name: "mdq-status", consistency: "strong" });

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const out = {};
    for (const b of blobs) {
      const v = await store.get(b.key, { type: "json" });
      if (v) out[b.key] = v;
    }
    return Response.json(out, { headers: { "Cache-Control": "no-store" } });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return new Response("JSON inválido", { status: 400 }); }
    const id = Number(body?.id);
    const state = String(body?.state ?? "");
    if (!Number.isInteger(id) || id <= 0 || id > 999 || !STATES.includes(state)) {
      return new Response("Datos inválidos", { status: 400 });
    }
    const note = String(body?.note ?? "").trim().slice(0, 280);
    const by = String(body?.by ?? "").trim().slice(0, 30);
    await store.setJSON(String(id), { state, note, by, at: Date.now() });
    return Response.json({ ok: true });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/status" };
