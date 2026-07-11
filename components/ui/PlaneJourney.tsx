// An SVG plane that flies along an arc from London to Bangkok. Uses SMIL
// animateMotion so the whole thing scales responsively with the viewBox.
const ROUTE = 'M30,90 Q160,-4 292,66';

export default function PlaneJourney() {
  return (
    <svg
      viewBox="0 0 320 120"
      className="w-full"
      role="img"
      aria-label="A plane flying from London to Bangkok"
    >
      {/* dashed flight path */}
      <path
        d={ROUTE}
        fill="none"
        stroke="#c9992e"
        strokeWidth={1.6}
        strokeDasharray="2 5"
        strokeLinecap="round"
        opacity={0.7}
      />

      {/* endpoints */}
      <circle cx={30} cy={90} r={3.5} fill="#3a352c" />
      <text x={30} y={108} textAnchor="middle" fontSize={9} fill="#8a8172">
        London
      </text>
      <circle cx={292} cy={66} r={3.5} fill="#b0472f" />
      <text x={292} y={84} textAnchor="middle" fontSize={9} fill="#8a8172">
        Bangkok
      </text>

      {/* the plane */}
      <g>
        <animate
          attributeName="opacity"
          dur="4.5s"
          repeatCount="indefinite"
          values="0;1;1;1;0"
          keyTimes="0;0.08;0.5;0.92;1"
        />
        <path d="M-9,-6 L11,0 L-9,6 L-4,0 Z" fill="#c9992e" stroke="#fdfbf5" strokeWidth={0.6}>
          <animateMotion dur="4.5s" repeatCount="indefinite" rotate="auto" path={ROUTE} />
        </path>
      </g>
    </svg>
  );
}
