# Lumina (CEE-AI) - End-to-End Setup & Run Guide (Version 2)
This document outlines the step-by-step setup to integrate your visual hardware simulator (**Wokwi**) with your Next.js fullstack web platform (**CEE-AI**), based on the **Rhytam23/NYC** repository. It covers local testing and deployment to production.

---

## 🏗️ Architectural Integration Overview

The system establishes a bidirectional telemetry and control loop between your virtual microgrid hardware and your web-based AI operating system:

```
┌──────────────────────────────────────┐              ┌──────────────────────────────────────┐
│        WOKWI IOT GATEWAY             │              │       NEXT.JS API BACKEND            │
│  - Reads: Grid Switch, Solar LDR,   │              │  - Receives telemetry via POST       │
│    and Battery Potentiometer.        │ ──(HTTP)───► │  - Saves to Supabase PostgreSQL      │
│  - Actuates: Essential (Green LED)   │ ◄──(JSON)─── │  - Evaluates outage load-shedding    │
│    and Non-Essential (Red LED).      │              │  - Responds with switching commands  │
└──────────────────────────────────────┘              └──────────────────────────────────────┘
```

---

## 🔌 Part 1: Setting up the Wokwi Visual Simulator

1. Go to **[wokwi.com](https://wokwi.com)** and create a new **ESP32** project (or select the **ESP32 HTTP Server** starter template).
2. **Apply the Visual Layout:**
   - In the Wokwi file tabs, click on **`diagram.json`**.
   - Delete all default contents.
   - Copy the complete contents of **`wokwi_diagram_v2.json`** from your Studio panel and paste them here. This instantly places and wires the ESP32, LCD, Slide Switch, Potentiometer, LDR, relays, and LEDs.
3. **Load the Firmware:**
   - Switch to the main code tab (usually **`sketch.ino`**).
   - Delete all default code.
   - Copy the C++ code from **`wokwi-sketch-v2-wifi.ino`** in your Studio panel and paste it here.
4. **Compile and Run:** Click the green **Play (Start Simulation)** button.

---

## 💻 Part 2: Setting up the Next.js Backend API

To receive the incoming JSON telemetry from the ESP32 and store it in PostgreSQL, you must create a dedicated API endpoint in your cloned GitHub repository project (`cee-ai`).

### 1. Where to Add the Code
In your project structure, navigate to the `cee-ai` directory and create the following nested folder structure:
`src/app/api/v1/telemetry/ingest/`

Create a file named **`route.ts`** inside that folder:
`cee-ai/src/app/api/v1/telemetry/ingest/route.ts`

### 2. Paste the Code
Copy the full TypeScript API code from **`nextjs-telemetry-route-code.md`** in your Studio panel and paste it into this `route.ts` file.

This route:
- Parses the JSON packet (`grid_status`, `solar_gen_kw`, `battery_soc`).
- Finds your active `Home` and `Community` records using Prisma ORM. (Includes automatic mock table seeding so it runs gracefully even with an empty database).
- Saves a telemetry pulse directly into the `energy_telemetry` TimescaleDB/PostgreSQL table, instantly animating your web dashboard circular battery gauges and SVG flow views!
- Returns a JSON response with relay actuation commands: `{"relay_commands": {"essential_relay": "ON", "non_essential_relay": "OFF"}}`.

---

## 🛠️ Part 3: Connecting Wokwi to Localhost (Local Testing)

Since Wokwi runs in the cloud, it cannot directly query `http://localhost:3000`. You must expose your local machine to the internet during development.

1. **Boot your local Next.js Web Server:**
   In your terminal, navigate to the `cee-ai/` folder and run:
   ```bash
   npm run dev
   ```
   Your web portal is now running locally on `http://localhost:3000`.

2. **Expose Localhost with Ngrok:**
   Download **Ngrok**, open a separate terminal, and run:
   ```bash
   ngrok http 3000
   ```
   Ngrok will generate a secure public forwarding URL, for example:
   `https://1234-abcd-efgh.ngrok-free.app`

3. **Configure your Wokwi Firmware:**
   In the Wokwi C++ code editor (**`sketch.ino`**), locate line 10 and replace the `serverName` with your Ngrok endpoint:
   ```cpp
   const char* serverName = "https://1234-abcd-efgh.ngrok-free.app/api/v1/telemetry/ingest";
   ```
4. **Restart Wokwi Simulation:** Click **Stop** and then **Play**. You will see the serial monitor showing:
   `HTTP Response code: 200`
   `{"success": true, "system_status": "GRID_ONLINE_NORMAL", ...}`

---

## 🚀 Part 4: Deploying to Production (Where to Change the Code)

When you are ready to present to the judges and host your platform live on the internet:

### 1. Deploy the Next.js Frontend & API Backend
- Push your local changes (including `src/app/api/v1/telemetry/ingest/route.ts`) to your GitHub repository (**Rhytam23/NYC**).
- Connect your GitHub repo to **Vercel** and deploy it.
- Ensure your Vercel project has its environment variables correctly configured to point to your **Supabase PostgreSQL database**:
  - `DATABASE_URL` (pooled connection)
  - `DIRECT_URL` (direct connection)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Point Your Hardware to the Hosted Website
Once your Vercel site is live (e.g., `https://cee-ai-nyc.vercel.app`), update your ESP32's firmware so it stops pinging your local Ngrok tunnel and pings your production server instead.

**Where to change the code:**
In your Wokwi code (or your physical ESP32's IDE setup like Arduino IDE or VS Code), locate **`sketch.ino`** and update the **`serverName`** variable:

```cpp
// CHANGE THIS TO YOUR LIVE HOSTED API URL
const char* serverName = "https://your-deployed-vercel-url.vercel.app/api/v1/telemetry/ingest";
```

*Save, compile, and run. Now, anyone in the world (including the hackathon judges) can open your live Vercel dashboard website, watch your physical/simulated ESP32 dials shift, and see the web interface react instantly!*

---

## 🔋 Part 5: The Interactive Hackathon Demo Walkthrough

Once everything is connected, run through this script to showcase your cyber-physical virtual microgrid to the judges:

1. **Normal State (Grid Online):**
   - Slide the **Utility Grid Node (Slide Switch)** to **ON**.
   - Set the **Battery SoC (Potentiometer)** to **80%** (Full).
   - *Result:* The LCD reads `GRID: ONLINE`. Both the Green LED (Essential Loads) and Red LED (Non-Essential Loads) glow. The Next.js dashboard shows a green grid flow, active solar, and stable home consumption.
2. **Blackout Scenario (Dynamic Load-Shedding):**
   - Toggle the **Utility Grid Switch** to **OFF** to simulate a blackout.
   - *Result:* Wokwi sends `grid_status: "OUTAGE"` to Next.js. The Next.js API processes this and returns `"non_essential_relay": "OFF"`.
   - **The Red LED instantly turns off (sheds load)**. The **Green LED stays brightly lit** (critical backup). The local LCD prints `*GRID OUTAGE!* / ESS ONLY`. The Next.js dashboard UI flashes an active alert indicating the community has successfully avoided burning diesel!
3. **Failsafe Protective State (Battery Critical):**
   - With the grid switch still OFF, twist the **Battery Potentiometer** down below **20%**.
   - *Result:* The Next.js backend detects the critical discharge state and commands `"essential_relay": "OFF"`.
   - **The Green LED turns off**, and the local LCD displays `BATTERY CRITICAL / SYSTEM SHUTDOWN`, demonstrating intelligent battery physical protection.
