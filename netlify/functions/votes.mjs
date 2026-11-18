import { getStore } from "@netlify/blobs";

const keyOf = (name) =>
  name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "anon";

export default async (req) => {
  const store = getStore({ name: "mdq-votes", consistency: "strong" });

  if (req.method === "GET") {
    const { blobs } = await store.list();
    const out = {};
    for (const b of blobs) {
      const v = await store.get(b.key, { type: "json" });
      if (v && v.name) out[v.name] = Array.isArray(v.picks) ? v.picks : [];
    }
    return Response.json(out, { headers: { "Cache-Control": "no-store" } });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return new Response("JSON inválido", { status: 400 }); }
    const name = String(body?.name ?? "").trim().slice(0, 30);
    const picks = Array.isArray(body?.picks)
      ? [...new Set(body.picks.filter((n) => Number.isInteger(n) && n > 0 && n < 100))].slice(0, 20)
      : null;
    if (!name || !picks) return new Response("Falta el nombre o los votos", { status: 400 });
    await store.setJSON(keyOf(name), { name, picks, at: Date.now() });
    return Response.json({ ok: true });
  }

  return new Response("Método no permitido", { status: 405 });
};

export const config = { path: "/api/votes" };
