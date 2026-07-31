#!/usr/bin/env python3
"""
Lumina: Community Energy AI - Demo Control Client
NYC Hackathon Prototype

This script demonstrates how your frontend dashboard or AI orchestration 
agent can interact with the Lumina Hardware Prototype Simulator over HTTP.
It polls the simulator's state and automatically triggers actions, such as 
shedding non-essential loads or managing battery dispatch when an outage occurs.
"""

import time
import urllib.request
import json

SIMULATOR_URL = "http://localhost:5000"

def fetch_state():
    """Fetches real-time telemetry from the simulator."""
    try:
        with urllib.request.urlopen(f"{SIMULATOR_URL}/api/state") as response:
            if response.status == 200:
                return json.loads(response.read().decode())
    except Exception as e:
        print(f"❌ Error connecting to simulator: {e}")
        return None

def send_control_command(battery_mode=None, shed_non_essential=None):
    """Sends control instructions to the smart gateway."""
    payload = {}
    if battery_mode is not None:
        payload["battery_mode"] = battery_mode
    if shed_non_essential is not None:
        payload["shed_non_essential"] = shed_non_essential

    req = urllib.request.Request(
        f"{SIMULATOR_URL}/api/control",
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print(f"✅ Control Command Sent: {payload}")
                return json.loads(response.read().decode())
    except Exception as e:
        print(f"❌ Error sending control command: {e}")
    return None

def trigger_outage_toggle():
    """Simulates a physical grid outage / recovery on the hardware."""
    req = urllib.request.Request(
        f"{SIMULATOR_URL}/api/grid/toggle",
        data=b"{}",
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                res_data = json.loads(response.read().decode())
                print(f"🔌 Grid Status Toggled! New Status: {res_data.get('grid_status')}")
                return res_data
    except Exception as e:
        print(f"❌ Error toggling grid: {e}")
    return None

def run_ai_orchestration_loop():
    """
    A simple AI energy-management control loop.
    Monitors grid state, solar, and battery to make cost-saving 
    and resilience-oriented decisions.
    """
    print("=" * 60)
    print("        🤖 LUMINA AI CO-PILOT ORCHESTRATOR DEMO RUNNING 🤖")
    print("=" * 60)
    print("Connecting to Lumina Smart Gateway Simulator...")
    
    # Try fetching initial state
    state = fetch_state()
    if not state:
        print("\n[!] Please start 'lumina_simulator.py' in a separate terminal window first!")
        return
        
    print(f"Connection established! Simulator current clock: {state['clock']['formatted_time']}\n")
    
    # Run a brief automated run-through for 10 cycles
    for i in range(1, 11):
        print(f"\n[Cycle {i}/10] Monitoring System Telemetry...")
        state = fetch_state()
        if not state:
            break
            
        clk = state["clock"]["formatted_time"]
        grid_status = state["grid"]["status"]
        soc = state["battery"]["soc_percent"]
        solar = state["solar"]["generation_kw"]
        total_load = state["community_load"]["total_kw"]
        
        print(f"   Time: {clk} | Grid: {grid_status} | Solar: {solar} kW | Battery: {soc}% | Load: {total_load} kW")
        
        # Example AI Business Logic
        if grid_status == "OUTAGE":
            print("   ⚠️  OUTAGE DETECTED! Running Grid Outage Resilience protocol.")
            if soc > 35:
                print("   🔋 Battery SoC is comfortable. Maintaining essential + non-essential loads.")
                send_control_command(battery_mode="AUTO", shed_non_essential=False)
            else:
                print("   🚨 Critical Battery! Initiating community load-shedding to preserve backup.")
                # Turn off non-essential loads (lifts/pumps remain active, apartments dimmed)
                send_control_command(battery_mode="HOLD", shed_non_essential=True)
                
        else: # Grid is ONLINE
            # Look at tariff rates and time to optimize charging/discharging
            price = state["grid"]["price_per_kwh"]
            if price > 20: # Peak Pricing period
                print(f"   📈 High Grid Tariff ({price} INR/kWh). Discharging battery to offset load.")
                send_control_command(battery_mode="FORCE_DISCHARGE", shed_non_essential=False)
            elif solar > total_load + 10 and soc < 95:
                print("   ☀️  Abundant Solar available! Charging battery using excess green power.")
                send_control_command(battery_mode="AUTO", shed_non_essential=False)
            elif price <= 12 and soc < 80:
                print(f"   📉 Cheap Grid Tariff ({price} INR/kWh) & low battery. Charging from grid.")
                send_control_command(battery_mode="FORCE_CHARGE", shed_non_essential=False)
            else:
                print("   💡 Operating in standard cost-minimizing AUTO mode.")
                send_control_command(battery_mode="AUTO", shed_non_essential=False)
                
        # Simulate toggling an outage on cycle 4 for demo purposes
        if i == 4:
            print("\n--- [Demo Event] Simulating a sudden physical utility grid outage! ---")
            trigger_outage_toggle()
            
        # Simulate power restoring on cycle 8
        if i == 8:
            print("\n--- [Demo Event] Grid electricity restored by utility company! ---")
            trigger_outage_toggle()
            
        time.sleep(2.0)

if __name__ == "__main__":
    run_ai_orchestration_loop()
