const defaultColors = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#f59e0b',
  '#8b5cf6',
  '#0ea5e9',
  '#ec4899',
  '#14b8a6',
  '#fb7185',
  '#22c55e'
];

export default function MultiTrendChart({ title, series, width = 760, height = 220 }) {
  const dates = Array.from(
    new Set(series.flatMap((line) => line.points.map((point) => point.date)))
  ).sort((a, b) => new Date(a) - new Date(b));

  if (!dates.length) {
    return <p className="note">No data available for {title.toLowerCase()} yet.</p>;
  }

  const allValues = series.flatMap((line) => line.points.map((point) => point.value));
  const minVal = 0;
  const maxDataValue = Math.max(...allValues);
  const maxVal = Math.max(maxDataValue, 3);
  const range = maxVal - minVal || 1;
  const yTicks = maxVal <= 3 ? [0, 1, 2, 3] : [0, Math.ceil(maxVal / 3), Math.ceil((maxVal * 2) / 3), maxVal];
  const padding = 40;

  const linePaths = series.map((line, index) => {
    const pointMap = new Map(line.points.map((point) => [point.date, point.value]));
    const path = dates
      .map((date, pointIndex) => {
        const x = padding + (pointIndex * (width - padding * 2)) / Math.max(dates.length - 1, 1);
        const value = Number(pointMap.get(date) ?? 0);
        const y = height - padding - ((value - minVal) * (height - padding * 2)) / range;
        return `${x},${y}`;
      })
      .join(' ');

    return {
      name: line.name,
      path,
      color: line.color ?? defaultColors[index % defaultColors.length]
    };
  });

  return (
    <div className="card chart-card">
      <h3 className="heading">{title}</h3>
      <div className="overlay-legend">
        {linePaths.map((line) => (
          <span key={line.name} className="overlay-legend-item">
            <span className="legend-swatch" style={{ background: line.color }} />
            {line.name}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label={title}>
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
        {yTicks.map((tick) => {
          const y = height - padding - ((tick - minVal) * (height - padding * 2)) / range;
          return (
            <g key={tick}>
              <line x1={padding - 8} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" opacity="0.65" />
              <text x={padding - 12} y={y + 4} fontSize="12" fill="#475569" textAnchor="end">{tick}</text>
            </g>
          );
        })}
        {linePaths.map((line) => (
          <polyline key={line.name} fill="none" stroke={line.color} strokeWidth="2" opacity="0.85" points={line.path} />
        ))}
        {linePaths.map((line, index) => {
          const pointMap = new Map(series[index].points.map((point) => [point.date, point.value]));
          return dates.map((date, pointIndex) => {
            const x = padding + (pointIndex * (width - padding * 2)) / Math.max(dates.length - 1, 1);
            const value = Number(pointMap.get(date) ?? 0);
            const y = height - padding - ((value - minVal) * (height - padding * 2)) / range;
            return <circle key={`${line.name}-${date}`} cx={x} cy={y} r="3" fill={line.color} opacity="0.9" />;
          });
        })}
        <text x={padding} y={padding - 10} fontSize="12" fill="#475569">{maxVal}</text>
        <text x={padding} y={height - padding + 20} fontSize="12" fill="#475569">{dates[0]}</text>
        <text x={width - padding} y={height - padding + 20} fontSize="12" fill="#475569" textAnchor="end">{dates[dates.length - 1]}</text>
      </svg>
    </div>
  );
}
