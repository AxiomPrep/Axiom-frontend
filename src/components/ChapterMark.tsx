export type ChapterMarkId =
  | "lectures"
  | "problem_solving"
  | "pyqs_solving"
  | "one_shots"
  | "revision"
  | "notes_pdf"
  | "important_pdfs";

const SIZE = { sm: "h-11 w-11", md: "h-[3.35rem] w-[3.35rem]", lg: "h-16 w-16" } as const;

function Glyph({ id }: { id: ChapterMarkId }) {
  const common = {
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.55,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[58%] w-[58%]",
    "aria-hidden": true,
  };

  switch (id) {
    case "lectures":
      return (
        <svg {...common}>
          <rect x="6.5" y="8" width="19" height="16" rx="2.2" />
          <path d="M13.5 12.4v7.2L21 16Z" />
        </svg>
      );
    case "problem_solving":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="8.4" />
          <circle cx="16" cy="16" r="3.1" />
          <path d="M16 6.4v3.2M16 22.4v3.2M6.4 16h3.2M22.4 16h3.2" />
        </svg>
      );
    case "pyqs_solving":
      return (
        <svg {...common}>
          <path d="M9 7.2h10.2L23 11.2V24.8H9V7.2Z" />
          <path d="M19.2 7.2v4.2H23" />
          <path d="M12.2 16.2h7.6M12.2 19.8h5.4" />
        </svg>
      );
    case "one_shots":
      return (
        <svg {...common}>
          <path d="M17.6 6.4 10.2 16.6h5.4L14.4 25.6l8.2-11.2h-5.4Z" />
        </svg>
      );
    case "revision":
      return (
        <svg {...common}>
          <path d="M9.2 13.2A7.2 7.2 0 0 1 23 12.4" />
          <path d="M22.8 9.2v4.4h-4.4" />
          <path d="M22.8 18.8A7.2 7.2 0 0 1 9 19.6" />
          <path d="M9.2 22.8v-4.4h4.4" />
        </svg>
      );
    case "notes_pdf":
      return (
        <svg {...common}>
          <path d="M10 7h8.4L22.6 11.4V25H10V7Z" />
          <path d="M18.2 7v4.6h4.4" />
          <path d="M13 16h6.4M13 19.4h4.6" />
        </svg>
      );
    case "important_pdfs":
      return (
        <svg {...common}>
          <path d="M16 6.4 18.6 13h6.8l-5.4 4.2 2 6.6L16 20.2 9.8 23.8l2-6.6L6.4 13h6.8Z" />
        </svg>
      );
  }
}

export function ChapterMark({
  id,
  size = "sm",
  className = "",
}: {
  id: ChapterMarkId;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <span
      className={`originals-seal relative inline-flex shrink-0 items-center justify-center text-axiom ${SIZE[size]} ${className}`}
      aria-hidden
    >
      <span className="pointer-events-none absolute inset-[7%] rounded-[0.85rem] border border-axiom/15" />
      <Glyph id={id} />
    </span>
  );
}
