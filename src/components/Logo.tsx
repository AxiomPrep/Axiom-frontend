import Image from "next/image";

type LogoProps = {
  variant?: "mark" | "full";
  className?: string;
  priority?: boolean;
};

export function Logo({ variant = "mark", className = "", priority }: LogoProps) {
  const size =
    variant === "full"
      ? "h-56 w-56 sm:h-72 sm:w-72 rounded-[1.85rem]"
      : "h-14 w-14 rounded-[0.95rem]";

  return (
    <span
      className={`logo-plate relative inline-flex shrink-0 overflow-hidden border border-axiom/20 bg-black ${size} ${className}`}
    >
      <Image
        src="/logo.png"
        alt={variant === "full" ? "Axiom Prep — Explore. Question. Understand." : "Axiom Prep"}
        width={720}
        height={720}
        priority={priority}
        className="h-full w-full object-contain p-[6%]"
      />
    </span>
  );
}
