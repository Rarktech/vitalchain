'use client';

import Glyph from './Glyph';

export default function Empty({ icon = 'activity', title, sub, action }) {
  return (
    <div className="empty">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: 'var(--text-faint)' }}>
        <Glyph type={icon} size={28} />
      </div>
      <div style={{ color: 'var(--text)', marginBottom: 4, fontSize: 14 }}>{title}</div>
      {sub && <div style={{ maxWidth: 380, margin: '0 auto' }}>{sub}</div>}
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}
