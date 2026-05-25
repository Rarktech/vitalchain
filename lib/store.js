'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import {
  PROJECT_ATTRIBUTE, STORAGE_KEY, BRAGA_CHAIN_ID, EXPLORER_BASE, READING_TYPES,
} from './constants';
import {
  arkivCreate, arkivDelete, arkivLoadAll,
} from './arkiv';

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

const SESSION_KEY = 'vc_wallet_session';

function loadState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    // Require an active tab session — prevents stale wallet from skipping auth
    if (saved?.wallet) {
      const session = sessionStorage.getItem(SESSION_KEY);
      if (session !== saved.wallet.address) {
        return { ...saved, wallet: null };
      }
    }
    return saved;
  } catch { return null; }
}

function saveState(s) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

// ─── Entity helpers ───────────────────────────────────────────────────────────

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

// Local cache query — entities are pre-loaded from chain on connect
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

// Build a local entity object for immediate cache update after a chain write
function buildLocalEntity({ entityKey, txHash, entityType, evmAddress, createdAt, expiresInDays, attributes, payload }) {
  const now = createdAt || Date.now();
  return {
    entityKey,
    entityType,
    txHash,
    $owner: evmAddress,
    $creator: evmAddress,
    createdAt: now,
    expiresAt: now + expiresInDays * 86400000,
    expiresInDays,
    attributes: [
      { key: 'project', value: PROJECT_ATTRIBUTE },
      { key: 'entityType', value: entityType },
      { key: 'createdAt', value: now },
      { key: 'expiresInDays', value: expiresInDays },
      ...attributes,
    ],
    payload,
  };
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
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_KEY, address);
    }
    setState(s => {
      const isDifferentAddress = s.wallet?.address && s.wallet.address !== address;
      return {
        ...s,
        wallet: { address, balance: s.wallet?.balance || '0 SUI', connectedAt: Date.now() },
        entities: isDifferentAddress ? {} : s.entities,
        activity: isDifferentAddress ? [] : s.activity,
        profile: isDifferentAddress ? null : s.profile,
      };
    });
    pushToast({ title: 'Wallet connected', body: 'Sui Testnet' });

    // Load entities from Arkiv chain in background — merges into local cache
    arkivLoadAll(address).then(chainEntities => {
      if (!chainEntities.length) return;
      const entityMap = {};
      chainEntities.forEach(e => { entityMap[e.entityKey] = e; });
      setState(s => ({ ...s, entities: { ...s.entities, ...entityMap } }));
    }).catch(() => { /* chain load failure is non-fatal */ });

    return address;
  };

  const disconnectWallet = () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_KEY);
    setState(s => ({ ...s, wallet: null }));
  };

  const resetAll = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    }
    setState(initialState());
    pushToast({ title: 'State reset', body: 'All entities cleared from local cache' });
  };

  const addReading = async ({ deviceKey, readingType, primaryValue, secondaryValue, note, encrypt }) => {
    if (!state.wallet) throw new Error('no wallet');
    const device = state.entities[deviceKey];
    if (!device) throw new Error('no device');

    const deviceId = device.attributes.find(a => a.key === 'deviceId')?.value || device.$creator;
    const payloadObj = { value: primaryValue, secondaryValue, note: note || '', deviceId };
    let finalPayload;
    if (encrypt) {
      finalPayload = { encrypted: true, ciphertext: await encryptJSON(payloadObj, state.wallet.address) };
    } else {
      finalPayload = payloadObj;
    }

    const now = Date.now();
    const attrs = [
      { key: 'deviceId', value: deviceId },
      { key: 'readingType', value: readingType },
      { key: 'primaryValue', value: primaryValue },
      { key: 'secondaryValue', value: secondaryValue ?? '' },
      { key: 'unit', value: READING_TYPES[readingType].unit },
      { key: 'recordedAt', value: now },
      { key: 'encrypted', value: encrypt ? 1 : 0 },
    ];

    const result = await arkivCreate(state.wallet.address, {
      entityType: 'biometric_reading',
      attributes: attrs,
      payload: finalPayload,
      expiresInDays: 365,
    });

    const entity = buildLocalEntity({
      entityKey: result.entityKey,
      txHash: result.txHash,
      entityType: 'biometric_reading',
      evmAddress: result.evmAddress,
      createdAt: result.createdAt,
      expiresInDays: 365,
      attributes: attrs,
      payload: finalPayload,
    });

    setState(s => {
      const c = JSON.parse(JSON.stringify(s));
      c.entities[entity.entityKey] = entity;
      c.activity.unshift({ at: now, type: 'create', entityType: 'biometric_reading', entityKey: entity.entityKey, txHash: entity.txHash, summary: summarizeEntity(entity) });
      return c;
    });
    pushToast({ title: 'Reading written to chain', body: summarizeEntity(entity), hash: entity.txHash });
    return entity;
  };

  const registerDevice = async ({ name, model, deviceType, firmware }) => {
    if (!state.wallet) throw new Error('no wallet');
    const now = Date.now();
    const attrs = [
      { key: 'deviceType', value: deviceType },
      { key: 'owner', value: state.wallet.address },
      { key: 'registeredAt', value: now },
    ];

    const result = await arkivCreate(state.wallet.address, {
      entityType: 'device',
      attributes: attrs,
      payload: { name, model, firmwareVersion: firmware || '1.0.0' },
      expiresInDays: 365,
    });

    const allAttrs = [
      { key: 'deviceId', value: result.entityKey },
      ...attrs,
    ];

    const entity = buildLocalEntity({
      entityKey: result.entityKey,
      txHash: result.txHash,
      entityType: 'device',
      evmAddress: result.evmAddress,
      createdAt: result.createdAt,
      expiresInDays: 365,
      attributes: allAttrs,
      payload: { name, model, firmwareVersion: firmware || '1.0.0' },
    });

    setState(s => {
      const c = JSON.parse(JSON.stringify(s));
      c.entities[entity.entityKey] = entity;
      c.activity.unshift({ at: now, type: 'create', entityType: 'device', entityKey: entity.entityKey, txHash: entity.txHash, summary: `Registered ${name}` });
      return c;
    });
    pushToast({ title: `${name} registered`, body: `Device on Arkiv Braga`, hash: entity.txHash });
    return entity;
  };

  const writeAnalysis = async ({ question, analysis, trend, recommendations, readingKeys, model }) => {
    const now = Date.now();
    const attrs = [
      { key: 'owner', value: state.wallet.address },
      { key: 'analysisType', value: 'trend_summary' },
      { key: 'model', value: model || 'claude-haiku-4-5' },
      { key: 'readingCount', value: readingKeys.length },
      { key: 'generatedAt', value: now },
    ];

    const result = await arkivCreate(state.wallet.address, {
      entityType: 'ai_analysis',
      attributes: attrs,
      payload: { question, analysis, trend, readingKeys, recommendations: recommendations || [] },
      expiresInDays: 365,
    });

    const entity = buildLocalEntity({
      entityKey: result.entityKey,
      txHash: result.txHash,
      entityType: 'ai_analysis',
      evmAddress: result.evmAddress,
      createdAt: result.createdAt,
      expiresInDays: 365,
      attributes: attrs,
      payload: { question, analysis, trend, readingKeys, recommendations: recommendations || [] },
    });

    setState(s => {
      const c = JSON.parse(JSON.stringify(s));
      c.entities[entity.entityKey] = entity;
      c.activity.unshift({ at: now, type: 'create', entityType: 'ai_analysis', entityKey: entity.entityKey, txHash: entity.txHash, summary: question?.slice(0, 60) || 'AI analysis' });
      return c;
    });
    pushToast({ title: 'AI analysis written to chain', body: `${readingKeys.length} readings analyzed`, hash: entity.txHash });
    return entity;
  };

  const createShare = async ({ entityKeys, shareType, durationDays, recipientNote }) => {
    const now = Date.now();
    const accessKey = rand(32);
    const attrs = [
      { key: 'grantedBy', value: state.wallet.address },
      { key: 'shareType', value: shareType },
      { key: 'durationDays', value: durationDays },
    ];

    const result = await arkivCreate(state.wallet.address, {
      entityType: 'data_share',
      attributes: attrs,
      payload: { entityKeys, accessKey, recipientNote: recipientNote || '' },
      expiresInDays: durationDays,
    });

    const entity = buildLocalEntity({
      entityKey: result.entityKey,
      txHash: result.txHash,
      entityType: 'data_share',
      evmAddress: result.evmAddress,
      createdAt: result.createdAt,
      expiresInDays: durationDays,
      attributes: attrs,
      payload: { entityKeys, accessKey, recipientNote: recipientNote || '' },
    });

    setState(s => {
      const c = JSON.parse(JSON.stringify(s));
      c.entities[entity.entityKey] = entity;
      c.activity.unshift({ at: now, type: 'create', entityType: 'data_share', entityKey: entity.entityKey, txHash: entity.txHash, summary: `${shareType} • ${durationDays}d` });
      return c;
    });
    pushToast({ title: 'Share created', body: `Expires in ${durationDays}d at the protocol layer`, hash: entity.txHash });
    return entity;
  };

  const revokeShare = async (key) => {
    try {
      await arkivDelete(state.wallet.address, key);
    } catch (err) {
      console.warn('Chain delete failed (removing locally):', err.message);
    }
    setState(s => {
      const c = JSON.parse(JSON.stringify(s));
      delete c.entities[key];
      c.activity.unshift({ at: Date.now(), type: 'revoke', entityType: 'data_share', entityKey: key, summary: 'Share revoked' });
      return c;
    });
    pushToast({ title: 'Share revoked', body: 'Entity deleted from Arkiv chain' });
  };

  const deleteEntity = async (key) => {
    try {
      await arkivDelete(state.wallet.address, key);
    } catch {}
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
    const now = Date.now();
    const attrs = [
      { key: 'name', value: name },
      { key: 'dob', value: dob || '' },
      { key: 'gender', value: gender || '' },
      { key: 'heightCm', value: heightCm || '' },
      { key: 'weightKg', value: weightKg || '' },
    ];

    const result = await arkivCreate(state.wallet.address, {
      entityType: 'user_profile',
      attributes: attrs,
      payload: { name, dob, gender, heightCm, weightKg },
      expiresInDays: 3650,
    });

    const entity = buildLocalEntity({
      entityKey: result.entityKey,
      txHash: result.txHash,
      entityType: 'user_profile',
      evmAddress: result.evmAddress,
      createdAt: result.createdAt,
      expiresInDays: 3650,
      attributes: attrs,
      payload: { name, dob, gender, heightCm, weightKg },
    });

    const profile = { name, dob: dob || '', gender: gender || '', heightCm: heightCm || '', weightKg: weightKg || '', completedAt: now };

    setState(s => {
      const c = JSON.parse(JSON.stringify(s));
      c.entities[entity.entityKey] = entity;
      c.profile = profile;
      return c;
    });
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
