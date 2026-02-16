// Half-circle gauge (bottom arc): BMI 15–40, zones shaded, needle for current value.
const BMI_MIN = 15;
const BMI_MAX = 40;

const ZONES = [
  { min: 15, max: 18.5, fill: 'rgba(148, 163, 184, 0.4)' },
  { min: 18.5, max: 25, fill: 'rgba(34, 197, 94, 0.35)' },
  { min: 25, max: 30, fill: 'rgba(249, 115, 22, 0.35)' },
  { min: 30, max: 40, fill: 'rgba(239, 68, 68, 0.35)' },
];

// Map BMI value to angle: 15 -> 180° (left), 40 -> 0° (right). Arc is the bottom half.
function valueToAngle(value) {
  const clamped = Math.max(BMI_MIN, Math.min(BMI_MAX, value));
  const t = (clamped - BMI_MIN) / (BMI_MAX - BMI_MIN);
  return 180 - t * 180;
}

function polarToCart(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

export default function BMIGauge({ bmi, size = 200 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.88;
  const strokeWidth = 12;

  // Bottom half-circle arc: from startAngle to endAngle clockwise (sweep=1)
  const makeArc = (startAngle, endAngle) => {
    const start = polarToCart(cx, cy, r, startAngle);
    const end = polarToCart(cx, cy, r, endAngle);
    const sweep = 1;
    const large = startAngle - endAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`;
  };

  const needleAngle = valueToAngle(bmi);
  const needleEnd = polarToCart(cx, cy, r - strokeWidth / 2 - 2, needleAngle);

  const svgHeight = size / 2 + 36;

  return (
    <svg width={size} height={svgHeight} viewBox={`0 0 ${size} ${svgHeight}`} style={{ overflow: 'visible' }}>
      {ZONES.map((z, i) => (
        <path
          key={i}
          d={makeArc(valueToAngle(z.min), valueToAngle(z.max))}
          fill="none"
          stroke={z.fill}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ))}
      <line
        x1={cx}
        y1={cy}
        x2={needleEnd.x}
        y2={needleEnd.y}
        stroke="var(--accent)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r={6} fill="var(--accent)" />
      <text
        x={cx}
        y={size / 2 + 22}
        textAnchor="middle"
        style={{ fontSize: 24, fontWeight: 700, fill: 'var(--text)', fontFamily: 'var(--font-mono)' }}
      >
        {typeof bmi === 'number' && !Number.isNaN(bmi) ? bmi.toFixed(1) : '—'}
      </text>
      <text x={cx} y={size / 2 + 38} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--text-muted)' }}>
        BMI
      </text>
    </svg>
  );
}
