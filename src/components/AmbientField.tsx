/** Flip to false to hide the floating science signs. */
export const AMBIENT_FIELD_ENABLED = true;

const SYMBOLS = [
  { char: "π", top: "8%", left: "6%", size: "2.4rem", delay: "0s", dur: "18s" },
  { char: "∫", top: "22%", left: "88%", size: "2.8rem", delay: "2s", dur: "22s" },
  { char: "Σ", top: "68%", left: "8%", size: "2.1rem", delay: "4s", dur: "20s" },
  { char: "√", top: "14%", left: "42%", size: "1.8rem", delay: "1s", dur: "16s" },
  { char: "∞", top: "78%", left: "78%", size: "2.2rem", delay: "3s", dur: "24s" },
  { char: "Δ", top: "48%", left: "92%", size: "1.7rem", delay: "5s", dur: "19s" },
  { char: "λ", top: "86%", left: "28%", size: "2rem", delay: "1.5s", dur: "21s" },
  { char: "Ω", top: "36%", left: "18%", size: "1.6rem", delay: "6s", dur: "17s" },
  { char: "H₂O", top: "58%", left: "62%", size: "1.35rem", delay: "2.5s", dur: "23s" },
  { char: "e⁻", top: "30%", left: "72%", size: "1.4rem", delay: "7s", dur: "18s" },
  { char: "∂", top: "72%", left: "48%", size: "2rem", delay: "0.8s", dur: "20s" },
  { char: "∇", top: "10%", left: "62%", size: "1.7rem", delay: "4.5s", dur: "19s" },
  { char: "θ", top: "42%", left: "4%", size: "1.9rem", delay: "3.2s", dur: "21s" },
  { char: "μ", top: "88%", left: "90%", size: "1.5rem", delay: "5.5s", dur: "16s" },
  { char: "⚛", top: "52%", left: "38%", size: "1.8rem", delay: "1.2s", dur: "25s" },
  { char: "DNA", top: "4%", left: "32%", size: "1.25rem", delay: "2.8s", dur: "21s" },
  { char: "mRNA", top: "2%", left: "14%", size: "1.15rem", delay: "4.2s", dur: "24s" },
  { char: "ATP", top: "60%", left: "94%", size: "1.2rem", delay: "1.8s", dur: "19s" },
  { char: "NADH", top: "96%", left: "22%", size: "1.15rem", delay: "6.2s", dur: "22s" },
  { char: "A=T", top: "96%", left: "72%", size: "1.2rem", delay: "3.8s", dur: "18s" },
  { char: "G≡C", top: "54%", left: "82%", size: "1.2rem", delay: "0.6s", dur: "20s" },
  { char: "Ψ", top: "6%", left: "78%", size: "1.8rem", delay: "5.1s", dur: "17s" },
  { char: "β", top: "74%", left: "32%", size: "1.9rem", delay: "2.1s", dur: "23s" },
];

export function AmbientField() {
  if (!AMBIENT_FIELD_ENABLED) return null;
  return (
    <div className="ambient-field" aria-hidden="true">
      {SYMBOLS.map((s) => (
        <span
          key={`${s.char}-${s.left}`}
          className="ambient-symbol"
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            animationDelay: s.delay,
            animationDuration: s.dur,
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  );
}
