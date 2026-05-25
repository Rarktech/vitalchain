'use client';

import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Hash from '@/components/ui/Hash';
import ExplorerLink from '@/components/ui/ExplorerLink';

export default function DeviceCard({ device, compact }) {
  const { state, queryEntities, relTime } = useVC();
  const deviceKey = device.attributes.find(a => a.key === 'deviceId')?.value;
  const allReadings = queryEntities({ entityType: 'biometric_reading', $owner: state.wallet.address });
  const myReadings = allReadings.filter(r => r.attributes.find(a => a.key === 'deviceId')?.value === deviceKey);
  const lastReading = myReadings.sort((a, b) => (b.attributes.find(x => x.key === 'recordedAt')?.value) - (a.attributes.find(x => x.key === 'recordedAt')?.value))[0];
  const deviceType = device.attributes.find(a => a.key === 'deviceType')?.value;

  return (
    <div className="device">
      <div className="device-icon">
        <Glyph type={deviceType === 'smartwatch' ? 'heart_rate' : deviceType === 'sensor' ? 'device' : 'activity'} size={18} />
      </div>
      <div className="device-name">{device.payload?.name}</div>
      <div className="device-model mono">{device.payload?.model} · fw {device.payload?.firmwareVersion}</div>

      <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>$creator (device wallet)</div>
      <div style={{ marginTop: 4 }}><Hash value={device.$creator} n={6} /></div>

      <div className="device-stats">
        <div>
          <div className="device-stat-label">Readings signed</div>
          <div className="device-stat-value">{myReadings.length}</div>
        </div>
        <div>
          <div className="device-stat-label">Last seen</div>
          <div className="device-stat-value">{lastReading ? relTime(lastReading.attributes.find(a => a.key === 'recordedAt')?.value) : '—'}</div>
        </div>
      </div>

      {!compact && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="chip accent">REGISTERED</span>
          <ExplorerLink entityKey={device.entityKey} label="Entity" />
        </div>
      )}
    </div>
  );
}
