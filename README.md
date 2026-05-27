<div align="center">
<img width="1810" height="824" alt="20260527-1902-14 8031138" src="https://github.com/user-attachments/assets/6913f490-7b52-47f9-94f4-ee91a7be6f81" />

<br/>

# VitalChain

### Your Health Data. Your AI. Your Chain.

<br/>

![Theme](https://img.shields.io/badge/Theme-AI%20%2B%20Privacy%20%2B%20DePIN-00e676?style=flat-square)
![Network](https://img.shields.io/badge/Arkiv-Braga%20Testnet-6c63ff?style=flat-square)
![Sui](https://img.shields.io/badge/Auth-Sui%20zkLogin-4a90d9?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=flat-square)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

<br/>

> **ETHNS × Arkiv Builder Challenge** · AI + Privacy + DePIN Hybrid Track · Prize: $3,000 USDC

<br/>

[🔴 The Problem](#-the-problem) · [💡 The Solution](#-the-solution) · [⚙️ Local Setup](#️-local-setup) · [🏗️ Architecture](#️-arkiv-architecture) · [🔍 Verify On-Chain](#-verify-independently)

</div>

---

## What Is VitalChain?

VitalChain is a **web3-native personal health intelligence platform** where every biometric reading, AI insight, and data-sharing grant is a wallet-owned entity on the **Arkiv blockchain** — controlled by the patient, not a platform, insurer, or tech company.

- Every device has its own wallet. Every reading it writes carries that wallet as the immutable `$creator` — **DePIN provenance** baked in at the protocol layer
- The patient's Sui address is `$owner` of every entity they generate
- An AI layer reads those on-chain readings and writes its analysis back as a new entity — also owned by the patient
- Time-limited shares **self-destruct at the Arkiv protocol layer** when they expire. No server delete job. No policy. Just math.

VitalChain is the only submission covering all three challenge themes simultaneously in a single coherent product.

---
<img width="1826" height="814" alt="20260527-1946-35 1260243" src="https://github.com/user-attachments/assets/cbdd2902-166d-4a6d-a29d-77b88425ff4d" />
(authentication page)

## 🔴 The Problem

Health data is the most personal data a human generates — and the data over which individuals have the **least control**.

| Failure | Reality |
|---|---|
| **Fragmentation** | A single person's health data is spread across an average of **11 disconnected systems** — hospital EHR, wearable apps, pharmacy records, insurance portals, fitness trackers. No portable, patient-controlled record exists. |
| **Platform ownership** | Apple owns your heart rate. Fitbit owns your sleep. Your GP owns your records. When you switch providers, your data stays behind. Every platform treats health data as a product asset — monetised for advertising and research without meaningful consent. |
| **AI blindness** | AI health tools only see their own silo. An AI trained on your Apple Watch cannot see your GP notes. An AI at your pharmacy cannot see your allergy history. The AI is only as good as the fragment it can access. |
| **No provenance** | When a device reports a reading, there is no cryptographic proof that the reading came from that device unmodified. Insurance and research integrity depend entirely on trusting the platform's word. |

The global digital health market is projected to exceed **$660 billion by 2028**. The patient data ownership segment is the fastest-growing subsegment. VitalChain demonstrates, on a real testnet, exactly the architecture that underpins a production system in this market.

---

## 💡 The Solution

VitalChain inverts the ownership model entirely using Arkiv's DB-Chain primitives.

```
Traditional Model                  VitalChain Model
─────────────────                  ────────────────
Device → App Server                Device Wallet  ($creator, immutable)
App Server → Platform DB                  ↓
Platform owns your data            Arkiv Entity   (tamper-proof, on-chain)
You get a dashboard                       ↓
                                   Patient Sui Address  ($owner, you control it)
```

| Health Requirement | Arkiv Primitive That Solves It |
|---|---|
| Tamper-proof device provenance | `$creator` is immutable — the device wallet that signed the entity cannot be rewritten |
| Patient data control | `$owner` controls update and delete — transferable to a new device or guardian |
| Private payload, public indexing | Payload AES-GCM encrypted client-side; numeric attributes (date, type, value) remain queryable |
| Time-limited sharing | `expiresIn` on `DataShare` entities enforced at the protocol layer — no server required |
| Composable AI context | Any AI agent queries the same Arkiv namespace with `createPublicClient` — portability is structural |
| Auditability | Every entity has a key visible in the Braga explorer — independently verifiable |

---
<img width="1828" height="824" alt="20260527-1941-53 5801206" src="https://github.com/user-attachments/assets/2f1cb651-3376-4356-914a-0fca782c89f1" />
(dashboard overview)

## 🏗️ Arkiv Architecture

**`PROJECT_ATTRIBUTE`** = `vitalchain_ethns_arkiv_v1`

Every `createEntity` call and every `buildQuery` chain in VitalChain stamps this as the first attribute — namespacing all VitalChain data in the shared Braga entity store.

### Entity Types

#### `device` — DePIN Provenance
Written once on first device registration. The device's own wallet is `$creator`.

```js
attributes: [
  { key: 'project',      value: 'vitalchain_ethns_arkiv_v1' },
  { key: 'entityType',   value: 'device' },
  { key: 'deviceId',     value: '0x...' },
  { key: 'deviceType',   value: 'smartwatch' },     // smartwatch | sensor | manual
  { key: 'suiOwner',     value: '0x...' },          // patient Sui address
  { key: 'registeredAt', value: 1716480000000 },    // numeric — range-queryable
]
expiresIn: 365 days
$creator:  device wallet  ← DePIN: device owns its identity
```

#### `biometric_reading` — Core Health Data
One entity per measurement. Device wallet is `$creator` (immutable). Patient Sui address is `$owner`.

```js
attributes: [
  { key: 'project',        value: 'vitalchain_ethns_arkiv_v1' },
  { key: 'entityType',     value: 'biometric_reading' },
  { key: 'deviceId',       value: '0x...' },         // FK → Device entity key
  { key: 'readingType',    value: 'blood_pressure' }, // heart_rate|spo2|weight|temp|glucose
  { key: 'primaryValue',   value: 120 },              // numeric — range-queryable
  { key: 'secondaryValue', value: 80 },               // diastolic or secondary metric
  { key: 'unit',           value: 'mmHg' },
  { key: 'recordedAt',     value: 1716480000000 },    // numeric — range-queryable
  { key: 'encrypted',      value: 1 },                // 1 = payload is AES-GCM ciphertext
]
payload:  AES-GCM encrypted envelope  OR  plain { value, unit, note, deviceId }
expiresIn: 365 days
$creator:  device wallet    ← IMMUTABLE tamper-proof DePIN provenance
$owner:    patient address  ← patient controls their health data
```

#### `ai_analysis` — Patient-Owned AI Insights
Written back to Arkiv after AI processes the user's readings. Patient is `$owner` — the insight belongs to them, not the AI provider.

```js
attributes: [
  { key: 'project',      value: 'vitalchain_ethns_arkiv_v1' },
  { key: 'entityType',   value: 'ai_analysis' },
  { key: 'suiOwner',     value: '0x...' },           // patient address
  { key: 'analysisType', value: 'trend_summary' },
  { key: 'model',        value: 'gemini-2.5-flash' },
  { key: 'readingCount', value: 30 },
  { key: 'generatedAt',  value: 1716480000000 },
]
payload:  { question, analysis, trend, readingKeys[], recommendations[] }
expiresIn: 365 days
$creator:  AI orchestrator wallet  ← proves which AI session generated this
$owner:    patient address         ← patient owns the insight
```

#### `data_share` — Time-Limited Access Grants *(The Killer Feature)*
`expiresIn` is enforced by the Arkiv protocol layer. The entity **literally ceases to exist** after the TTL — no server-side delete, no policy change.

```js
attributes: [
  { key: 'project',      value: 'vitalchain_ethns_arkiv_v1' },
  { key: 'entityType',   value: 'data_share' },
  { key: 'grantedBy',    value: '0x...' },           // patient address
  { key: 'shareType',    value: 'doctor' },          // doctor | researcher | emergency
  { key: 'durationDays', value: 7 },
  { key: 'createdAt',    value: 1716480000000 },
]
payload:  { entityKeys[], accessKey, recipientNote }
expiresIn: 1 | 7 | 30 days  ← USER CHOSEN, PROTOCOL ENFORCED
$owner:    patient address
```

### How Entities Relate

```
[device]          ──── deviceId attr ────►  [biometric_reading]
 $creator = device wallet                     $creator = device wallet (immutable)
                                              $owner   = patient address
                                                   │
                                         readingKeys in payload
                                                   ▼
                                           [ai_analysis]
                                             $creator = AI orchestrator
                                             $owner   = patient address

                                           [data_share]
                                             entityKeys → any readings/analyses
                                             expiresIn  = protocol-enforced TTL
```

---
<img width="1832" height="772" alt="20260527-1931-51 3403929" src="https://github.com/user-attachments/assets/c2d41b99-529d-4caf-8683-ed7c5d4e97f8" />
(Share your biodata)
## 🔐 Privacy Architecture

Structure is public. Content is private. That is the intentional design.

| Data Element | Arkiv Payload | Arkiv Attributes | Who Can Read |
|---|---|---|---|
| Reading type (blood pressure) | Encrypted | **Plaintext** | Anyone — needed for queries |
| Numeric primary value | Encrypted | **Plaintext numeric** | Anyone — needed for range queries |
| Note / symptom description | Encrypted | Not stored | **Patient only** |
| Device ID | Encrypted in payload | **Plaintext** | Anyone — needed for device queries |
| AI analysis text | Plaintext | — | Anyone with the entity key |
| Share access key | Encrypted | Not stored | **Recipient only** |

**How the encryption works:**
- Key derivation: `PBKDF2(walletAddress, 'vitalchain_v1_salt', 100_000 iterations, SHA-256, 256-bit)`
- Encryption: `AES-GCM` with 96-bit random IV prepended to ciphertext, stored as base64 in the payload
- Decryption happens **entirely in the browser** — the decrypted value is never sent to a server

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (App Router) with React 19 |
| **Blockchain** | Arkiv Braga testnet · `@arkiv-network/sdk` ^0.6.8 |
| **Auth** | Sui zkLogin (Google OAuth → Mysten Labs prover) + Sui Wallet via `@mysten/dapp-kit` |
| **Sui SDK** | `@mysten/sui` ^2.17.0 · `@mysten/zklogin` ^0.8.1 |
| **AI** | Google Gemini 2.5 Flash (server-side via `/api/ai`) — cites on-chain entity keys in responses |
| **State** | React Context + localStorage cache |
| **Data fetching** | `@tanstack/react-query` ^5 |
| **Fonts** | Geist Sans + Geist Mono (via `next/font`) |
| **Styling** | Custom CSS with `oklch` design tokens |
| **Crypto** | Web Crypto API (browser-native AES-GCM, PBKDF2) |
| **Deployment** | Vercel |

---
<img width="1832" height="812" alt="20260527-1936-41 6516832" src="https://github.com/user-attachments/assets/60bf182e-7d76-488a-9dfa-d5d2f58bc8a3" />
(Log a new reading)
## 🗺️ App Routes

| Route | Description |
|---|---|
| `/` | Marketing landing page — pitch, features, architecture diagram |
| `/app` | Main application — requires wallet connection (zkLogin or Sui wallet) |
| `/share/[id]?key=...` | Public share view — no wallet needed, reads a `DataShare` entity |

### Inside `/app`

| Screen | How to reach |
|---|---|
| **Dashboard** | Default view — trend chart, metric cards, activity feed with on-chain links |
| **Health Vault** | Sidebar → "Health Vault" — full reading history, filter, decrypt toggle |
| **Devices** | Sidebar → "Devices" — registered devices with `$creator` addresses |
| **AI Insights** | Sidebar → "AI Insights" — ask health questions, view written-back entities |
| **Active Shares** | Sidebar → "Active Shares" — manage live share links |
| **Independent Verify** | Sidebar → "Independent Verify" — copy-paste SDK queries |

---
<img width="1834" height="822" alt="20260527-1939-26 2178470" src="https://github.com/user-attachments/assets/121a4dec-1db7-45cd-b6af-5a1f3e3ae1a8" />
(add a new device)

## ⚙️ Local Setup

### Prerequisites

| Tool | Version | Check |
|---|---|---|
| **Node.js** | ≥ 18.17 | `node --version` |
| **npm** | ≥ 9 | `npm --version` |
| **Git** | any | `git --version` |
| **Browser** | Chrome / Edge / Firefox | — |

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/rarktech/vitalchain.git
cd vitalchain
```

---

### Step 2 — Install dependencies

```bash
npm install
```

This installs Next.js 16, the Arkiv SDK, Mysten Sui + zkLogin, dApp Kit, TanStack Query, and all other dependencies. Expect ~60–90 seconds on a clean machine.

---

### Step 3 — Set up environment variables

The project ships with an example file. Copy it:

```bash
cp .env.local.example .env.local
```

Now open `.env.local` and fill in the required values:

```env
# ── Sui zkLogin (Google OAuth) ────────────────────────────────────────────────
# Required — this is what powers "Sign in with Google"
# 1. Go to https://console.cloud.google.com/ → APIs & Services → Credentials
# 2. Click "Create Credentials" → "OAuth 2.0 Client ID"
# 3. Application type: Web application
# 4. Under "Authorized JavaScript origins" add:
#      http://localhost:3000
#      (+ your Vercel domain when deploying)
# 5. Under "Authorized redirect URIs" add:
#      http://localhost:3000/app
# 6. Copy the Client ID here:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# zkLogin prover service (free Mysten Labs testnet prover — no key needed)
NEXT_PUBLIC_PROVER_URL=https://prover-dev.mystenlabs.com/v1

# Sui network
NEXT_PUBLIC_SUI_NETWORK=testnet

# ── Arkiv server wallet ────────────────────────────────────────────────────────
# Required — this EVM private key signs entities written to Arkiv Braga
# ⚠️  NEVER prefix with NEXT_PUBLIC_ — must stay server-side only
# Generate any EVM private key and fund it at the Braga faucet (Step 4)
ARKIV_SERVER_PVK=0xYOUR_PRIVATE_KEY_HERE

# ── Gemini AI ──────────────────────────────────────────────────────────────────
# Required for AI Insights — powers health trend analysis via Gemini 2.5 Flash
# Get a free key at https://aistudio.google.com/app/apikey (no billing required on free tier)
# ⚠️  NEVER prefix with NEXT_PUBLIC_ — must stay server-side only
GEMINI_API_KEY=your-gemini-api-key-here
```

> **Tip:** If you only want to browse and test read flows, you can skip `ARKIV_SERVER_PVK` and `GEMINI_API_KEY` — the app will fall back to local simulation mode for writes and a statistical fallback for AI insights.

---

### Step 4 — Get testnet funds (for on-chain writes)

The `ARKIV_SERVER_PVK` wallet needs a small amount of Braga ETH to pay gas for entity creation:

1. Derive the EVM address for your private key (any wallet tool, or run `node -e "const { privateKeyToAccount } = require('@arkiv-network/sdk/accounts'); console.log(privateKeyToAccount('0xYOUR_KEY').address)"`)
2. Visit the faucet: **https://braga.hoodi.arkiv.network/faucet/**
3. Paste the address and request funds

> The built-in faucet proxy is also available once the app is running at `POST /api/faucet`.

---

### Step 5 — Run the development server

```bash
npm run dev
```

The app will start on **http://localhost:3000**

---

### Step 6 — Connect and explore

1. Open **http://localhost:3000** — you'll see the landing page
2. Click **"Launch app"** (or navigate to **http://localhost:3000/app**)
3. Choose your sign-in method:
   - **Sign in with Google** — uses Sui zkLogin to derive a wallet address from your Google account. No browser extension required, no seed phrase
   - **Connect Sui wallet** — if you have the [Sui Wallet](https://suiwallet.com) browser extension installed
4. On first connect, demo data is seeded automatically (30 days of readings across 3 devices)
5. Explore:
   - **Dashboard** — live trend chart, entity count, activity feed
   - **Health Vault** → log a new reading → watch the Braga explorer link appear
   - **AI Insights** → ask *"Is my blood pressure trending better?"* → see the AI write an entity you own
   - **Active Shares** → create a 7-day share link → open in incognito → see the countdown

---

### Build for production

```bash
npm run build
npm start
```

### Deploy to Vercel (one command)

```bash
npx vercel --prod
```

Make sure to add all four env vars in the Vercel dashboard under **Settings → Environment Variables**. For `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, add your Vercel production domain to the OAuth client's authorised origins.

---

## 📁 Project Structure

```
vitalchain-nextjs/
│
├── app/                          # Next.js App Router
│   ├── page.js                   # Landing page (/)
│   ├── layout.js                 # Root layout + Providers
│   ├── globals.css               # Design tokens + base styles
│   ├── app/
│   │   └── page.js               # Main app (/app) — Connect → Onboard → AppShell
│   ├── share/
│   │   └── [id]/page.js          # Public share view (/share/:id)
│   └── api/
│       ├── ai/route.js           # POST — Gemini 2.5 Flash inference (uses GEMINI_API_KEY)
│       ├── arkiv/route.js        # POST — server-side entity create/delete
│       ├── rpc/route.js          # POST — Braga RPC proxy
│       └── faucet/route.js       # POST — Braga faucet proxy
│
├── components/
│   ├── app/                      # Main app screens
│   │   ├── AppShell.js           # Sidebar navigation + screen router
│   │   ├── Dashboard.js          # Dashboard with trend chart
│   │   ├── VaultScreen.js        # Health Vault (reading history)
│   │   ├── DevicesScreen.js      # Device registry
│   │   ├── DeviceCard.js         # Single device card
│   │   ├── InsightsScreen.js     # AI Insights screen
│   │   ├── SharesScreen.js       # Active shares
│   │   ├── VerifyScreen.js       # Independent verify panel
│   │   └── ReadingDetail.js      # Reading detail with on-chain metadata
│   ├── connect/
│   │   └── ConnectScreen.js      # zkLogin + Sui wallet connect
│   ├── onboarding/
│   │   └── OnboardingFlow.js     # First-time user onboarding
│   ├── modals/
│   │   ├── AddReadingModal.js    # Log new biometric reading
│   │   ├── CreateShareModal.js   # Create a time-limited share
│   │   └── ShareSuccessModal.js  # Share link + copy UI
│   ├── share/
│   │   └── ShareRecipientView.js # Public-facing share page
│   ├── landing/
│   │   ├── Nav.js                # Landing nav
│   │   ├── Hero.js               # Hero section
│   │   ├── Demo.js               # Interactive demo section
│   │   └── Sections.js           # Pillars, Numbers, EntityModel, Compare, etc.
│   ├── providers/
│   │   └── Providers.js          # QueryClient + SuiClientProvider + WalletProvider + VCProvider
│   └── ui/
│       ├── Glyph.js              # SVG icon system
│       ├── Hash.js               # Truncated address/hash display
│       ├── ExplorerLink.js       # Braga explorer deep link
│       ├── LineChart.js          # SVG trend chart
│       ├── Modal.js              # Modal wrapper
│       ├── Toasts.js             # Toast notification system
│       ├── Spinner.js            # Loading spinner
│       └── Empty.js              # Empty state component
│
├── lib/
│   ├── store.js                  # Global state (React Context), AES-GCM crypto, entity actions
│   ├── arkiv.js                  # Arkiv client — createPublicClient, entity normaliser, read/write helpers
│   ├── zklogin.js                # Sui zkLogin flow — ephemeral keypair, nonce, OAuth URL, proof
│   └── constants.js              # PROJECT_ATTRIBUTE, chain IDs, READING_TYPES
│
├── .env.local.example            # Template for required environment variables
├── jsconfig.json                 # Path alias (@/* → ./*)
├── next.config.mjs               # Next.js config
└── package.json                  # Dependencies
```

---

## 🔍 Verify Independently

VitalChain's data lives on a public blockchain. You do not need the VitalChain UI — or any trust in Rarktech — to verify it.

**Option 1 — Braga block explorer**
```
https://explorer.braga.hoodi.arkiv.network
```
Search any entity key shown in the app to see the raw on-chain record with `$owner`, `$creator`, attributes, and `expiresAt`.

**Option 2 — Arkiv SDK query**

```js
import { createPublicClient, http } from '@arkiv-network/sdk';
import { braga } from '@arkiv-network/sdk/chains';
import { eq } from '@arkiv-network/sdk/query';

const client = createPublicClient({ chain: braga, transport: http() });

// All VitalChain biometric readings
const result = await client
  .buildQuery()
  .where(eq('project', 'vitalchain_ethns_arkiv_v1'))
  .where(eq('entityType', 'biometric_reading'))
  .withAttributes(true)
  .withPayload(true)
  .limit(20)
  .fetch();

console.log(result.entities);
// → entities with $owner (patient address), $creator (device wallet), expiresAt
```

**Option 3 — Verify DePIN provenance**

```js
// Confirm a reading was produced by a specific device wallet
const readings = await client
  .buildQuery()
  .where(eq('project', 'vitalchain_ethns_arkiv_v1'))
  .where(eq('entityType', 'biometric_reading'))
  .where(eq('suiOwner', 'PATIENT_SUI_ADDRESS'))
  .withAttributes(true)
  .fetch();

// entity.$creator === device wallet address (set at creation, immutable)
// This is cryptographic proof of device provenance
```

---

## 🌐 Network References

| Resource | URL |
|---|---|
| Braga RPC | `https://braga.hoodi.arkiv.network/rpc` |
| Block Explorer | `https://explorer.braga.hoodi.arkiv.network` |
| Faucet | `https://braga.hoodi.arkiv.network/faucet/` |
| Entity Explorer | `https://data.arkiv.network` |
| Chain ID | `60138453102` |
| Sui Testnet | `https://fullnode.testnet.sui.io` |

---

## 🔑 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID for zkLogin sign-in |
| `NEXT_PUBLIC_PROVER_URL` | ✅ | Sui zkLogin prover endpoint (default provided in example) |
| `NEXT_PUBLIC_SUI_NETWORK` | optional | `testnet` (default) · `mainnet` · `devnet` |
| `ARKIV_SERVER_PVK` | ✅ | EVM private key for server-side Arkiv entity writes — **never expose as `NEXT_PUBLIC_`** |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key for AI health insights — get free at [aistudio.google.com](https://aistudio.google.com/app/apikey) — **never expose as `NEXT_PUBLIC_`** |

---

## 📊 Comparison

| Dimension | VitalChain | Typical Entry |
|---|---|---|
| Theme coverage | **AI + Privacy + DePIN (all 3)** | AI only, or AI + Privacy |
| Entity types | **4 distinct, richly related** | 2 minimal types |
| Ownership | **Device `$creator` + Patient `$owner`** | Platform holds `$owner` |
| AI | **AI reads chain, writes result back** | AI stores memories, never reads chain |
| Privacy | **AES-GCM client-side + public attributes** | None, or metadata only |
| Sharing | **Protocol-layer expiry (no server delete)** | Manual revocation |

---

## 👤 About — Rarktech

**Rarktech** is an independent builder at the intersection of decentralised infrastructure, AI, and data sovereignty — driven by the belief that the next meaningful wave of web3 applications will not be financial products. They will be systems that give people back control over the data they generate every day.

VitalChain is the first public demonstration of that thesis: not a proof-of-concept of what blockchain *can* do, but a working implementation of what it *should* do — replace platforms that own your data with a protocol that enforces your ownership of it.

Every pattern in this codebase is intentionally documented and independently verifiable on a public chain.

> *"Every health app you use owns your data. VitalChain gives it back."*

---

## 📄 License

MIT — see [`LICENSE`](./LICENSE)

---

<div align="center">

Built on **Arkiv Braga Testnet** · Authenticated via **Sui zkLogin** · Submitted to ETHNS × Arkiv Builder Challenge

**VitalChain — Your health data. Your AI. Your chain.**

</div>
