type DeviceCategoryIconProps = {
  category: string;
  className?: string;
};

export default function DeviceCategoryIcon({
  category,
  className = "h-5 w-5",
}: DeviceCategoryIconProps) {
  const props = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (category === "Küche") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...props} aria-hidden="true">
        <path d="M5 9h14l-1 10H6L5 9Z" />
        <path d="M8 9V7h8v2M10 5h4M19 11h2v5h-2" />
      </svg>
    );
  }

  if (category === "Wäschepflege") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...props} aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 6h1M12 6h4" />
        <circle cx="12" cy="14" r="4" />
      </svg>
    );
  }

  if (category === "Bad") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...props} aria-hidden="true">
        <path d="M5 13V8a5 5 0 0 1 10 0M14 8h5" />
        <path d="M12 14v1M16 13v1M19 14v1M14 18v1M18 18v1" />
      </svg>
    );
  }

  if (category === "Unterhaltung") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...props} aria-hidden="true">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    );
  }

  if (category === "Büro") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...props} aria-hidden="true">
        <rect x="5" y="4" width="14" height="11" rx="1.5" />
        <path d="M3 19h18M5 15l-2 4M19 15l2 4" />
      </svg>
    );
  }

  if (category === "Haushalt") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...props} aria-hidden="true">
        <path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" />
      </svg>
    );
  }

  if (category === "Raumklima") {
    return (
      <svg viewBox="0 0 24 24" className={className} {...props} aria-hidden="true">
        <path d="M4 8h10a3 3 0 1 0-3-3" />
        <path d="M4 12h15a3 3 0 1 1-3 3M4 16h7" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} {...props} aria-hidden="true">
      <path d="M8.5 8V4.5M15.5 8V4.5" />
      <path d="M6.5 8h11v2.25A5.5 5.5 0 0 1 12 15.75V20" />
      <path d="M9.5 20h5" />
    </svg>
  );
}
