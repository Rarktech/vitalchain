'use client';

import { useSuiClientQuery } from '@mysten/dapp-kit';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import LineChart from '@/components/ui/LineChart';
import Empty from '@/components/ui/Empty';
import DeviceCard from './DeviceCard';

function Stat({ label, value, sub, mono }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-delta" style={{ color: 'var(--text-faint)' }}>{sub}</div>}
    </div>
  );
}

function ActivityFeed({ limit = 10 }) {
  const { state, relTime, shortHash } = useVC();
  const items = state.activity.slice(0, limit);
  if (items.length === 0) return <Empty title="No activity yet" sub="Log a reading to see entities arrive" />;
  return (
    <div className="activity">
      {items.map((a, i) => (
        <div key={i} className="activity-row">
          <div className={`activity-icon ${a.entityType === 'data_share' ? 'share' : a.entityType === 'ai_analysis' ? 'ai' : 'create'}`}>
            <Glyph type={
              a.entityType === 'data_share' ? 'share' :
                a.entityType === 'ai_analysis' ? 'sparkle' :
                  a.entityType === 'device' ? 'device' : 'plus'
            } size={11} />
          </div>
          <div className="activity-text">
            <span style={{ color: 'var(--text-mute)' }}>
              {a.entityType === 'data_share' && a.type === 'revoke' ? 'Revoked' : 'Wrote'} {a.entityType.replace('_', ' ')} ·
            </span> {a.summary}
          </div>
          <div className="activity-meta">{shortHash(a.txHash || a.entityKey, 6)}</div>
          <div className="activity-meta">{relTime(a.at)}</div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ navigate }) {
  const { state, queryEntities, READING_TYPES, shortAddr, BRAGA_CHAIN_ID } = useVC();

  const { data: balData } = useSuiClientQuery(
    'getBalance',
    { owner: state.wallet?.address, coinType: '0x2::sui::SUI' },
    { enabled: !!state.wallet?.address }
  );
  const suiBalance = balData
    ? (Number(balData.totalBalance) / 1e9).toFixed(4) + ' SUI'
    : state.wallet?.balance || '— SUI';
  const allReadings = queryEntities({ entityType: 'biometric_reading', $owner: state.wallet.address });
  const analyses = queryEntities({ entityType: 'ai_analysis', $owner: state.wallet.address });
  const shares = queryEntities({ entityType: 'data_share', $owner: state.wallet.address });
  const devices = queryEntities({ entityType: 'device', $owner: state.wallet.address });

  const counts = {};
  allReadings.forEach(r => {
    const t = r.attributes.find(a => a.key === 'readingType')?.value;
    counts[t] = (counts[t] || 0) + 1;
  });
  const topType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'heart_rate';
  const topReadings = allReadings
    .filter(r => r.attributes.find(a => a.key === 'readingType')?.value === topType)
    .sort((a, b) => (a.attributes.find(x => x.key === 'recordedAt')?.value) - (b.attributes.find(x => x.key === 'recordedAt')?.value))
    .map(r => ({
      t: r.attributes.find(x => x.key === 'recordedAt')?.value,
      value: r.attributes.find(x => x.key === 'primaryValue')?.value,
      v2: r.attributes.find(x => x.key === 'secondaryValue')?.value,
    }));

  const typeMeta = READING_TYPES[topType];
  const latest = topReadings[topReadings.length - 1];
  const prev = topReadings[topReadings.length - 2];
  const delta = latest && prev ? (latest.value - prev.value) : 0;

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">
            {state.profile?.name ? `Welcome back, ${state.profile.name.split(' ')[0]}` : 'Dashboard'}
          </div>
          <div className="page-sub mono" style={{ fontSize: 12 }}>
            <span className="accent">●</span> {shortAddr(state.wallet.address)} · {Object.keys(state.entities).length} entities · Sui Testnet
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => navigate('add')}>
            <Glyph type="plus" size={12} /> Log reading
          </button>
          <button className="btn primary" onClick={() => navigate('insights')}>
            <Glyph type="sparkle" size={12} /> Ask AI
          </button>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Readings on-chain" value={allReadings.length} sub={`${devices.length} devices · all $owner = you`} />
        <Stat label="AI analyses" value={analyses.length} sub={analyses.length > 0 ? 'AI insights are wallet-owned' : 'Ask the AI a question'} />
        <Stat label="Active shares" value={shares.length} sub={shares.length > 0 ? 'Auto-expire at protocol layer' : 'Time-limited by Arkiv expiresIn'} />
        <Stat label="SUI Balance" value={suiBalance} sub="Sui Testnet · live" mono />
      </div>

      <div className="grid-2 mt-6">
        <div className="card">
          <div className="card-head">
            <div className="row gap-sm">
              <Glyph type={topType} size={14} />
              <div className="card-title">{allReadings.length > 0 ? `${typeMeta?.label} · last ${topReadings.length}` : 'Health Chart'}</div>
            </div>
            <div className="row gap-sm">
              {latest && (
                <>
                  <div className="mono" style={{ fontSize: 18 }}>
                    {latest.value}{latest.v2 != null && latest.v2 !== '' ? `/${latest.v2}` : ''}
                    <span className="muted" style={{ fontSize: 12, marginLeft: 4 }}>{typeMeta?.unit}</span>
                  </div>
                  {delta !== 0 && (
                    <span className={`chip ${delta > 0 ? 'warn' : 'accent'}`}>
                      {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          {allReadings.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>No readings yet</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
                Register a device, then log your first reading to see your health trend chart here.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn" style={{ fontSize: 12 }} onClick={() => navigate('devices')}>
                  <Glyph type="device" size={12} /> Register device
                </button>
                <button className="btn primary" style={{ fontSize: 12 }} onClick={() => navigate('add')}>
                  <Glyph type="plus" size={12} /> Log reading
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ padding: '18px' }}>
                <LineChart data={topReadings.slice(-30)} normal={typeMeta?.normal} color={typeMeta?.color} height={220} />
              </div>
              <div className="card-foot">
                <span className="muted" style={{ fontSize: 12 }}>Each point is a live entity on Arkiv chain</span>
                <button className="btn xs ghost" onClick={() => navigate('vault')}>
                  View vault <Glyph type="chevron_right" size={10} />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Recent activity</div>
            <span className="chip live accent">LIVE</span>
          </div>
          <div style={{ padding: '4px 18px 18px' }}>
            <ActivityFeed limit={8} />
          </div>
        </div>
      </div>

      <div className="card mt-6" style={{ padding: '22px 24px', background: 'var(--surface)' }}>
        <div className="row gap-sm" style={{ marginBottom: 8 }}>
          <Glyph type="shield" size={14} />
          <div style={{ fontSize: 13, fontWeight: 500 }}>Why this is different</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 14 }}>
          {[
            { k: '$creator immutable', v: 'The device wallet that signed each reading cannot be rewritten — cryptographic provenance.' },
            { k: '$owner mutable', v: 'You control update and delete. Transferable to a new device, a guardian, or a successor.' },
            { k: 'expiresIn enforced', v: 'Shares vanish at the protocol layer. No revoke endpoint. No server. No remembering.' },
          ].map(item => (
            <div key={item.k}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.k}</div>
              <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 4, lineHeight: 1.5 }}>{item.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-head">
        <div className="row gap-sm"><div className="section-title">Connected devices</div></div>
        <div className="section-sub"><a onClick={() => navigate('devices')} style={{ cursor: 'pointer' }}>Manage all →</a></div>
      </div>
      <div className="device-grid">
        {devices.slice(0, 3).map(d => <DeviceCard key={d.entityKey} device={d} compact />)}
        {devices.length === 0 && (
          <Empty title="No devices registered" sub="Register a device to start logging readings" action={<button className="btn primary" onClick={() => navigate('devices')}>Register device</button>} />
        )}
      </div>
    </div>
  );
}
