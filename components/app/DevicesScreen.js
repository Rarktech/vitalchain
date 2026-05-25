'use client';

import { useState } from 'react';
import { useVC } from '@/lib/store';
import Glyph from '@/components/ui/Glyph';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import Empty from '@/components/ui/Empty';
import DeviceCard from './DeviceCard';

function RegisterDeviceModal({ onClose }) {
  const { registerDevice } = useVC();
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [type, setType] = useState('smartwatch');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!name || !model) return;
    setSubmitting(true);
    await registerDevice({ name, model, deviceType: type });
    setSubmitting(false);
    onClose();
  };

  const presets = [
    { name: 'Apple Watch Ultra', model: 'AW-U2', type: 'smartwatch' },
    { name: 'Oura Ring Gen 4', model: 'OR-G4', type: 'sensor' },
    { name: 'Dexcom G7', model: 'DG7', type: 'sensor' },
    { name: 'Manual logger', model: 'manual-v1', type: 'manual' },
  ];

  return (
    <Modal
      title="Register device"
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={submit} disabled={submitting || !name || !model}>
            {submitting ? <><Spinner /> Writing to chain</> : <><Glyph type="plus" size={12} /> Register on Arkiv</>}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
          A new wallet will be generated for this device. That wallet becomes the immutable <span className="accent mono">$creator</span> of every reading it signs.
        </div>
        <div className="field">
          <label className="label">Device name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Apple Watch Ultra" />
        </div>
        <div className="grid-2-eq">
          <div className="field">
            <label className="label">Model</label>
            <input className="input mono" value={model} onChange={e => setModel(e.target.value)} placeholder="AW-U2" />
          </div>
          <div className="field">
            <label className="label">Type</label>
            <select className="select" value={type} onChange={e => setType(e.target.value)}>
              <option value="smartwatch">Smartwatch</option>
              <option value="sensor">Sensor</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 8 }}>Quick presets</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {presets.map(p => (
              <button key={p.name} className="btn xs" onClick={() => { setName(p.name); setModel(p.model); setType(p.type); }}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function DevicesScreen({ navigate }) {
  const { state, queryEntities } = useVC();
  const devices = queryEntities({ entityType: 'device', $owner: state.wallet.address });
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="page-title">Devices</div>
          <div className="page-sub">Each device has its own wallet. The device's wallet is $creator of every reading — proving the reading came from <em>this</em> hardware.</div>
        </div>
        <button className="btn primary" onClick={() => setShowRegister(true)}>
          <Glyph type="plus" size={12} /> Register device
        </button>
      </div>

      <div className="device-grid">
        {devices.map(d => <DeviceCard key={d.entityKey} device={d} />)}
        {devices.length === 0 && (
          <div style={{ gridColumn: '1/-1' }}>
            <Empty
              icon="device"
              title="No devices registered"
              sub="Devices sign their own readings — register one to start the chain of provenance"
              action={<button className="btn primary" onClick={() => setShowRegister(true)}>Register first device</button>}
            />
          </div>
        )}
      </div>

      {showRegister && <RegisterDeviceModal onClose={() => setShowRegister(false)} />}
    </div>
  );
}
