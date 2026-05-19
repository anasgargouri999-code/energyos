# ⚡ EnergyOS — GTB Energy Management Web Platform

EnergyOS is a modern, high-performance, and visually stunning energy management web platform specifically designed for medical clinics and healthcare facilities. It integrates building supervision systems (GTB) with advanced AI capability (Groq SDK Llama 3) to optimize energy baselines, manage zone eco schedules, implement active délestage (load shedding), and alert on electrical anomalies.

Designed with a sleek, futuristic dark theme, EnergyOS provides instant visual feedback, interactive charts, and real-time power simulations.

---

## 🚀 Key Features

*   **⚡ Live Energy Dashboard**: Real-time power metric tracker, load monitoring, power factor (cos φ) tracking, and live-updating telemetry simulation.
*   **📊 Smart Energy Analytics**: Interactive Recharts-driven graphs comparing historical baseline energy usage with optimized AI performance.
*   **🧠 Groq AI Auto-Configuration**: Automated HVAC, lighting, and power profile scheduling analyzed dynamically from connected GTB devices.
*   **📡 GTB Server Connectivity**: Live connectivity checking for remote supervision servers with protocol support (BACnet, Modbus, LonWorks).
*   **🔒 Secure Admin Controls**: Dedicated administrative portal for approving access requests, managing clinic codes, and revoking authorizations.
*   **🎮 Floating Simulation Remote**: Built-in PFE presentation panel to simulate summer peak loads, electrical faults, and system resets in demo mode.

---

## 🛠️ Technology Stack

*   **Frontend**: React 18, Vite, Tailwind CSS, Zustand, Recharts, Framer Motion, React Router v6.
*   **Backend**: Node.js, Express, Winston Logger, Axios.
*   **Database & Auth**: Supabase DB with Row Level Security (RLS) policies.
*   **AI Integration**: Groq Cloud AI SDK (Llama-3.1-8b model).
*   **Hosting Ready**: Netlify (Frontend SPA) + Render (Backend Express).

---

## 📁 Project Structure

```
energyos/
├── client/                        # React + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── components/            # UI Primitives, Dashboard widgets, Charts
│   │   ├── pages/                 # Routing pages (Landing, Dashboard, Admin, etc.)
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # API clients (Supabase, Groq, GTB) and Demo fixtures
│   │   └── store/                 # Zustand global state
│   ├── index.html
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                        # Express API Backend
│   ├── routes/                    # API Endpoints (auth, admin, gtb, groq)
│   ├── middleware/                # Security authentication and request logging
│   ├── lib/                       # Supabase Admin and Mailer helper utilities
│   └── package.json
│
├── logs/                          # System Logs (decision logs & build tracking)
├── .env.example                   # Environment configuration template
├── netlify.toml                   # Netlify redirect and SPA routing config
└── README.md                      # Project Documentation
```

---

## ⚙️ Quick Start Setup

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed on your machine.

### 2. Environment Configuration
Copy the `.env.example` file in the root of the project to a new file named `.env`:
```bash
cp .env.example .env
```
Fill in the credentials for Supabase, Groq, and Gmail SMTP according to your deployment.

### 3. Install Dependencies
Initialize both client and server packages:
```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 4. Run Locally
To run both development servers simultaneously, you can run them in separate terminals:

**Start the Backend API Server:**
```bash
cd server
npm run dev
```
*(Runs on `http://localhost:3001`)*

**Start the Frontend Vite Development Server:**
```bash
cd client
npm run dev
```
*(Runs on `http://localhost:5173`)*

---

## 🎨 Design Guidelines & Aesthetics

EnergyOS strictly adheres to a premium dark energy motif:
*   **Primary Background**: `#0A0D14` (Deep Space Dark)
*   **Surface Cards**: `#111827` with a subtle white border `border-white/5`
*   **Accent Color Cyan**: `#00D4FF` (Power / Energy tracking)
*   **Accent Color Green**: `#22C55E` (Optimized State / OK Status)
*   **Accent Color Amber**: `#F59E0B` (Warning / Active Eco schedules)
*   **Accent Color Red**: `#EF4444` (Critical Load Shedding / Thermal Spikes)
*   **Typography**: *Space Grotesk* for technical headings, *DM Sans* for sleek reading, and *JetBrains Mono* for live numeric readings.

---

## 🔒 Security & Roles
*   Admin endpoints are protected using a unique `x-admin-secret` validation header.
*   Supabase is secured with Row Level Security (RLS) to ensure anonymous visitors can only insert requests but cannot read authorization databases.
