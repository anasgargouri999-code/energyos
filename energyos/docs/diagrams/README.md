# ⚡ EnergyOS — Technical Diagrams & Systems Architecture
> **Investor & Technical Stakeholder Presentation Guide**  
> This directory houses the comprehensive Unified Modeling Language (UML) specifications for EnergyOS. These models demonstrate the system's operational viability, bankable enterprise security, advanced AI automated optimization loops, and seamless physical-to-cloud integration.

---

## 🏛️ Directory Structure

```
energyos/docs/diagrams/
├── README.md                      # This Technical Presentation Guide
├── use_cases.puml                 # Actor boundaries & core platform features
├── database_schema.puml           # PostgreSQL/Supabase ERD & Row-Level Security
├── system_architecture.puml       # Multi-tier Client-Server-Edge Component Topography
├── iot_connectivity_map.puml      # Operator-Admin-IoT Gateway-Device connection map
├── sequence_onboarding.puml       # Secure Onboarding & SMTP code dispatch sequence
└── sequence_ai_config.puml       # GTB Handshake & Groq AI Optimization loop sequence
```

---

## 🎨 Diagram Theme: Minimalist Clean Professional
To ensure investor-ready legibility and sleek aesthetics, all diagrams are designed under a **Minimalist Light Monochrome Theme** using custom PlantUML skinparameters:
*   **Font Family**: `Space Grotesk` (with universal Helvetica/Arial fallback) to match technical branding.
*   **High-Contrast Minimal Fills**: Clean white backgrounds with subtle slate borders (`#CBD5E1`), avoiding legacy saturated colors (yellow/pink/blue).
*   **Aesthetic Geometry**: Soft rounded corners (`roundcorner 6` to `8`) and flat, crisp shadows (`shadowing false`).
*   **Orthogonal Routing**: Straight lines (`linetype ortho`) for logical grid layouts.

---

## 🔍 Technical Walkthrough of the UML Models

### 1. 👥 Use Case Diagram (`use_cases.puml`)
**Purpose**: Maps how internal staff, administrative gatekeepers, automated AI systems, and external edge hardware interact with the platform.
*   **Commercial Pitch**: Highlights how the platform automates energy operations while keeping a human-in-the-loop validation paradigm.
*   **Key Actors**:
    *   `Clinic Operator` (Technical/Energy Manager on-site): Core end-user managing telemetry, updating zone schedules, and acting on alerts.
    *   `Super Admin` (EnergyOS Operations): Issues securely approved access codes.
    *   `Groq AI Engine` (Cloud AI agent): Consumes physical telemetry to generate optimized HVAC/lighting plans.
    *   `GTB Controller` (Physical Edge System): The building’s automation brain, feeding sensor readings and receiving commands.

### 2. 🗄️ Database Schema ERD (`database_schema.puml`)
**Purpose**: Models the target PostgreSQL database (deployed on Supabase), highlighting scalable domain isolation.
*   **Key Entity Clusters**:
    *   **Access Control**: Houses `access_requests` and `access_codes`.
    *   **Facility & IoT Inventory**: Models `clinics`, `zones` (with customizable operating modes and priorities), and detailed `devices` tracking hardware protocols.
    *   **Telemetry Warehousing**: The `energy_metrics` table is structured for high-frequency time-series logging, alongside `alerts_log` and `ai_optimizations` for auditable histories.
*   **Funding Highlights**:
    *   **Enterprise Multi-Tenancy**: The schema is designed from day one to support multiple clinics under one instance (`clinic_id` foreign keys).
    *   **Row-Level Security (RLS)**: Integrates strict policy briefs to secure clinic data against unauthorized API queries.

### 3. 🌐 Component System Architecture (`system_architecture.puml`)
**Purpose**: Visualizes the logical flow of data between the web client, server gateway, third-party cloud microservices, and edge controllers on-site.
*   **High-Performance Stack**:
    *   **Frontend**: React Single-Page Application (SPA) driven by Zustand global stores and responsive Recharts widgets.
    *   **Backend Proxy Gateway**: Express API acting as a secure gateway to intercept CORS and preserve sensitive API keys.
    *   **Cloud Integrations**: Supabase DB/Auth, Google SMTP, and the Groq AI SDK.
*   **Industrial Connectivity**:
    *   Shows how the platform links to physical components via **BACnet/IP** (Port 47808) and **Modbus TCP/IP** (Port 502) to interface with air handlers (CTA), power meters (STEG), chillers, and access controls.

### 4. 🔒 Sequence Flow: Onboarding & Security (`sequence_onboarding.puml`)
**Purpose**: Demonstrates the secure transaction sequence for granting new facilities access.
*   **Step-by-Step Security**:
    1.  **Inquiry**: Anonymous client posts a request. Supabase accepts it via an `anon_insert` RLS policy.
    2.  **Verification**: Administrator logs into the admin workspace checking requests using the `x-admin-secret` validation header.
    3.  **Code Issuance**: The server generates a cryptographic code, saves it, and dispatches a personalized welcome message via Gmail SMTP.
    4.  **Bypass/Activation**: The operator verifies the code via the Express validation endpoint, which stores the session to local storage for persistent validation.

### 5. 🧠 Sequence Flow: Groq AI Auto-Configuration (`sequence_ai_config.puml`)
**Purpose**: Represents our proprietary intellectual property: the **AI Auto-Optimization Loop**.
*   **Step-by-Step Logic**:
    1.  **Handshake**: Client initiates a ping proxy checking GTB connection status.
    2.  **Device Scan**: Fetches mechanical inventories (CTA, Compteurs, Chillers) from the edge server.
    3.  **AI Inference**: Compiles specifications and baseline metrics, dispatching them to Groq's Llama 3.1 LLM.
    4.  **Parsing & Control**: Groq returns highly optimized, clean JSON configs containing eco schedules and load-shedding tables.
    5.  **Synchronization**: The user reviews, confirms, and pushes settings to local relays via Modbus/BACnet schedules, resulting in an average of **17.7% active load reductions**.

### 6. 🌐 IoT Connection & Stakeholder Map (`iot_connectivity_map.puml`)
**Purpose**: Maps out how all crucial system elements and stakeholders hook up and communicate in our end-to-end industrial IoT solution.
*   **Operational Connectivity**:
    *   `Clinic Operator` monitors and manages ambient parameters (thermostats, dimmers, limits) using the React Dashboard app.
    *   `Super Admin` manages and reviews facility registration logs through the encrypted admin viewport.
    *   `Supabase Database` handles transactional lookups and active session telemetry.
    *   `Node-RED GTB Controller` intercepts proxy requests to route settings to active automation buses.
    *   `Clinic Devices` (HVAC, Lighting, STEG Meters, Access panels) receive these inputs over native field protocols (**Modbus/BACnet/Wiegand**).

---

## 🛠️ How to Render These UML Files

These `.puml` files are standard **PlantUML** models. You can render them in multiple ways:

### Option A: VS Code Extension (Recommended)
1.  Install the **PlantUML** extension in VS Code.
2.  Install **Graphviz** on your local machine (required for advanced node layouts).
3.  Open any `.puml` file and press `Alt + D` (or `Option + D` on Mac) to render a live vector preview.

### Option B: Command Line (Build Artifacts)
If you have `plantuml.jar` installed, you can batch compile these files to high-resolution PNGs:
```bash
# Compile all puml files in this directory to PNG format
java -jar plantuml.jar -tpng c:/Users/DELL/Downloads/app/energyos/docs/diagrams/*.puml
```

### Option C: Quick Online Viewer
Copy the text content of any of these `.puml` files and paste them directly into the official web renderer:
👉 [PlantUML Online Server](https://www.plantuml.com/plantuml)

---
> *EnergyOS — Engineered for visual beauty, built for grid resilience.*
