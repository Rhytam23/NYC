#!/usr/bin/env python3
"""
Lumina: Community Energy AI - Hardware & IoT Prototype Simulator
Specifically designed for NYC Hackathon demonstrations.

This script simulates a "smart gateway / energy controller" IoT node in a 
residential community. It models real-time power flows (solar generation, 
battery charge/discharge, essential vs non-essential loads, and grid status) 
and exposes a Flask REST API to allow the AI Brain / Dashboard to monitor 
and control the system.

Features:
1. Realistic physical energy model (Time-of-day solar, load curves, battery physics).
2. Outage simulation (can manually trigger outages to demo AI power management).
3. Active Control API (commands to shed loads, toggle charging, etc.).
4. Interactive Terminal Dashboard with live ASCII power-flow visualization.
"""

import time
import math
import threading
import json
from flask import Flask, jsonify, request

app = Flask(__name__)

class LuminaSimulator:
    def __init__(self):
        # Configuration
        self.battery_capacity_kwh = 100.0  # Total capacity of community battery bank
        self.battery_max_charge_kw = 25.0  # Max charge rate
        self.battery_max_discharge_kw = 25.0  # Max discharge rate
        self.solar_max_capacity_kw = 40.0   # Peak solar generation capability
        
        # State Variables
        self.battery_soc = 50.0            # State of Charge (%)
        self.battery_stored_kwh = 50.0      # Current stored energy
        self.solar_generation_kw = 0.0     # Current solar output
        self.grid_status = "ONLINE"         # ONLINE or OUTAGE
        self.grid_price_per_kwh = 15.0     # Simulated tariff in INR (or cents)
        
        # Load profile baseline
        self.essential_load_kw = 8.0       # Lifts, water pumps, emergency lighting (constant baseline)
        self.non_essential_load_kw = 22.0   # Resident apartments, ACs, water heaters (fluctuates)
        self.non_essential_shed = False    # True if AI has commanded load shedding
        
        # Control signals from AI Operating System
        self.battery_mode = "AUTO"         # AUTO, FORCE_CHARGE, FORCE_DISCHARGE, HOLD
        
        # Simulation clock parameters (accelerated time)
        # 1 real second = 5 simulated minutes
        self.sim_hour = 8.0                # Start simulation at 8:00 AM
        self.time_dilation = 5.0           # Minutes of sim-time per real second
        self.is_running = True
        
        # History for tracking
        self.history = []

    def update_physics(self):
        """Advances the simulation state by one step."""
        # Calculate time step delta in hours
        dt_minutes = self.time_dilation
        dt_hours = dt_minutes / 60.0
        
        # Update simulation clock
        self.sim_hour = (self.sim_hour + dt_hours) % 24.0
        
        # 1. Simulate Solar Generation
        # Simple bell curve centered around 12:00 PM (hour 12) with random noise
        if 6.0 <= self.sim_hour <= 18.0:
            # Solar peak at 12:00 PM
            solar_factor = math.sin(math.pi * (self.sim_hour - 6.0) / 12.0)
            # Add small fluctuations for cloud cover
            noise = math.sin(self.sim_hour * 10.0) * 0.05
            self.solar_generation_kw = max(0.0, round(self.solar_max_capacity_kw * (solar_factor + noise), 2))
        else:
            self.solar_generation_kw = 0.0

        # 2. Simulate Load Demand
        # Baseline demand rises in morning (8-10 AM) and peaks in evening (6-10 PM)
        hour_rad = math.pi * self.sim_hour / 12.0
        load_factor = 0.6 + 0.3 * math.sin(hour_rad - (math.pi/2)) + 0.2 * math.sin(2 * hour_rad)
        
        # Essential loads stay fairly stable
        self.essential_load_kw = round(8.0 + math.sin(self.sim_hour) * 1.5, 2)
        
        # Non-essential loads fluctuate heavily depending on time of day
        raw_non_essential = 22.0 * load_factor + (math.cos(self.sim_hour * 1.5) * 4.0)
        
        if self.non_essential_shed:
            self.non_essential_load_kw = 0.0
        else:
            self.non_essential_load_kw = max(2.0, round(raw_non_essential, 2))

        total_community_demand = self.essential_load_kw + self.non_essential_load_kw

        # 3. Simulate Grid Price based on demand curve
        # High tariff during evening peak (5 PM - 10 PM)
        if 17.0 <= self.sim_hour <= 22.0:
            self.grid_price_per_kwh = 24.0
        else:
            self.grid_price_per_kwh = 12.0

        # 4. Battery Logic & Control Orchestration
        battery_net_kw = 0.0  # Positive = charging, Negative = discharging
        
        if self.grid_status == "OUTAGE":
            # Force load-shedding if we are in outage and battery SoC is critical (< 25%)
            if self.battery_soc < 25.0:
                self.non_essential_shed = True
                self.non_essential_load_kw = 0.0
                total_community_demand = self.essential_load_kw
            
            # Outage physics: We rely on Solar and Battery to meet local demand
            available_local_gen = self.solar_generation_kw
            deficit = total_community_demand - available_local_gen
            
            if deficit > 0:
                # Discharging battery to cover deficit
                discharge_needed = min(deficit, self.battery_max_discharge_kw)
                # Ensure battery has capacity left
                actual_discharge = min(discharge_needed, self.battery_stored_kwh / dt_hours)
                self.battery_stored_kwh -= actual_discharge * dt_hours
                battery_net_kw = -actual_discharge
                
                # Check for system collapse
                unmet_demand = deficit - actual_discharge
                if unmet_demand > 0.1:
                    # Blackout! Battery and solar cannot support current load.
                    # In a real system, the smart gateway would automatically trip breakers.
                    self.non_essential_shed = True
            else:
                # Excess solar is stored in battery
                surplus = -deficit
                charge_possible = min(surplus, self.battery_max_charge_kw)
                room_in_battery = self.battery_capacity_kwh - self.battery_stored_kwh
                actual_charge = min(charge_possible, room_in_battery / dt_hours)
                self.battery_stored_kwh += actual_charge * dt_hours
                battery_net_kw = actual_charge
                
        else: # GRID IS ONLINE
            # Standard smart grid optimization behavior
            if self.battery_mode == "FORCE_CHARGE":
                # Charge battery from grid/solar as fast as possible
                charge_needed = self.battery_max_charge_kw
                room_in_battery = self.battery_capacity_kwh - self.battery_stored_kwh
                actual_charge = min(charge_needed, room_in_battery / dt_hours)
                self.battery_stored_kwh += actual_charge * dt_hours
                battery_net_kw = actual_charge
                
            elif self.battery_mode == "FORCE_DISCHARGE":
                # Push power into community loads/grid
                discharge_needed = self.battery_max_discharge_kw
                actual_discharge = min(discharge_needed, self.battery_stored_kwh / dt_hours)
                self.battery_stored_kwh -= actual_discharge * dt_hours
                battery_net_kw = -actual_discharge
                
            elif self.battery_mode == "HOLD":
                battery_net_kw = 0.0
                
            else: # AUTO MODE (Lumina default behavior: peak shaving & cost savings)
                # If solar is higher than current community demand, charge the battery with excess
                net_local = self.solar_generation_kw - total_community_demand
                if net_local > 0:
                    room_in_battery = self.battery_capacity_kwh - self.battery_stored_kwh
                    actual_charge = min(net_local, self.battery_max_charge_kw, room_in_battery / dt_hours)
                    self.battery_stored_kwh += actual_charge * dt_hours
                    battery_net_kw = actual_charge
                else:
                    # If high grid tariff period, discharge battery to avoid expensive grid power
                    if self.grid_price_per_kwh > 18.0 and self.battery_soc > 30.0:
                        discharge_rate = min(abs(net_local), self.battery_max_discharge_kw)
                        actual_discharge = min(discharge_rate, (self.battery_stored_kwh - 30.0) / dt_hours)
                        self.battery_stored_kwh -= actual_discharge * dt_hours
                        battery_net_kw = -actual_discharge
                    else:
                        battery_net_kw = 0.0

        # Enforce battery limits
        self.battery_stored_kwh = max(0.0, min(self.battery_stored_kwh, self.battery_capacity_kwh))
        self.battery_soc = round((self.battery_stored_kwh / self.battery_capacity_kwh) * 100.0, 1)

        # 5. Calculate Grid Exchange Power
        # Grid imports = local loads + battery charging - solar generation - battery discharging
        self.grid_exchange_kw = round(
            (self.essential_load_kw + self.non_essential_load_kw) 
            - self.solar_generation_kw 
            + battery_net_kw, 2
        )
        
        if self.grid_status == "OUTAGE":
            self.grid_exchange_kw = 0.0
            
        # Record history (keep last 50 data points)
        self.history.append({
            "timestamp": time.time(),
            "sim_hour": round(self.sim_hour, 2),
            "solar_kw": self.solar_generation_kw,
            "essential_load_kw": self.essential_load_kw,
            "non_essential_load_kw": self.non_essential_load_kw,
            "total_load_kw": round(self.essential_load_kw + self.non_essential_load_kw, 2),
            "battery_soc": self.battery_soc,
            "battery_net_kw": round(battery_net_kw, 2),
            "grid_exchange_kw": self.grid_exchange_kw,
            "grid_status": self.grid_status,
            "grid_price": self.grid_price_per_kwh,
            "non_essential_shed": self.non_essential_shed
        })
        if len(self.history) > 100:
            self.history.pop(0)

    def get_state(self):
        """Returns the full dictionary state."""
        return {
            "clock": {
                "sim_hour": round(self.sim_hour, 2),
                "formatted_time": f"{int(self.sim_hour):02d}:{int((self.sim_hour % 1) * 60):02d}",
            },
            "solar": {
                "generation_kw": self.solar_generation_kw,
                "capacity_kw": self.solar_max_capacity_kw,
            },
            "battery": {
                "soc_percent": self.battery_soc,
                "stored_kwh": round(self.battery_stored_kwh, 2),
                "capacity_kwh": self.battery_capacity_kwh,
                "net_flow_kw": round(self.history[-1]["battery_net_kw"] if self.history else 0.0, 2),
                "mode": self.battery_mode,
            },
            "community_load": {
                "essential_kw": self.essential_load_kw,
                "non_essential_kw": self.non_essential_load_kw,
                "total_kw": round(self.essential_load_kw + self.non_essential_load_kw, 2),
                "non_essential_shed": self.non_essential_shed,
            },
            "grid": {
                "status": self.grid_status,
                "price_per_kwh": self.grid_price_per_kwh,
                "exchange_kw": self.grid_exchange_kw,  # positive = importing from grid, negative = exporting
            }
        }

# Global simulator instance
sim = LuminaSimulator()

# Flask API Routing
@app.route('/api/state', methods=['GET'])
def get_state_endpoint():
    """Returns current physical state of the microgrid."""
    return jsonify(sim.get_state())

@app.route('/api/history', methods=['GET'])
def get_history_endpoint():
    """Returns past simulated ticks for graphing."""
    return jsonify(sim.history)

@app.route('/api/control', methods=['POST'])
def control_endpoint():
    """
    Accepts commands from the Lumina AI Core.
    JSON Payload structure:
    {
       "battery_mode": "AUTO" | "FORCE_CHARGE" | "FORCE_DISCHARGE" | "HOLD",
       "shed_non_essential": true | false
    }
    """
    data = request.get_json() or {}
    
    if "battery_mode" in data:
        mode = data["battery_mode"].upper()
        if mode in ["AUTO", "FORCE_CHARGE", "FORCE_DISCHARGE", "HOLD"]:
            sim.battery_mode = mode
            
    if "shed_non_essential" in data:
        sim.non_essential_shed = bool(data["shed_non_essential"])
        
    return jsonify({"status": "success", "updated_state": sim.get_state()})

@app.route('/api/grid/toggle', methods=['POST'])
def toggle_grid():
    """Manually triggers or clears power outages for demo purposes."""
    if sim.grid_status == "ONLINE":
        sim.grid_status = "OUTAGE"
    else:
        sim.grid_status = "ONLINE"
        # Reset load-shedding when grid returns
        sim.non_essential_shed = False
    return jsonify({"status": "success", "grid_status": sim.grid_status})

def run_simulation_loop():
    """Background task to tick the simulation every second."""
    while sim.is_running:
        sim.update_physics()
        time.sleep(1.0)

def draw_ascii_dashboard():
    """Draws a beautiful, real-time ASCII terminal interface."""
    while sim.is_running:
        state = sim.get_state()
        clk = state["clock"]["formatted_time"]
        solar = state["solar"]["generation_kw"]
        soc = state["battery"]["soc_percent"]
        bat_flow = state["battery"]["net_flow_kw"]
        essential = state["community_load"]["essential_kw"]
        non_essential = state["community_load"]["non_essential_kw"]
        total_load = state["community_load"]["total_kw"]
        shed_status = "SHEDDED ❌" if state["community_load"]["non_essential_shed"] else "ACTIVE  🟢"
        grid_status = state["grid"]["status"]
        grid_flow = state["grid"]["exchange_kw"]
        price = state["grid"]["price_per_kwh"]

        # Build battery SoC visual bar
        bar_len = 20
        filled = int((soc / 100.0) * bar_len)
        bar = "█" * filled + "░" * (bar_len - filled)

        # Clear terminal screen (using ANSI codes)
        print("\033[H\033[2J", end="")
        print("=" * 66)
        print(f"       ⚡ LUMINA AI: COMMUNITY ENERGY SMART GATEWAY SIMULATOR ⚡       ")
        print("=" * 66)
        print(f" Simulated Time: [ {clk} ]    |    Time Dilation: 1 sec = 5 mins")
        print("-" * 66)
        
        # Grid Status
        g_color = "\033[92m" if grid_status == "ONLINE" else "\033[91m"
        print(f" GRID STATUS: {g_color}{grid_status}\033[0m  |  Tariff Rate: {price:.2f} INR/kWh")
        
        # Energy Node Status
        print("-" * 66)
        print(f"  ☀️  Solar Generation : {solar:5.2f} kW   [Peak Cap: {sim.solar_max_capacity_kw} kW]")
        print(f"  🔋  Battery Bank SoC : {soc:5.1f}%  [{bar}]")
        print(f"      Battery Net Flow : {bat_flow:5.2f} kW   (+: Charging, -: Discharging)")
        print(f"  🏢  Community Demand : {total_load:5.2f} kW")
        print(f"      ├─ Essential     : {essential:5.2f} kW   (Lifts, Pumps, Lighting)")
        print(f"      └─ Non-Essential : {non_essential:5.2f} kW   (Apartment Loads - {shed_status})")
        print("-" * 66)

        # Power Flow Direction Diagram
        print(" POWER FLOW DIRECTORY DIAGRAM:")
        print("    [ SOLAR ]            [ COMMUNITY LOAD ]")
        print(f"     {solar:5.1f} kW              {total_load:5.1f} kW")
        print("        │                         ▲")
        print("        └───► [ SMART GATEWAY ] ──┤")
        print("                    ▲    │")
        print("                    │    ▼")
        print(f"              [ BATTERY ]  [ MAIN GRID ]")
        print(f"               {bat_flow:5.1f} kW      {grid_flow:5.1f} kW")
        print("               (Net Flow)    (Import/Export)")
        print("=" * 66)
        print(" AVAILABLE API ENDPOINTS:")
        print("  • GET  http://localhost:5000/api/state         -> Fetch current stats")
        print("  • POST http://localhost:5000/api/control       -> Set AI commands")
        print("  • POST http://localhost:5000/api/grid/toggle   -> Trigger manual outage")
        print("=" * 66)
        print(" Press Ctrl+C to terminate simulation.")
        
        time.sleep(1.0)

if __name__ == '__main__':
    # Initialize history with a single physics tick so indexes don't error
    sim.update_physics()
    
    # Start physics simulation thread
    sim_thread = threading.Thread(target=run_simulation_loop, daemon=True)
    sim_thread.start()
    
    # Start visual display thread
    display_thread = threading.Thread(target=draw_ascii_dashboard, daemon=True)
    display_thread.start()
    
    try:
        # Run Flask web server on port 5000
        # Host '0.0.0.0' allows external connections if running on local network
        app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        print("\nStopping Lumina simulator gracefully...")
        sim.is_running = False
