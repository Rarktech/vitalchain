'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import {
  PROJECT_ATTRIBUTE, STORAGE_KEY, BRAGA_CHAIN_ID, EXPLORER_BASE, READING_TYPES,
} from './constants';

// ─── Utilities ───────────────────────────────────────────────────────────────

const rand = (n = 8) => {
  const c = 'abcdef0123456789';
  let s = '';
  for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
};
const addr = () => '0x' + rand(40);
const txhash = () => '0x' + rand(64);
const entityKey = () => '0x' + rand(40);

export const shortAddr = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';
export const shortHash = (a, n = 8) => a ? `${a.slice(0, n)}…${a.slice(-4)}` : '';
export const fmtDate = (ms) => {
  const d = new Date(ms);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};
export const relTime = (ms) => {
  const diff = Date.now() - ms;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

// ─── AES-GCM (real Web Crypto) ───────────────────────────────────────────────

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptJSON(obj, walletAddress) {
  const key = await deriveKey(walletAddress, 'vitalchain_v1_salt');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptJSON(b64, walletAddress) {
  const key = await deriveKey(walletAddress, 'vitalchain_v1_salt');
  const combined = new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plain));
}

// ─── State ───────────────────────────────────────────────────────────────────

function initialState() {
  return {
    wallet: null,
    profile: null,
    aiOrchestrator: '0x' + 'a1c4'.repeat(10),
    entities: {},
    activity: [],
    demoMode: true,
  };
}

function loadState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState(s) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ─── Mock Arkiv entity layer ──────────────────────────────────────────────────

async function arkivCreateEntity(state, { entityType, owner, creator, attributes, payload, expiresInDays }) {
  await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
  const key = entityKey();
  const tx = txhash();
  const now = Date.now();
  const entity = {
    entityKey: key,
    entityType,
    txHash: tx,
    $owner: owner,
    $creator: creator,
    createdAt: now,
    expiresAt: now + expiresInDays * 86400 * 1000,
    expiresInDays,
    attributes: [{ key: 'project', value: PROJECT_ATTRIBUTE }, ...attributes],
    payload,
  };
  state.entities[key] = entity;
  state.activity.unshift({
    at: now, type: 'create', entityType, entityKey: key, txHash: tx,
    summary: summarizeEntity(entity),
  });
  return entity;
}

function summarizeEntity(e) {
  if (e.entityType === 'biometric_reading') {
    const t = READING_TYPES[e.attributes.find(a => a.key === 'readingType')?.value];
    const v = e.attributes.find(a => a.key === 'primaryValue')?.value;
    const v2 = e.attributes.find(a => a.key === 'secondaryValue')?.value;
    const vs = (v2 != null && v2 !== '') ? `${v}/${v2}` : v;
    return `${t?.label || 'Reading'} ${vs} ${t?.unit || ''}`;
  }
  if (e.entityType === 'device') return `Registered ${e.payload?.name || 'device'}`;
  if (e.entityType === 'ai_analysis') return e.payload?.question?.slice(0, 60) || 'AI analysis';
  if (e.entityType === 'data_share') {
    return `${e.attributes.find(a => a.key === 'shareType')?.value || 'share'} • ${e.expiresInDays}d`;
  }
  return e.entityType;
}

function arkivQuery(state, filters) {
  let results = Object.values(state.entities);
  results = results.filter(e => {
    if (e.expiresAt < Date.now()) return false;
    for (const [k, v] of Object.entries(filters)) {
      if (k === '$owner' && e.$owner !== v) return false;
      if (k === '$creator' && e.$creator !== v) return false;
      if (k === 'entityType' && e.entityType !== v) return false;
      if (k === 'readingType') {
        const a = e.attributes.find(a => a.key === 'readingType')?.value;
        if (a !== v) return false;
      }
    }
    return true;
  });
  return results;
}

function gcExpired(state) {
  const now = Date.now();
  let changed = false;
  for (const k of Object.keys(state.entities)) {
    if (state.entities[k].expiresAt < now) {
      delete state.entities[k];
      changed = true;
    }
  }
  return changed;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const VCContext = createContext(null);
export const useVC = () => useContext(VCContext);

export function VCProvider({ children }) {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return initialState();
    return loadState() || initialState();
  });
  const [toasts, setToasts] = useState([]);

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    const t = setInterval(() => {
      setState(s => {
        const copy = JSON.parse(JSON.stringify(s));
        if (gcExpired(copy)) return copy;
        return s;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const pushToast = (toast) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, ...toast }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), toast.duration || 4500);
  };

  // ─── Actions ───────────────────────────────────────────────────────────────

  const connectWallet = async (overrideAddress) => {
    const address = overrideAddress || addr();
    setState(s => {
      const isSameAddress = s.wallet?.address === address;
      return {
        ...s,
        wallet: { address, balance: s.wallet?.balance || '0 SUI', connectedAt: Date.now() },
        entities: isSameAddress ? s.entities : {},
        activity: isSameAddress ? s.activity : [],
        profile: isSameAddress ? s.profile : null,
      };
    });
    pushToast({ title: 'Wallet connected', body: 'Sui Testnet' });
    return address;
  };

  const disconnectWallet = () => {
    setState(s => ({ ...s, wallet: null }));
  };

  const resetAll = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    setState(initialState());
    pushToast({ title: 'State reset', body: 'All entities cleared from local cache' });
  };

  const addReading = async ({ deviceKey, readingType, primaryValue, secondaryValue, note, encrypt }) => {
    if (!state.wallet) throw new Error('no wallet');
    const device = state.entities[deviceKey];
    if (!device) throw new Error('no device');

    const payloadObj = { value: primaryValue, secondaryValue, note: note || '', deviceId: device.$creator };
    let payload;
    if (encrypt) {
      payload = { encrypted: true, ciphertext: await encryptJSON(payloadObj, state.wallet.address) };
    } else {
      payload = payloadObj;
    }

    const newState = JSON.parse(JSON.stringify(state));
    const entity = await arkivCreateEntity(newState, {
      entityType: 'biometric_reading',
      owner: state.wallet.address,
      creator: device.$creator,
      attributes: [
        { key: 'entityType', value: 'biometric_reading' },
        { key: 'deviceId', value: device.$creator },
        { key: 'readingType', value: readingType },
        { key: 'primaryValue', value: primaryValue },
        { key: 'secondaryValue', value: secondaryValue ?? '' },
        { key: 'unit', value: READING_TYPES[readingType].unit },
        { key: 'recordedAt', value: Date.now() },
        { key: 'encrypted', value: encrypt ? 1 : 0 },
      ],
      payload,
      expiresInDays: 365,
    });
    setState(newState);
    pushToast({ title: 'Reading written to chain', body: summarizeEntity(entity), hash: entity.txHash });
    return entity;
  };

  const registerDevice = async ({ name, model, deviceType, firmware }) => {
    if (!state.wallet) throw new Error('no wallet');
    const deviceWallet = addr();
    const newState = JSON.parse(JSON.stringify(state));
    const entity = await arkivCreateEntity(newState, {
      entityType: 'device',
      owner: state.wallet.address,
      creator: deviceWallet,
      attributes: [
        { key: 'entityType', value: 'device' },
        { key: 'deviceId', value: deviceWallet },
        { key: 'deviceType', value: deviceType },
        { key: 'owner', value: state.wallet.address },
        { key: 'registeredAt', value: Date.now() },
      ],
      payload: { name, model, firmwareVersion: firmware || '1.0.0' },
      expiresInDays: 365,
    });
    setState(newState);
    pushToast({ title: `${name} registered`, body: `Device wallet ${shortAddr(deviceWallet)}`, hash: entity.txHash });
    return entity;
  };

  const writeAnalysis = async ({ question, analysis, trend, recommendations, readingKeys, model }) => {
    const newState = JSON.parse(JSON.stringify(state));
    const entity = await arkivCreateEntity(newState, {
      entityType: 'ai_analysis',
      owner: state.wallet.address,
      creator: state.aiOrchestrator,
      attributes: [
        { key: 'entityType', value: 'ai_analysis' },
        { key: 'owner', value: state.wallet.address },
        { key: 'analysisType', value: 'trend_summary' },
        { key: 'model', value: model || 'claude-haiku-4-5' },
        { key: 'readingCount', value: readingKeys.length },
        { key: 'generatedAt', value: Date.now() },
      ],
      payload: { question, analysis, trend, readingKeys, recommendations: recommendations || [] },
      expiresInDays: 365,
    });
    setState(newState);
    pushToast({ title: 'AI analysis written to chain', body: `${readingKeys.length} readings analyzed`, hash: entity.txHash });
    return entity;
  };

  const createShare = async ({ entityKeys, shareType, durationDays, recipientNote }) => {
    const newState = JSON.parse(JSON.stringify(state));
    const accessKey = rand(32);
    const entity = await arkivCreateEntity(newState, {
      entityType: 'data_share',
      owner: state.wallet.address,
      creator: state.wallet.address,
      attributes: [
        { key: 'entityType', value: 'data_share' },
        { key: 'grantedBy', value: state.wallet.address },
        { key: 'shareType', value: shareType },
        { key: 'durationDays', value: durationDays },
        { key: 'createdAt', value: Date.now() },
      ],
      payload: { entityKeys, accessKey, recipientNote: recipientNote || '' },
      expiresInDays: durationDays,
    });
    setState(newState);
    pushToast({ title: 'Share created', body: `Expires in ${durationDays}d at the protocol layer`, hash: entity.txHash });
    return entity;
  };

  const revokeShare = (key) => {
    setState(s => {
      const c = JSON.parse(JSON.stringify(s));
      delete c.entities[key];
      c.activity.unshift({ at: Date.now(), type: 'revoke', entityType: 'data_share', entityKey: key, summary: 'Share revoked' });
      return c;
    });
    pushToast({ title: 'Share revoked', body: 'Entity deleted from chain' });
  };

  const deleteEntity = (key) => {
    setState(s => {
      const c = JSON.parse(JSON.stringify(s));
      delete c.entities[key];
      return c;
    });
  };

  const decryptReading = async (entity) => {
    if (!entity.payload?.encrypted) return entity.payload;
    return decryptJSON(entity.payload.ciphertext, state.wallet.address);
  };

  const saveProfile = async ({ name, dob, gender, heightCm, weightKg }) => {
    if (!state.wallet) throw new Error('no wallet');
    const newState = JSON.parse(JSON.stringify(state));
    await arkivCreateEntity(newState, {
      entityType: 'user_profile',
      owner: state.wallet.address,
      creator: state.wallet.address,
      attributes: [
        { key: 'entityType', value: 'user_profile' },
        { key: 'name', value: name },
        { key: 'dob', value: dob || '' },
        { key: 'gender', value: gender || '' },
        { key: 'heightCm', value: heightCm || '' },
        { key: 'weightKg', value: weightKg || '' },
        { key: 'createdAt', value: Date.now() },
      ],
      payload: { name, dob, gender, heightCm, weightKg },
      expiresInDays: 3650,
    });
    const profile = { name, dob: dob || '', gender: gender || '', heightCm: heightCm || '', weightKg: weightKg || '', completedAt: Date.now() };
    newState.profile = profile;
    setState(newState);
    pushToast({ title: 'Profile saved on-chain', body: `Welcome, ${name}!` });
    return profile;
  };

  const seedDemo = async (walletAddressOverride) => {
    const walletAddress = walletAddressOverride || state.wallet?.address;
    if (!walletAddress) return;
    await new Promise(r => setTimeout(r, 300));

    const now = Date.now();
    const entities = {};
    const activity = [];

    const mkDevice = (name, model, deviceType, firmware) => {
      const deviceWallet = addr();
      const key = entityKey();
      const tx = txhash();
      const ent = {
        entityKey: key, entityType: 'device', txHash: tx,
        $owner: walletAddress, $creator: deviceWallet,
        createdAt: now, expiresAt: now + 365 * 86400000, expiresInDays: 365,
        attributes: [
          { key: 'project', value: PROJECT_ATTRIBUTE },
          { key: 'entityType', value: 'device' },
          { key: 'deviceId', value: deviceWallet },
          { key: 'deviceType', value: deviceType },
          { key: 'owner', value: walletAddress },
          { key: 'registeredAt', value: now },
        ],
        payload: { name, model, firmwareVersion: firmware },
      };
      entities[key] = ent;
      activity.push({ at: now, type: 'create', entityType: 'device', entityKey: key, txHash: tx, summary: `Registered ${name}` });
      return { key, creator: deviceWallet };
    };

    const watch = mkDevice('Apex Watch S3', 'AW-S3', 'smartwatch', '4.2.1');
    const cuff = mkDevice('OmronConnect+', 'BP-7400', 'sensor', '2.0.3');
    const scale = mkDevice('Withings Body Pro', 'WBP-2', 'sensor', '1.8.0');

    const mkReading = (device, type, p1, p2, daysAgo) => {
      const recordedAt = now - daysAgo * 86400000 + Math.floor(Math.random() * 3600000);
      const key = entityKey();
      const tx = txhash();
      const ent = {
        entityKey: key, entityType: 'biometric_reading', txHash: tx,
        $owner: walletAddress, $creator: device.creator,
        createdAt: recordedAt, expiresAt: recordedAt + 365 * 86400000, expiresInDays: 365,
        attributes: [
          { key: 'project', value: PROJECT_ATTRIBUTE },
          { key: 'entityType', value: 'biometric_reading' },
          { key: 'deviceId', value: device.creator },
          { key: 'readingType', value: type },
          { key: 'primaryValue', value: p1 },
          { key: 'secondaryValue', value: p2 ?? '' },
          { key: 'unit', value: READING_TYPES[type].unit },
          { key: 'recordedAt', value: recordedAt },
          { key: 'encrypted', value: 0 },
        ],
        payload: { value: p1, secondaryValue: p2, note: '', deviceId: device.creator },
      };
      entities[key] = ent;
    };

    for (let d = 29; d >= 0; d--) {
      const base = 68 + Math.sin(d * 0.4) * 6 + (d > 18 ? 5 : 0) + Math.random() * 4 - 2;
      mkReading(watch, 'heart_rate', Math.round(base), null, d);
    }
    for (let d = 28; d >= 0; d -= 2) {
      const sys = Math.round(132 - (28 - d) * 0.3 + Math.random() * 4 - 2);
      const dia = Math.round(86 - (28 - d) * 0.15 + Math.random() * 3 - 1.5);
      mkReading(cuff, 'blood_pressure', sys, dia, d);
    }
    for (let d = 20; d >= 0; d -= 3) {
      mkReading(watch, 'spo2', 96 + Math.floor(Math.random() * 3), null, d);
    }
    for (let d = 28; d >= 0; d -= 4) {
      mkReading(scale, 'weight', +(78.4 - (28 - d) * 0.08 + Math.random() * 0.3).toFixed(1), null, d);
    }

    Object.values(entities)
      .filter(e => e.entityType === 'biometric_reading')
      .sort((a, b) => (a.attributes.find(x => x.key === 'recordedAt')?.value) - (b.attributes.find(x => x.key === 'recordedAt')?.value))
      .slice(-6)
      .forEach(e => {
        activity.push({ at: e.createdAt, type: 'create', entityType: 'biometric_reading', entityKey: e.entityKey, txHash: e.txHash, summary: summarizeEntity(e) });
      });

    activity.sort((a, b) => b.at - a.at);

    setState(s => ({ ...s, entities: { ...s.entities, ...entities }, activity: [...activity, ...s.activity] }));
    pushToast({ title: 'Demo data seeded', body: '3 devices · 50+ readings on-chain', duration: 5000 });
  };

  const value = {
    state,
    PROJECT_ATTRIBUTE,
    BRAGA_CHAIN_ID,
    EXPLORER_BASE,
    READING_TYPES,
    shortAddr, shortHash, fmtDate, relTime,
    connectWallet, disconnectWallet, resetAll,
    addReading, registerDevice, writeAnalysis,
    createShare, revokeShare, deleteEntity,
    decryptReading, saveProfile, seedDemo,
    pushToast, toasts,
    queryEntities: (filters) => arkivQuery(state, filters),
  };

  return <VCContext.Provider value={value}>{children}</VCContext.Provider>;
}
