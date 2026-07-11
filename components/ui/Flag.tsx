// Small, crisp SVG flags (reliable across platforms, unlike emoji flags).

export function ThaiFlag({ size = 30 }: { size?: number }) {
  const h = (size * 2) / 3;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 40"
      className="rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
      role="img"
      aria-label="Thailand"
    >
      <rect width="60" height="40" fill="#A51931" />
      <rect y="6.67" width="60" height="26.67" fill="#F4F5F8" />
      <rect y="13.33" width="60" height="13.33" fill="#2D2A4A" />
    </svg>
  );
}

export function VietnamFlag({ size = 30 }: { size?: number }) {
  const h = (size * 2) / 3;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 60 40"
      className="rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.06)]"
      role="img"
      aria-label="Vietnam"
    >
      <rect width="60" height="40" fill="#DA251D" />
      <path
        d="M30,9 L32.47,16.6 L40.46,16.6 L33.99,21.3 L36.47,28.9 L30,24.2 L23.53,28.9 L26.01,21.3 L19.54,16.6 L27.53,16.6 Z"
        fill="#FFFF00"
      />
    </svg>
  );
}
