'use client';

import { useVC } from '@/lib/store';

export default function Toasts() {
  const { toasts } = useVC();
  return (
    <div className="toasts">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.tone || ''}`}>
          <div className="toast-title">{t.title}</div>
          {t.body && <div className="toast-body">{t.body}</div>}
          {t.hash && <div className="toast-hash mono">tx {t.hash.slice(0, 10)}…{t.hash.slice(-6)}</div>}
        </div>
      ))}
    </div>
  );
}
