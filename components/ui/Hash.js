'use client';

import { useVC } from '@/lib/store';

export default function Hash({ value, n = 6, label, role, onClick }) {
  const { pushToast } = useVC();
  if (!value) return null;
  const display = value.length > 16 ? `${value.slice(0, n + 2)}…${value.slice(-4)}` : value;
  const copy = (e) => {
    e?.stopPropagation();
    navigator.clipboard?.writeText(value);
    pushToast({ title: 'Copied', body: value, duration: 1800 });
  };
  return (
    <span className="hash copy mono" onClick={onClick || copy} title={value}>
      {role && <span className="faint" style={{ marginRight: 4 }}>{role}</span>}
      {display}
      {label && <span className="faint" style={{ marginLeft: 4 }}>{label}</span>}
    </span>
  );
}
