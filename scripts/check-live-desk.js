const API = process.env.API_ORIGIN || "https://afkjjeskssmtnzvmnkoe.supabase.co/functions/v1";

(async () => {
  const res = await fetch(`${API}/api/admin/contents`, {
    headers: { "x-admin-email": "admin@axiomprep.com" },
  });
  console.log("status", res.status);
  const j = await res.json();
  const items = j.contents || [];
  console.log("n", items.length);
  const qsets = items.filter(
    (i) => i.extracted_kind === "questions" || (i.extracted_questions && i.extracted_questions.length),
  );
  console.log("qsets", qsets.length);
  for (const it of qsets.slice(0, 50)) {
    const qs = it.extracted_questions || [];
    const usable = qs.filter((q) => String(q.stem || q.question || q.prompt || "").trim()).length;
    console.log(
      [it.id, it.subject, it.chapter, it.destination_id, it.is_published, `n=${qs.length}`, `usable=${usable}`, String(it.title || "").slice(0, 40)].join(" | "),
    );
  }
  const bySub = {};
  for (const it of qsets) {
    const s = String(it.subject || "null");
    bySub[s] = (bySub[s] || 0) + 1;
  }
  console.log("bySub", bySub);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
