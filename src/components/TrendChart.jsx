export default function TrendChart({ title, points, color = '#2563eb' }) {
  if (!points.length) {
    return <p className="note">No data available for {title.toLowerCase()} yet.</p>;
  }

  const width = 760;
  const height = 220;
  const padding = 40;
  const minVal = 0;
  const maxDataValue = Math.max(...points.map((point) => point.value));
  const maxVal = Math.max(maxDataValue, 3);
  const range = maxVal - minVal || 1;
  const yTicks = maxVal <= 3 ? [0, 1, 2, 3] : [0, Math.ceil(maxVal / 3), Math.ceil((maxVal * 2) / 3), maxVal];

  const pointsSvg = points.map((point, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
    const y = height - padding - ((point.value - minVal) * (height - padding * 2)) / range;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="card chart-card">
      <h3 className="heading">{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={title}>
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
        {yTicks.map((tick) => {
          const y = height - padding - ((tick - minVal) * (height - padding * 2)) / range;
          return (
            <g key={tick}>
              <line x1={padding - 8} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" opacity="0.6" />
              <text x={padding - 12} y={y + 4} fontSize="12" fill="#475569" textAnchor="end">{tick}</text>
            </g>
          );
        })}
        <polyline fill="none" stroke={color} strokeWidth="3" points={pointsSvg} />
        {points.map((point, index) => {
          const x = padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
          const y = height - padding - ((point.value - minVal) * (height - padding * 2)) / range;
          return <circle key={point.date} cx={x} cy={y} r="5" fill={color} />;
        })}
        <text x={padding} y={padding - 10} fontSize="12" fill="#475569">{maxVal}</text>
        <text x={padding} y={height - padding + 20} fontSize="12" fill="#475569">{points[0]?.date}</text>
        <text x={width - padding} y={height - padding + 20} fontSize="12" fill="#475569" textAnchor="end">{points[points.length - 1]?.date}</text>
      </svg>
    </div>
  );
}
