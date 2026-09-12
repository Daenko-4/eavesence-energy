type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

export function BrandMark({
  className = "h-9 w-9",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 36 36"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="10" height="10" rx="2.4" fill="#10283a" />
      <rect x="13" y="1" width="10" height="10" rx="2.4" fill="#10283a" />
      <rect x="25" y="1" width="10" height="10" rx="2.4" fill="#18a957" />
      <rect x="1" y="13" width="10" height="10" rx="2.4" fill="#10283a" />
      <rect x="13" y="13" width="10" height="10" rx="2.4" fill="#10283a" />
      <rect x="1" y="25" width="10" height="10" rx="2.4" fill="#10283a" />
      <rect x="13" y="25" width="10" height="10" rx="2.4" fill="#10283a" />
      <rect x="25" y="25" width="10" height="10" rx="2.4" fill="#10283a" />
    </svg>
  );
}

export default function BrandLogo({
  className = "inline-flex items-center gap-2.5",
  markClassName = "h-9 w-9",
  wordmarkClassName = "text-[1.35rem]",
  showWordmark = true,
}: BrandLogoProps) {
  return (
    <span className={className}>
      <BrandMark className={markClassName} />
      {showWordmark && (
        <span
          className={`${wordmarkClassName} whitespace-nowrap font-extrabold leading-none tracking-[-0.065em] text-[#10283a]`}
        >
          EAVESENCE
        </span>
      )}
    </span>
  );
}
