type BrandLoaderProps = {
  label?: string;
  size?: "mark" | "block" | "page";
  className?: string;
};

export function BrandLoader({ label = "Loading", size = "block", className = "" }: BrandLoaderProps) {
  const dim = size === "page" ? "h-16 w-16" : size === "mark" ? "h-8 w-8" : "h-12 w-12";

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={`brand-orbit ${dim}`}>
        <span className="brand-orbit-ring" aria-hidden="true" />
        <span className="brand-orbit-glow" aria-hidden="true" />
        <img src="/brand-orbit.png" alt="" className="brand-orbit-mark" width={192} height={192} />
        <span className="brand-orbit-bead" aria-hidden="true" />
      </div>
      {size === "page" ? <p className="text-xs tracking-wide text-zinc-500">{label}</p> : null}
    </div>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[28vh] items-center justify-center px-4 py-10">
      <BrandLoader size="page" label={label} />
    </div>
  );
}
