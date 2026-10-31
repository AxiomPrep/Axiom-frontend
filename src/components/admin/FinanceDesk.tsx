"use client";

import { useEffect, useState } from "react";
import { fetchAdminFinance, type FinanceReport } from "@/lib/admin";

function inr(paise: number) {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(rupees) ? 0 : 2,
  }).format(rupees);
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function FinanceDesk({ email }: { email: string }) {
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchAdminFinance(email)
      .then((data) => {
        if (alive) setReport(data);
      })
      .catch((err) => {
        if (alive) setError(err instanceof Error ? err.message : "Could not load finance.");
      });
    return () => {
      alive = false;
    };
  }, [email]);

  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (!report) return <p className="text-sm text-muted">Loading finance…</p>;

  const cards = [
    { label: "Students visited", value: String(report.visitors), note: `${report.visitors_7d} in the last 7 days` },
    { label: "Student accounts", value: String(report.students), note: "Website signups stay students" },
    { label: "Memberships bought", value: String(report.purchases), note: `${report.buyers} students paid` },
    { label: "Amount collected", value: inr(report.revenue_paise), note: "Paid orders only" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="surface rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-muted">{card.label}</p>
            <p className="mt-2 font-display text-3xl text-ink">{card.value}</p>
            <p className="mt-2 text-xs text-muted">{card.note}</p>
          </article>
        ))}
      </div>

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">Plans selected</h2>
        {report.plans.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No paid memberships yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Students</th>
                  <th className="pb-3 font-medium">Payments</th>
                  <th className="pb-3 font-medium">Collected</th>
                </tr>
              </thead>
              <tbody>
                {report.plans.map((plan) => (
                  <tr key={plan.plan_id || plan.name} className="border-t border-line">
                    <td className="py-3 text-ink">{plan.name}</td>
                    <td className="py-3 text-muted">{plan.buyers}</td>
                    <td className="py-3 text-muted">{plan.payments}</td>
                    <td className="py-3 text-ink">{inr(plan.revenue_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface rounded-2xl p-6">
        <h2 className="font-display text-2xl font-semibold text-ink">Who paid</h2>
        {report.payments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Payments will show here after a student buys a plan.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {report.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                <div>
                  <p className="text-sm text-ink">{payment.student_name}</p>
                  <p className="text-xs text-muted">
                    {payment.email ? `${payment.email} · ` : ""}
                    {payment.plan_name}
                    {payment.created_at ? ` · ${when(payment.created_at)}` : ""}
                  </p>
                </div>
                <p className="text-sm text-ink">{inr(payment.amount_paise)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
