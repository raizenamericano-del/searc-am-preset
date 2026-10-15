export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden>
      <defs>
        <linearGradient id="am-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22e5ff" />
          <stop offset="0.5" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="#0b1120" />
      <rect x="20" y="20" width="472" height="472" rx="96" fill="none" stroke="url(#am-g)" strokeOpacity="0.6" strokeWidth="10" />
      <path d="M112 360 L182 152 L252 360" fill="none" stroke="url(#am-g)" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M142 290 H222" stroke="url(#am-g)" strokeWidth="30" strokeLinecap="round" />
      <path d="M280 360 V160 L340 262 L400 160 V360" fill="none" stroke="url(#am-g)" strokeWidth="38" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="414" cy="110" r="18" fill="#22e5ff" />
    </svg>
  );
}
