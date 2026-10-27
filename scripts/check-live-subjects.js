const API = process.env.API_ORIGIN || "https://axiom-backend-dwlc.onrender.com";

(async () => {
  const res = await fetch(`${API}/api/admin/contents`, {
    headers: { "x-admin-email": "admin@axiomprep.com" },
  });
  const j = await res.json();
  const items = j.contents || [];
  const by = {};
  for (const it of items) {
    const key = `${it.subject || "null"}|${it.destination_id || "?"}|kind=${it.extracted_kind || "-"}|qs=${(it.extracted_questions || []).length}`;
    by[key] = (by[key] || 0) + 1;
  }
  console.log(JSON.stringify(by, null, 2));
  console.log(
    "sample titles",
    items.slice(0, 15).map((i) => ({ t: i.title, s: i.subject, d: i.destination_id, ek: i.extracted_kind })),
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
