export type OriginalsMarkId =
  | "tools"
  | "modules"
  | "quizzes"
  | "custom-test"
  | "improvement-book"
  | "prep-tracker"
  | "prerequisites"
  | "study-hub"
  | "study-sequences"
  | "top-tests"
  | "community";

const SIZE = { sm: "h-11 w-11", md: "h-[3.35rem] w-[3.35rem]", lg: "h-16 w-16" } as const;

function Glyph({ id }: { id: OriginalsMarkId }) {
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
    case "tools":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="3.2" />
          <path d="M16 5.5v4.2M16 22.3v4.2M5.5 16h4.2M22.3 16h4.2" />
          <path d="M9.2 9.2l3 3M19.8 19.8l3 3M9.2 22.8l3-3M19.8 12.2l3-3" />
          <path d="M20.5 7.2l4.3-1.4-1.4 4.3-2.9-2.9Z" />
        </svg>
      );
    case "modules":
      return (
        <svg {...common}>
          <path d="M16 5.5 26 11v10L16 26.5 6 21V11Z" />
          <path d="M6 11l10 5.5L26 11" />
          <path d="M16 16.5V26.5" />
        </svg>
      );
    case "quizzes":
      return (
        <svg {...common}>
          <path d="M11 7.5h10v9.2c0 2.6-2.1 4.6-5 4.6s-5-2-5-4.6V7.5Z" />
          <path d="M13 7.5V6.2c0-.8.7-1.4 1.5-1.4h3c.8 0 1.5.6 1.5 1.4V7.5" />
          <path d="M16 21.3v3.2M12.5 26.2h7" />
          <path d="M13.8 13.2h4.4M13.8 16.4h2.8" />
        </svg>
      );
    case "custom-test":
      return (
        <svg {...common}>
          <path d="M16 6.2V16" />
          <circle cx="16" cy="16" r="2.1" />
          <path d="M8.2 25.2 16 16l7.8 9.2" />
          <path d="M10.6 25.2h10.8" />
          <path d="M11.5 9.4h9" />
        </svg>
      );
    case "improvement-book":
      return (
        <svg {...common}>
          <path d="M16 8.2c-2.4-1.6-6.2-1.4-8.4.4v14.4c2.4-1.6 6-1.8 8.4.2 2.4-2 6-2.2 8.4-.2V8.6c-2.2-1.8-6-2-8.4-.4Z" />
          <path d="M16 8.6v14.6" />
        </svg>
      );
    case "prep-tracker":
      return (
        <svg {...common}>
          <path d="M16 6.5a9.5 9.5 0 1 1-8.2 4.7" />
          <path d="M16 16V10.4" />
          <path d="M16 16l4.4 2.6" />
          <circle cx="16" cy="16" r="1.35" fill="currentColor" stroke="none" />
        </svg>
      );
    case "prerequisites":
      return (
        <svg {...common}>
          <circle cx="16" cy="7.6" r="2.2" />
          <circle cx="8.2" cy="23.6" r="2.2" />
          <circle cx="16" cy="23.6" r="2.2" />
          <circle cx="23.8" cy="23.6" r="2.2" />
          <path d="M16 9.8v5.2M16 15l-7.8 6.4M16 15l7.8 6.4" />
        </svg>
      );
    case "study-hub":
      return (
        <svg {...common}>
          <circle cx="16" cy="16" r="9.2" />
          <path d="M16 10.4V16l3.6 2.2" />
          <path d="M7.4 24.6h17.2" />
        </svg>
      );
    case "study-sequences":
      return (
        <svg {...common}>
          <circle cx="7.5" cy="16" r="2.15" />
          <circle cx="16" cy="8.4" r="2.15" />
          <circle cx="24.5" cy="16" r="2.15" />
          <circle cx="16" cy="23.6" r="2.15" />
          <path d="M9.5 14.6 14 10.2M18 10.2l4.5 4.4M22.5 17.6 18 21.8M14 21.8 9.5 17.6" />
        </svg>
      );
    case "top-tests":
      return (
        <svg {...common}>
          <path d="M8 8.2h16v3.4c0 6.4-4.2 10.6-8 12.2-3.8-1.6-8-5.8-8-12.2V8.2Z" />
          <path d="M12.4 16.2 15 18.8l4.8-5.4" />
        </svg>
      );
    case "community":
      return (
        <svg {...common}>
          <circle cx="12.2" cy="12" r="3.1" />
          <circle cx="20.6" cy="12.8" r="2.6" />
          <path d="M6.4 22.6c.4-3.2 2.7-5 5.8-5s5.3 1.8 5.7 5" />
          <path d="M16.6 21.6c.5-2.4 2.2-3.7 4.4-3.7 2.3 0 4 1.4 4.4 3.7" />
        </svg>
      );
  }
}

export function OriginalsMark({
  id,
  size = "md",
  className = "",
}: {
  id: OriginalsMarkId;
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
