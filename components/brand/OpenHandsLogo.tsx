export function OpenHandsLogo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="OpenHands logo"
    >
      <rect width="64" height="64" rx="16" fill="#17634a" />
      <path
        d="M18 38c0-6 4-10 9-10 2 0 4 .7 5.5 2C34 28.7 36 28 38 28c5 0 9 4 9 10v8H18v-8Z"
        fill="#f4eee3"
      />
      <path
        d="M22 30c0-4 3-7 7-7s7 3 7 7"
        stroke="#e56b45"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M34 30c0-4 3-7 7-7"
        stroke="#e56b45"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M28 44h8" stroke="#1f7a5c" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
