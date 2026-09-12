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
      <path d="M1 4 4 1h8v8l-3 3H1Z" fill="#10283a" />
      <path d="m13 4 3-3h8v8l-3 3h-8Z" fill="#10283a" />
      <path d="m25 4 3-3h7v8l-3 3h-7Z" fill="#087a45" />
      <path d="m1 16 3-3h8v8l-3 3H1Z" fill="#10283a" />
      <path d="m13 16 3-3h8v8l-3 3h-8Z" fill="#10283a" />
      <path d="m25 16 3-3h5v8l-3 3h-5Z" fill="#087a45" />
      <path d="m1 28 3-3h8v8l-3 3H1Z" fill="#10283a" />
      <path d="m13 28 3-3h8v8l-3 3h-8Z" fill="#10283a" />
      <path d="m25 28 3-3h7v8l-3 3h-7Z" fill="#72dca3" />
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
