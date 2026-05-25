'use client';

export default function LineChart({ data, accessor = (d) => d.value, height = 180, normal, color, showAxes = true, threshold }) {
  if (!data || data.length === 0) {
    return <div className="empty" style={{ height }}>No data</div>;
  }
  const W = 800, H = height, padL = showAxes ? 36 : 8, padR = 12, padT = 12, padB = showAxes ? 22 : 8;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const values = data.map(accessor);
  let min = Math.min(...values), max = Math.max(...values);
  if (normal) { min = Math.min(min, normal[0]); max = Math.max(max, normal[1]); }
  const pad = (max - min) * 0.15 || 1;
  min -= pad; max += pad;
  const x = (i) => padL + (data.length === 1 ? innerW / 2 : i / (data.length - 1) * innerW);
  const y = (v) => padT + innerH - (v - min) / (max - min) * innerH;
  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(accessor(d))}`).join(' ');
  const areaD = `${pathD} L ${x(data.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
  const yTicks = [min, (min + max) / 2, max];

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ height }}>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line className="grid-line" x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} />
          {showAxes && <text className="axis" x={padL - 6} y={y(t) + 3} textAnchor="end">{Number.isInteger(t) ? t : t.toFixed(1)}</text>}
        </g>
      ))}
      {normal && (
        <rect x={padL} y={y(normal[1])} width={innerW} height={y(normal[0]) - y(normal[1])} fill="oklch(0.82 0.17 145 / 0.05)" />
      )}
      {threshold != null && <line className="threshold" x1={padL} x2={W - padR} y1={y(threshold)} y2={y(threshold)} />}
      <path className="area" d={areaD} style={color ? { fill: color.replace(')', ' / 0.08)').replace('oklch(', 'oklch(') } : {}} />
      <path className="line" d={pathD} style={color ? { stroke: color } : {}} />
      {data.map((d, i) => (
        <circle key={i} className="dot" cx={x(i)} cy={y(accessor(d))} r="2" style={color ? { fill: color } : {}} />
      ))}
      {showAxes && data.length > 1 && [0, Math.floor(data.length / 2), data.length - 1].map(i => (
        <text key={i} className="axis" x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'}>
          {new Date(data[i].t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </text>
      ))}
    </svg>
  );
}
