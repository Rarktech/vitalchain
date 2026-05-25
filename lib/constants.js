export const PROJECT_ATTRIBUTE = 'vitalchain_ethns_arkiv_v1';
export const STORAGE_KEY = 'vitalchain_state_v3';
export const BRAGA_CHAIN_ID = 60138453102;
export const EXPLORER_BASE = 'https://explorer.braga.hoodi.arkiv.network';

export const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
export const SUI_FULLNODE = `https://fullnode.${SUI_NETWORK}.sui.io:443`;

export const READING_TYPES = {
  blood_pressure: {
    label: 'Blood Pressure', unit: 'mmHg', primaryLabel: 'Systolic',
    secondaryLabel: 'Diastolic', defaults: [120, 80], normal: [90, 140],
    color: 'oklch(0.78 0.16 30)',
  },
  heart_rate: {
    label: 'Heart Rate', unit: 'bpm', primaryLabel: 'BPM',
    secondaryLabel: null, defaults: [72], normal: [50, 100],
    color: 'oklch(0.7 0.22 25)',
  },
  spo2: {
    label: 'Blood Oxygen', unit: '%', primaryLabel: 'SpO₂',
    secondaryLabel: null, defaults: [98], normal: [94, 100],
    color: 'oklch(0.78 0.15 220)',
  },
  weight: {
    label: 'Weight', unit: 'kg', primaryLabel: 'Weight',
    secondaryLabel: null, defaults: [70], normal: null,
    color: 'oklch(0.78 0.1 270)',
  },
  temperature: {
    label: 'Temperature', unit: '°C', primaryLabel: 'Temp',
    secondaryLabel: null, defaults: [36.6], normal: [36, 37.5],
    color: 'oklch(0.78 0.17 60)',
  },
  glucose: {
    label: 'Blood Glucose', unit: 'mg/dL', primaryLabel: 'Glucose',
    secondaryLabel: null, defaults: [95], normal: [70, 140],
    color: 'oklch(0.78 0.18 120)',
  },
};
