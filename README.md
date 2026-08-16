# 🚀 BidFly Enterprise Suite — Comprehensive Documentation

**BidFly Enterprise Suite** is a state-of-the-art, desktop-first enterprise tender lifecycle management, bid preparation, and competitive intelligence platform built for modern business enterprises, government contractors, and procurement departments.

---

## 📋 Table of Contents
1. [Key Features & Capabilities](#-key-features--capabilities)
2. [Architecture & Technology Stack](#-architecture--technology-stack)
3. [Database Architecture & Inspection (Prisma Studio)](#-database-architecture--inspection-prisma-studio)
4. [Universal Multi-Format Export System](#-universal-multi-format-export-system)
5. [Enterprise Security & Access Control](#-enterprise-security--access-control)
6. [Offline-First Architecture & Network Sync](#-offline-first-architecture--network-sync)
7. [External Government API Integrations](#-external-government-api-integrations)
8. [Installation & Local Setup](#-installation--local-setup)
9. [Build & Desktop Packaging](#-build--desktop-packaging)

---

## 🌟 Key Features & Capabilities

### 1. 📂 Tender Lifecycle Management
- **Tender Repository**: Centralized vault to record, search, and track all government (GeM, CPPP, State Portals) and private procurement tenders.
- **Pre-Bid & Post-Bid Clarification Tracker**: Dedicated log for pre-bid queries, corrigenda, and post-bid technical evaluations with automated reminder alerts.
- **Stage Progress Tracking**: Track tender stages from Discovery, Technical Bidding, Financial Qualification, to Award & Execution.

### 2. 🎯 Bid Preparation & EMD Tracking
- **EMD / BG Manager**: Track Earnest Money Deposits (EMD) and Bank Guarantees (BG) with expiry date countdowns and refund status tracking.
- **Technical & Financial QCBS Calculator**: Calculate Quality and Cost Based Selection (QCBS) combined score matrices.

### 3. 📊 Competitor Intelligence & BOQ Rate Engine
- **Competitor Directory**: Track rival contractors, GSTINs, market strengths (`Dominant`, `High`, `Medium`, `Low`), and historical win rates.
- **L1 / L2 Price Variance Matrix**: Real-time margin spread (₹) and price variance % calculations against competitors.
- **Item-Wise & Group BOQ Breakdown**: Schedule-wise line-item rate comparison, departmental estimated rates vs our rates vs competitor rates, with automated **Line Item L1** detection.

### 4. 🏢 Vendor & Sub-Contractor Portal
- **Supplier Directory**: Manage vendors, material suppliers, sub-contractors, GSTIN verification, and reliability scores.
- **Supplier DataSheets**: Upload and link vendor catalog spec sheets to tender requirements.

### 5. 🖨️ Universal Multi-Format Export Engine
Export any dataset or table across the entire suite into:
- 📊 **Excel Spreadsheet (`.xls`)** with formatted headers and grid lines.
- 📄 **CSV Dataset (`.csv`)** for raw data processing.
- 📝 **Word Document (`.doc`)** formatted as printable company records.
- 📕 **PDF Report (`.pdf`)** with embedded timestamp & confidentiality notice.
- 🖨️ **Direct Print Preview** using native desktop print preview.

---

## 🛠️ Architecture & Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Desktop Framework** | Electron 35+ |
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tooling** | Vite 6 + Electron-Builder |
| **Styling System** | Vanilla CSS + Tailwind CSS v4 + Radix UI + Lucide Icons |
| **State & Store** | Zustand Enterprise Store |
| **Form & Validation** | React Hook Form + Zod Strict Schemas |
| **Local Database Vault** | Better-SQLite3 / SQLite Encrypted Local Vault |

---

## 🗄️ Database Architecture & Inspection (Prisma Studio)

BidFly uses a high-performance local SQLite database (`bidfly.db`) stored securely in your system's application user data directory (`userData`).

### How to View & Manage Database via Prisma Studio:
To open an interactive database browser (similar to Prisma Studio) to inspect, edit, or query raw tables:

1. **Option A: Run Prisma Studio (If Prisma Schema configured)**
   ```bash
   npx prisma studio
   ```
   This will open Prisma Studio in your web browser at `http://localhost:5555`, allowing you to inspect all tables (`User`, `Tender`, `Bid`, `Competitor`, `BOQItem`, `Clarification`, `Vendor`, etc.).

2. **Option B: DB Browser for SQLite (GUI Tool)**
   - Download [DB Browser for SQLite](https://sqlitebrowser.org/).
   - Open file: `%APPDATA%/bid-fly/bidfly.db` (Windows) or `~/.config/bid-fly/bidfly.db` (Mac/Linux).
   - Browse tables, run SQL queries, and inspect raw database records directly.

---

## 🔐 Enterprise Security & Access Control

- **Role-Based Access Control (RBAC)**: Supports roles (`CEO`, `Manager`, `Employee`, `Admin`).
- **Strict Password Rules**: Enforces 8+ characters, requiring 1 uppercase, 1 lowercase, 1 digit, and 1 special character.
- **Confirm Password Verification**: Real-time matching validation on Registration and Password Reset.
- **Restricted API Key Management**: GeM / CPPP / TenderKart API credentials are strictly accessible only to Admin roles.

---

## 📶 Offline-First Architecture & Network Sync

- **Continuous Operation**: Work seamlessly without active internet connections. All tender records, bids, and competitor data are stored locally in the encrypted SQLite vault.
- **Automatic Reconnection Sync**: When network connectivity is restored, the local engine automatically synchronizes updates with remote cloud/domain servers.

---

## 💻 Installation & Local Setup

### Prerequisites
- Node.js v18.0.0 or higher
- npm v9.0.0 or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/mr-tamal-rc/bid-fly.git
cd bid-fly
npm install
```

### 2. Run Application in Development Mode
```bash
npm run dev
```

### 3. Run TypeScript Lint & Typecheck
```bash
npm run lint
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## 📦 Build & Desktop Packaging

To compile standalone Windows desktop executables (`.exe` / `.msi` installers):

```bash
npm run build
npx electron-builder build --win
```

The compiled installer will be located in the `release/` output directory.

---

© 2026 BidFly Enterprise Suite. All rights reserved.
