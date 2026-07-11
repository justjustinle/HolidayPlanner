// The full trip route: London → Bangkok → Phuket → Saigon → Nha Trang.
// A dotted path crawls forward while a plane loops the whole journey using
// SMIL animateMotion, so everything scales responsively with the viewBox.
const ROUTE =
  'M 40 150 C 160 128 270 78 390 60 C 405 105 370 165 330 215 C 400 232 470 190 560 145 C 585 125 595 90 640 60';

const STOPS: { x: number; y: number; label: string; fill: string; labelY: number }[] = [
  { x: 40, y: 150, label: 'London', fill: '#2B2B3D', labelY: 178 },
  { x: 390, y: 60, label: 'Bangkok', fill: '#B23A2E', labelY: 40 },
  { x: 330, y: 215, label: 'Phuket', fill: '#B23A2E', labelY: 243 },
  { x: 560, y: 145, label: 'Saigon', fill: '#C08A2E', labelY: 173 },
  { x: 640, y: 60, label: 'Nha Trang', fill: '#C08A2E', labelY: 40 },
];

export default function PlaneJourney() {
  return (
    <svg
      viewBox="0 0 700 260"
      className="w-full"
      role="img"
      aria-label="A plane flying the trip route from London to Bangkok, Phuket, Saigon and Nha Trang"
    >
      {/* dotted flight path, crawling forward */}
      <path
        d={ROUTE}
        fill="none"
        stroke="#C08A2E"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeDasharray="2 13"
        opacity={0.7}
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-75"
          dur="3s"
          repeatCount="indefinite"
        />
      </path>

      {/* stops */}
      {STOPS.map((s) => (
        <g key={s.label}>
          <circle cx={s.x} cy={s.y} r={8} fill={s.fill} />
          <text
            x={s.x}
            y={s.labelY}
            textAnchor="middle"
            fontSize={17}
            fill="#5c5346"
          >
            {s.label}
          </text>
        </g>
      ))}

      {/* the plane */}
      <g>
        <g transform="scale(2)" fill="#C08A2E">
          <path d="M 9 0 L -8 -1.2 L -8 1.2 Z" />
          <path d="M 1 -1 L -3 -6 L -5 -5.5 L -1.5 -0.6 Z" />
          <path d="M 1 1 L -3 6 L -5 5.5 L -1.5 0.6 Z" />
          <path d="M -5 -1 L -8 -3 L -8.8 -2.7 L -7 0 Z" />
        </g>
        <animateMotion dur="5.5s" repeatCount="indefinite" rotate="auto" path={ROUTE} />
      </g>
    </svg>
  );
}
