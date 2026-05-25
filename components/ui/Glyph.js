'use client';

const PATHS = {
  heart_rate: (p) => <svg {...p}><path d="M1 9 H4 L5.5 5 L8 13 L10 7 L11.5 10 H17"/></svg>,
  blood_pressure: (p) => <svg {...p}><circle cx="9" cy="9" r="5.5"/><path d="M9 6.5 V9 L10.5 10.5"/></svg>,
  spo2: (p) => <svg {...p}><path d="M9 2 C12 5 14 7.5 14 10.5 A5 5 0 0 1 4 10.5 C4 7.5 6 5 9 2 Z"/></svg>,
  weight: (p) => <svg {...p}><rect x="2.5" y="4" width="13" height="11" rx="1.5"/><path d="M5.5 8 L7 11 M12.5 8 L11 11"/></svg>,
  temperature: (p) => <svg {...p}><path d="M7 2.5 V11 A2.5 2.5 0 1 0 11 11 V2.5 A2 2 0 0 0 7 2.5 Z"/><circle cx="9" cy="12.5" r="1.2"/></svg>,
  glucose: (p) => <svg {...p}><path d="M9 2 L13 8 L9 16 L5 8 Z"/></svg>,
  device: (p) => <svg {...p}><rect x="5" y="2.5" width="8" height="13" rx="1.5"/><path d="M8 5 H10"/><circle cx="9" cy="13" r="0.8" fill="currentColor"/></svg>,
  ai: (p) => <svg {...p}><path d="M3 9 H6 M12 9 H15 M9 3 V6 M9 12 V15"/><circle cx="9" cy="9" r="3"/></svg>,
  share: (p) => <svg {...p}><circle cx="4" cy="9" r="2"/><circle cx="14" cy="4" r="2"/><circle cx="14" cy="14" r="2"/><path d="M5.7 8 L12.3 5 M5.7 10 L12.3 13"/></svg>,
  shield: (p) => <svg {...p}><path d="M9 1.5 L15 4 V9 C15 12.5 12.5 15 9 16.5 C5.5 15 3 12.5 3 9 V4 Z"/><path d="M6.5 9 L8 10.5 L11.5 7"/></svg>,
  lock: (p) => <svg {...p}><rect x="4" y="8" width="10" height="7.5" rx="1.5"/><path d="M6.5 8 V5.5 A2.5 2.5 0 0 1 11.5 5.5 V8"/></svg>,
  unlock: (p) => <svg {...p}><rect x="4" y="8" width="10" height="7.5" rx="1.5"/><path d="M6.5 8 V5.5 A2.5 2.5 0 0 1 11.5 5.5"/></svg>,
  plus: (p) => <svg {...p}><path d="M9 3 V15 M3 9 H15"/></svg>,
  check: (p) => <svg {...p}><path d="M3 9.5 L7 13.5 L15 5"/></svg>,
  arrow_right: (p) => <svg {...p}><path d="M3 9 H15 M11 5 L15 9 L11 13"/></svg>,
  external: (p) => <svg {...p}><path d="M7 4 H4 V14 H14 V11"/><path d="M9 9 L14 4 M10 4 H14 V8"/></svg>,
  chevron_right: (p) => <svg {...p}><path d="M7 4 L12 9 L7 14"/></svg>,
  sparkle: (p) => <svg {...p}><path d="M9 2 L10.5 7.5 L16 9 L10.5 10.5 L9 16 L7.5 10.5 L2 9 L7.5 7.5 Z"/></svg>,
  close: (p) => <svg {...p}><path d="M4 4 L14 14 M14 4 L4 14"/></svg>,
  copy: (p) => <svg {...p}><rect x="6" y="6" width="9" height="9" rx="1.5"/><path d="M3 12 V4 A1 1 0 0 1 4 3 H12"/></svg>,
  eye: (p) => <svg {...p}><path d="M1 9 C3 5 5.5 3.5 9 3.5 C12.5 3.5 15 5 17 9 C15 13 12.5 14.5 9 14.5 C5.5 14.5 3 13 1 9 Z"/><circle cx="9" cy="9" r="2"/></svg>,
  trash: (p) => <svg {...p}><path d="M3 5 H15 M6 5 V3.5 A1 1 0 0 1 7 2.5 H11 A1 1 0 0 1 12 3.5 V5 M5 5 V14.5 A1 1 0 0 0 6 15.5 H12 A1 1 0 0 0 13 14.5 V5"/></svg>,
  bolt: (p) => <svg {...p}><path d="M10 1.5 L4 10 H8 L7 16.5 L13 8 H9 Z"/></svg>,
  activity: (p) => <svg {...p}><path d="M1.5 9 H5 L7 4 L11 14 L13 9 H16.5"/></svg>,
};

export default function Glyph({ type, size = 18 }) {
  const svgProps = {
    width: size, height: size,
    viewBox: '0 0 18 18',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  const render = PATHS[type] || PATHS.activity;
  return <span className="glyph">{render(svgProps)}</span>;
}
