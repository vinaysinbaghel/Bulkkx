# BulkkX: Horizontal Commodity Matching Portal (POC)

BulkkX is an India-first, horizontal commodity matching platform designed to connect individual buyers and suppliers across diverse commodity sectors (grains, pulses, spices, industrial polymers, metals).

## 🛡️ Top Priority 1: Security & Anti-Disintermediation

1. **Zero-Leak Identity Masking Engine**:
   * Prior to Bank/NBFC reserve confirmation (`reserve_confirmed`), all supplier legal names, trade names, phone numbers, and exact pickup addresses are stripped on the server side (`maskDealForBuyer`).
   * Buyers only see an anonymized trust card: e.g. `Verified Supplier #GJ-MHM-402`, Rajkot APMC Hub (~42 km), 98% lock-honour rate, and verified KYC badge.
   * Buyer contact details are identically gated from suppliers (`maskDealForSupplier`).
   * **Zero Client-Side Reliance**: Masked attributes are never sent over the wire or stored in hidden HTML tags.
2. **Single-Source-of-Truth Deal State Machine**:
   * Every deal status transition executes strictly through `transitionDeal(deal, event, actor, payload)`.
   * Enforces role-based authorization, valid price lock windows, and **optimistic concurrency locking** (`expectedVersion`) to prevent race conditions.
3. **Append-Only Integer Paise Financial Ledger**:
   * All prices, discounts, reserves, and fees are computed strictly in **64-bit integer paise** (1 INR = 100 paise) with zero floating-point math.
   * Double-entry bookkeeping (`DEBIT`/`CREDIT`) with idempotency keys.
4. **Non-Custodial Bank/NBFC Partner Escrow**:
   * BulkkX **never custodies buyer funds**. A 10% reserve is deposited into an RBI-regulated bank or NBFC escrow partner. BulkkX's platform fee is realized only post-fulfilment.
5. **Cryptographic Webhook Verification**:
   * Reserve partner webhooks are HMAC verified and idempotent.

---

## ⚡ Top Priority 2: User Experience (UX) & Ease of Use

1. **Mobile-First Low-Bandwidth Architecture**:
   * Optimized bundle footprint ($\le 100\text{ KB}$ gzipped), high contrast, and responsive design tailored for Mandi and warehouse traders on mid-range Android devices.
2. **Dynamic JSON-Schema Form Engine**:
   * Standardized core attributes (grade, quantity, unit, packaging, lead time, price lock validity) combined with category-specific technical attributes.
   * Traders never type tedious free text; smart selects, units (MT, Quintal, KG, %, SHU, MFI), and validations adapt dynamically to the commodity.
3. **"Trust First" Cognitive Clarity**:
   * **Live Price Lock Timers**: Animated visual countdown clocks (`23h 48m left`) for guaranteed spot prices.
   * **Transparent Commercial Cards**: Shows locked base price, BulkkX volume subsidy, net commercial value, and the 10% bank escrow deposit.
   * **"Who Acts Next" Deal Stepper**: Clear banner on every deal screen indicating the exact responsible party and next actionable step in plain language.
4. **WhatsApp Omnichannel Loop**:
   * Every critical event (match found, stock confirmed, reserve funded, dispatch, inspection, dispute) triggers a WhatsApp Business template message with a one-tap deep link directly opening the deal tracker.
5. **Zero-Deploy Category Template Studio**:
   * Ops can design and publish a brand new commodity category (e.g. Yellow Maize, Cotton Bales) in the Ops Console, and it goes live instantly across buyer and supplier apps without any code deployment.

---

## 📁 Monorepo Structure

```
Bulkxx/
├── apps/
│   ├── web/                    # Responsive PWA Portal (Buyer, Supplier & Ops Switcher)
│   └── api/                    # Modular Monolith REST Backend (Express + TypeScript)
├── packages/
│   ├── shared/                 # Domain types, State machine, Masking engine, Paise math, Seed templates
│   └── adapters/               # Pluggable interfaces (ReservePartner, KycVerification, Notifications, Storage)
```

---

## 🚀 Quickstart & Running the Platform

### 1. Prerequisites
* **Node.js** v20+ or v24+
* **pnpm** v10+ or v12+

### 2. Run All Tests
```bash
pnpm test
```
*Executes all 20 unit and integration tests across the state machine, zero-leak masking, integer currency calculations, simulated adapters, and REST API flows.*

### 3. Launch Development Server
```bash
# Start Web Portal
pnpm --filter @bulkkx/web dev

# Start API Backend (Port 4000)
pnpm --filter @bulkkx/api dev
```
Open **`http://localhost:3000`** in your browser. Use the header persona switcher to test the full lifecycle:
* 🏢 **Buyer View**: Post dynamic requirements, browse ranked locked shortlists, lock deals, track the 48-hour inspection window.
* 🌾 **Supplier View**: Publish listings with price locks, manage lock countdowns, confirm matches, dispatch consignment.
* ⚙️ **Ops Console View**: Matching review workbench, Zero-deploy Category Template Studio, append-only double-entry ledger & escrow reconciliation.
