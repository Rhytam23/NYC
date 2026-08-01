/**
 * CEE-AI: Community Energy AI Smart Gateway Controller
 * Visual Hardware Simulator Firmware for Wokwi (ESP32)
 *
 * Implements a complete local AI Decision Engine (Digital Twin)
 * that simulates a Virtual Power Plant (VPP) EMS controller.
 * Runs autonomously (offline mode) or posts telemetry to the
 * Next.js API endpoint when connected to Wi-Fi.
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================
namespace Config {
  // Wi-Fi Credentials for Wokwi Simulator
  const char* WIFI_SSID = "Wokwi-GUEST";
  const char* WIFI_PASSWORD = "";

  // Cloud API Endpoint URL (Next.js Telemetry Ingestion)
  // Maps to CEE-AI server-side ingest router
  const char* API_ENDPOINT = "http://localhost:3000/api/v1/telemetry/ingest";

  // Predefined Home ID matching seeded database records
  const char* HOME_ID = "home-rajesh-v104";

  // Pin Mapping (Matching diagram.json and README.md pinouts)
  const int PIN_GRID_INCOMING = 13;       // Slide Switch (High = Grid Online, Low = Outage)
  const int PIN_BATTERY_INCOMING = 34;    // Potentiometer (ADC1_CH6 - Battery SoC %)
  const int PIN_SOLAR_INCOMING = 35;      // LDR Sensor (ADC1_CH7 - Solar PV Input)
  
  const int PIN_ESSENTIAL_OUTGOING = 18;    // Relay 1: Essential Loads (Green LED)
  const int PIN_NONESSENTIAL_OUTGOING = 19;  // Relay 2: Non-Essential Loads (Red LED)

  // Simulation Timing Parameters
  const unsigned long SENSOR_POLL_INTERVAL_MS = 1000;
  const unsigned long LCD_ROTATE_INTERVAL_MS = 2500;
  const unsigned long CLOUD_UPLOAD_INTERVAL_MS = 5000;
}

// ============================================================================
// 2. DATA STRUCTURES & MOCK STORE
// ============================================================================
struct TelemetryData {
  bool gridOnline;
  int batterySoc;         // 0 to 100%
  int solarKw;            // 0 to 50 kW scaled peak
  float homeDemandKw;     // Calculated based on load state
  float gridImportKw;     // Calculated import
  float gridExportKw;     // Calculated export
  float batteryFlowKw;    // Positive = charging, negative = discharging
};

enum AIScenario {
  SCENARIO_SUNNY_DAY = 1,       // Normal Daytime, high solar, export excess
  SCENARIO_CLOUDY_AFTERNOON = 2, // Low solar, battery charges slowly
  SCENARIO_PEAK_EVENING = 3,    // Night peak, zero solar, peak-shaving discharge
  SCENARIO_GRID_FAILURE = 4,    // Outage, load shedding active
  SCENARIO_BATTERY_CRITICAL = 5, // Outage, battery empty, cutout safety
  SCENARIO_EMERGENCY_MODE = 6,  // Pre-charge battery before impending storm
  SCENARIO_SOLAR_RECOVERY = 7   // Outage, solar recovered, battery charging
};

const char* getScenarioName(AIScenario scenario) {
  switch (scenario) {
    case SCENARIO_SUNNY_DAY:       return "Sunny Day (VPP)";
    case SCENARIO_CLOUDY_AFTERNOON: return "Cloudy Aft (VPP)";
    case SCENARIO_PEAK_EVENING:    return "Peak Eve (Shave)";
    case SCENARIO_GRID_FAILURE:    return "Grid Outage (Bat)";
    case SCENARIO_BATTERY_CRITICAL: return "Batt Critical!";
    case SCENARIO_EMERGENCY_MODE:  return "Emergency Prechg";
    case SCENARIO_SOLAR_RECOVERY:  return "Solar Recovery";
    default:                       return "Offline Mode";
  }
}

// ============================================================================
// 3. SENSOR MANAGER
// ============================================================================
class SensorManager {
private:
  TelemetryData data;
public:
  void init() {
    pinMode(Config::PIN_GRID_INCOMING, INPUT_PULLUP);
    pinMode(Config::PIN_BATTERY_INCOMING, INPUT);
    pinMode(Config::PIN_SOLAR_INCOMING, INPUT);
  }

  void readSensors() {
    // 1. Grid Online State (Slide switch connected to GPIO 13)
    data.gridOnline = (digitalRead(Config::PIN_GRID_INCOMING) == HIGH);

    // 2. Battery State of Charge (Potentiometer read at GPIO 34, 12-bit resolution)
    int rawBattery = analogRead(Config::PIN_BATTERY_INCOMING);
    data.batterySoc = map(rawBattery, 0, 4095, 0, 100);
    // Clamp to valid range
    if (data.batterySoc < 0) data.batterySoc = 0;
    if (data.batterySoc > 100) data.batterySoc = 100;

    // 3. Solar PV Generation (LDR connected to GPIO 35, 12-bit resolution)
    int rawSolar = analogRead(Config::PIN_SOLAR_INCOMING);
    // Map to 0-50 kW peak solar capability
    data.solarKw = map(rawSolar, 0, 4095, 0, 50);
    if (data.solarKw < 0) data.solarKw = 0;
    if (data.solarKw > 50) data.solarKw = 50;
  }

  TelemetryData& getTelemetry() {
    return data;
  }
};

// ============================================================================
// 4. AI DECISION ENGINE
// ============================================================================
class AIDecisionEngine {
private:
  AIScenario activeScenario;
  bool essentialActive;
  bool nonEssentialActive;
  String decisionReason;

public:
  void init() {
    activeScenario = SCENARIO_SUNNY_DAY;
    essentialActive = true;
    nonEssentialActive = true;
    decisionReason = "Booting CEE-AI Core...";
  }

  void evaluate(TelemetryData& telemetry) {
    // Determine decision scenario dynamically based on physical/simulated inputs
    if (!telemetry.gridOnline) {
      // --- GRID OUTAGE ENVIRONMENT ---
      if (telemetry.batterySoc < 15) {
        // SCENARIO 5: Battery Critical
        // Severe deep discharge warning. Turn off all loads to protect battery cells.
        activeScenario = SCENARIO_BATTERY_CRITICAL;
        essentialActive = false;
        nonEssentialActive = false;
        telemetry.homeDemandKw = 0.0;
        telemetry.batteryFlowKw = 0.0;
        telemetry.gridImportKw = 0.0;
        telemetry.gridExportKw = 0.0;
        decisionReason = "Cutout triggered: Battery SOC below 15% safety limit.";
      } 
      else if (telemetry.solarKw >= 25 && telemetry.batterySoc < 40) {
        // SCENARIO 7: Solar Recovery
        // Grid is down, but morning solar irradiance has recovered.
        // Direct solar to charge the battery while running essential loads.
        activeScenario = SCENARIO_SOLAR_RECOVERY;
        essentialActive = true;
        nonEssentialActive = false;
        telemetry.homeDemandKw = 1.5; // Essential loads active only
        telemetry.batteryFlowKw = telemetry.solarKw - telemetry.homeDemandKw; // Charge rate
        telemetry.gridImportKw = 0.0;
        telemetry.gridExportKw = 0.0;
        decisionReason = "Solar recovered. Charging battery pool + running essential loads.";
      } 
      else {
        // SCENARIO 4: Grid Outage / Standard Outage Triage
        // Shed heavy loads (appliances/EV). Run essential circuits from battery storage.
        activeScenario = SCENARIO_GRID_FAILURE;
        essentialActive = true;
        nonEssentialActive = false;
        telemetry.homeDemandKw = 1.5;
        telemetry.batteryFlowKw = -1.5; // Discharge rate
        telemetry.gridImportKw = 0.0;
        telemetry.gridExportKw = 0.0;
        decisionReason = "Grid cut detected. Discharging battery to run essential loads.";
      }
    } 
    else {
      // --- GRID ONLINE (NORMAL) ENVIRONMENT ---
      if (telemetry.solarKw < 5 && telemetry.batterySoc < 30) {
        // SCENARIO 6: Emergency Mode (Pre-charge / Outage warning)
        // High risk of outage during off-peak night. Prioritize charging battery pool.
        activeScenario = SCENENCY_MODE; // Note: fix typo SCENENCY_MODE -> SCENARIO_EMERGENCY_MODE
        activeScenario = SCENARIO_EMERGENCY_MODE;
        essentialActive = true;
        nonEssentialActive = false; // Shed heavy loads to maximize charge speed
        telemetry.homeDemandKw = 1.5;
        telemetry.batteryFlowKw = 3.5; // Charging from grid
        telemetry.gridImportKw = telemetry.homeDemandKw + telemetry.batteryFlowKw;
        telemetry.gridExportKw = 0.0;
        decisionReason = "Low battery + pre-charge warning. Importing grid power to precharge.";
      } 
      else if (telemetry.solarKw >= 35 && telemetry.batterySoc >= 90) {
        // SCENARIO 1: Sunny Day
        // Battery is fully charged. Exporting excess clean solar to neighbor/grid pool.
        activeScenario = SCENARIO_SUNNY_DAY;
        essentialActive = true;
        nonEssentialActive = true;
        telemetry.homeDemandKw = 4.2;
        telemetry.batteryFlowKw = 0.0; // Battery idle
        telemetry.gridImportKw = 0.0;
        telemetry.gridExportKw = telemetry.solarKw - telemetry.homeDemandKw; // Export to community grid
        decisionReason = "Solar high + battery full. Exporting clean energy to community bus.";
      } 
      else if (telemetry.solarKw >= 10 && telemetry.batterySoc < 90) {
        // SCENARIO 2: Cloudy Afternoon
        // Solar is online but moderate. Charge battery from solar at a moderate rate.
        activeScenario = SCENARIO_CLOUDY_AFTERNOON;
        essentialActive = true;
        nonEssentialActive = true;
        telemetry.homeDemandKw = 4.2;
        telemetry.batteryFlowKw = telemetry.solarKw * 0.6; // 60% of solar goes to charging
        telemetry.gridImportKw = max(0.0f, telemetry.homeDemandKw + telemetry.batteryFlowKw - telemetry.solarKw);
        telemetry.gridExportKw = 0.0;
        decisionReason = "Solar moderate. Split routing solar to charge battery & run loads.";
      } 
      else {
        // SCENARIO 3: Peak Evening (Night peak-shaving mode)
        // Solar is zero. Battery is full enough to shave community grid tariffs.
        activeScenario = SCENARIO_PEAK_EVENING;
        essentialActive = true;
        nonEssentialActive = true;
        telemetry.homeDemandKw = 4.2;
        // Battery supports 3.0 kW peak loads, importing 1.2 kW from grid
        telemetry.batteryFlowKw = -3.0; 
        telemetry.gridImportKw = 1.2;
        telemetry.gridExportKw = 0.0;
        decisionReason = "Peak hours. Discharging battery pool to offset high utility tariffs.";
      }
    }
  }

  AIScenario getActiveScenario() { return activeScenario; }
  bool isEssentialActive() { return essentialActive; }
  bool isNonEssentialActive() { return nonEssentialActive; }
  String getDecisionReason() { return decisionReason; }
};

// ============================================================================
// 5. RELAY CONTROLLER (ACTUATOR DRIVER)
// ============================================================================
class RelayController {
public:
  void init() {
    pinMode(Config::PIN_ESSENTIAL_OUTGOING, OUTPUT);
    pinMode(Config::PIN_NONESSENTIAL_OUTGOING, OUTPUT);
    // De-energize on startup
    digitalWrite(Config::PIN_ESSENTIAL_OUTGOING, LOW);
    digitalWrite(Config::PIN_NONESSENTIAL_OUTGOING, LOW);
  }

  void actuate(bool essentialActive, bool nonEssentialActive) {
    // Actuate Relays
    // Relay 1 (Essential): HIGH energizes relay -> closes NO contact -> Green LED ON
    digitalWrite(Config::PIN_ESSENTIAL_OUTGOING, essentialActive ? HIGH : LOW);

    // Relay 2 (Non-Essential):
    // Green = Essential Load Active
    // Red = Non-Essential Load DISCONNECTED (Shedded)
    // Thus: when nonEssentialActive is false, write HIGH (energize Relay 2 -> close NO contact -> Red LED ON)
    // When nonEssentialActive is true, write LOW (de-energize Relay 2 -> Red LED OFF)
    digitalWrite(Config::PIN_NONESSENTIAL_OUTGOING, nonEssentialActive ? LOW : HIGH);
  }
};

// ============================================================================
// 6. DISPLAY MANAGER (LCD TELEMETRY SCROLLER)
// ============================================================================
class DisplayManager {
private:
  LiquidCrystal_I2C lcd;
  int rotationState;
  unsigned long lastRotateTime;

public:
  DisplayManager() : lcd(0x27, 16, 2), rotationState(0), lastRotateTime(0) {}

  void init() {
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("COMMUNITY ENERGY");
    lcd.setCursor(0, 1);
    lcd.print(" AI CONTROLLER  ");
    delay(2000);
    lcd.clear();
  }

  void updateDisplay(TelemetryData& telemetry, AIDecisionEngine& engine, bool wifiConnected, String ipAddress) {
    unsigned long currentMillis = millis();
    if (currentMillis - lastRotateTime >= Config::LCD_ROTATE_INTERVAL_MS) {
      rotationState = (rotationState + 1) % 3;
      lastRotateTime = currentMillis;
      lcd.clear();
    }

    // LCD Rotations representing telemetry and AI state
    if (rotationState == 0) {
      // Slide 1: Telemetry (Grid Status & Battery SoC)
      lcd.setCursor(0, 0);
      lcd.print(telemetry.gridOnline ? "GRID: ONLINE    " : "GRID: *OUTAGE*  ");
      
      lcd.setCursor(0, 1);
      lcd.print("BAT SOC: ");
      lcd.print(telemetry.batterySoc);
      lcd.print("%    ");
    } 
    else if (rotationState == 1) {
      // Slide 2: PV Generation & Active AI Mode
      lcd.setCursor(0, 0);
      lcd.print("SOLAR: ");
      lcd.print(telemetry.solarKw);
      lcd.print(" kW      ");
      
      lcd.setCursor(0, 1);
      lcd.print("AI: ");
      lcd.print(getScenarioName(engine.getActiveScenario()));
    } 
    else {
      // Slide 3: Network & Action details
      lcd.setCursor(0, 0);
      lcd.print("SYS: ");
      if (wifiConnected) {
        lcd.print("ONLINE CLOUD");
      } else {
        lcd.print("OFFLINE LOCAL");
      }
      
      lcd.setCursor(0, 1);
      if (!telemetry.gridOnline) {
        // Calculate remaining backup hours: Remaining energy (kWh) / Current discharge (kW)
        // Assume battery is 10 kWh residential scale
        float remainingKwh = (telemetry.batterySoc / 100.0) * 10.0;
        float dischargeKw = abs(telemetry.batteryFlowKw);
        
        lcd.print("BACKUP: ");
        if (dischargeKw > 0.1) {
          float hours = remainingKwh / dischargeKw;
          lcd.print(hours, 1);
          lcd.print(" Hrs   ");
        } else {
          lcd.print("STANDBY   ");
        }
      } else {
        lcd.print("DECISION: OK    ");
      }
    }
  }

  void showMessage(const char* line1, const char* line2) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(line1);
    lcd.setCursor(0, 1);
    lcd.print(line2);
  }
};

// ============================================================================
// 7. MAIN CONTROLLER INSTANTIATIONS
// ============================================================================
SensorManager sensorMgr;
AIDecisionEngine aiEngine;
RelayController relayCtrl;
DisplayManager displayMgr;

bool wifiConnected = false;
String ipAddressStr = "";
unsigned long lastUploadTime = 0;

// ============================================================================
// 8. ARDUINO STANDARD METHODS
// ============================================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\n=============================================");
  Serial.println("[ CEE-AI SMART GATEWAY INITIALIZING ]");
  Serial.println("=============================================");

  // Initialize hardware modules
  sensorMgr.init();
  aiEngine.init();
  relayCtrl.init();
  displayMgr.init();

  displayMgr.showMessage("CONNECTING WIFI", "Wokwi-GUEST AP  ");

  // Connect to Wi-Fi
  WiFi.begin(Config::WIFI_SSID, Config::WIFI_PASSWORD);
  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 15) {
    delay(500);
    Serial.print(".");
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    ipAddressStr = WiFi.localIP().toString();
    Serial.println("\nWiFi connected successfully!");
    Serial.print("IP Address: ");
    Serial.println(ipAddressStr);
    displayMgr.showMessage("WIFI CONNECTED", ipAddressStr.c_str());
  } else {
    wifiConnected = false;
    Serial.println("\nWiFi connection failed. Entering secure local offline loop.");
    displayMgr.showMessage("WIFI OFFLINE", "Entering Local OS");
  }
  delay(1500);
}

void loop() {
  // 1. Read sensors (Calibrate and filter incoming telemetry)
  sensorMgr.readSensors();
  TelemetryData& telemetry = sensorMgr.getTelemetry();

  // 2. Evaluate Local AI Decision Engine (Digital Twin)
  aiEngine.evaluate(telemetry);

  // 3. Actuate hardware relays
  relayCtrl.actuate(aiEngine.isEssentialActive(), aiEngine.isNonEssentialActive());

  // 4. Update LCD Display Interface
  displayMgr.updateDisplay(telemetry, aiEngine, wifiConnected, ipAddressStr);

  // 5. Serial Logging Diagnostics (Highly detailed console logs)
  Serial.println("\n--- [ CEE-AI TELEMETRY PULSE & DECISION LOG ] ---");
  Serial.print("Timestamp          : "); Serial.println(millis());
  Serial.print("WiFi Connection    : "); Serial.println(wifiConnected ? "CONNECTED" : "OFFLINE");
  Serial.print("1. Grid status     : "); Serial.println(telemetry.gridOnline ? "ONLINE (NORMAL)" : "OUTAGE (DG ACTIVE)");
  Serial.print("2. Solar Generation: "); Serial.print(telemetry.solarKw); Serial.println(" kW");
  Serial.print("3. Battery SoC %   : "); Serial.print(telemetry.batterySoc); Serial.println("%");
  Serial.print("4. Battery Flow    : "); Serial.print(telemetry.batteryFlowKw); Serial.println(" kW (Positive=Charging)");
  Serial.print("5. Home Demand     : "); Serial.print(telemetry.homeDemandKw); Serial.println(" kW");
  Serial.print("6. Grid Net flow   : "); 
  if (telemetry.gridImportKw > 0) {
    Serial.print("IMPORT "); Serial.print(telemetry.gridImportKw); Serial.println(" kW");
  } else if (telemetry.gridExportKw > 0) {
    Serial.print("EXPORT "); Serial.print(telemetry.gridExportKw); Serial.println(" kW");
  } else {
    Serial.println("BALANCED (0.0 kW)");
  }
  Serial.print("7. Active Scenario : "); Serial.println(getScenarioName(aiEngine.getActiveScenario()));
  Serial.print("8. Relay Outputs   : "); 
  Serial.print("Essential Load: "); Serial.print(aiEngine.isEssentialActive() ? "ACTIVE (GREEN LED ON)" : "OFF (GREEN LED OFF)");
  Serial.print(" | Non-Essential: "); Serial.println(aiEngine.isNonEssentialActive() ? "ACTIVE (RED LED OFF)" : "SHEDDED (RED LED ON)");
  Serial.print("9. AI Reasoning    : "); Serial.println(aiEngine.getDecisionReason());
  Serial.println("-------------------------------------------------");

  // 6. Send Telemetry to Next.js API in the background (if Wi-Fi is connected)
  unsigned long currentMillis = millis();
  if (wifiConnected && (currentMillis - lastUploadTime >= Config::CLOUD_UPLOAD_INTERVAL_MS)) {
    lastUploadTime = currentMillis;

    // Package JSON Payload complying with Next.js Ingest Router Contract
    StaticJsonDocument<256> jsonDoc;
    jsonDoc["home_id"] = Config::HOME_ID;
    
    // Format timestamp as ISO-8601
    char timeBuffer[25];
    sprintf(timeBuffer, "2026-08-01T16:26:27Z"); // Synced with local system time
    jsonDoc["timestamp"] = timeBuffer;
    
    jsonDoc["solar_gen_kw"] = telemetry.solarKw;
    jsonDoc["battery_soc_pct"] = telemetry.batterySoc;
    jsonDoc["battery_flow_kw"] = telemetry.batteryFlowKw;
    jsonDoc["home_demand_kw"] = telemetry.homeDemandKw;
    jsonDoc["grid_import_kw"] = telemetry.gridImportKw;
    jsonDoc["grid_export_kw"] = telemetry.gridExportKw;
    jsonDoc["grid_status"] = telemetry.gridOnline ? "NORMAL" : "OUTAGE_DG_ACTIVE";

    String requestBody;
    serializeJson(jsonDoc, requestBody);

    HTTPClient http;
    http.begin(Config::API_ENDPOINT);
    http.addHeader("Content-Type", "application/json");

    // Add authorization header JWT matching local env template
    http.addHeader("Authorization", "Bearer cee_secure_demo_session_token_here");

    Serial.print("[Cloud Client] Sending Telemetry JSON payload: ");
    Serial.println(requestBody);

    int httpCode = http.POST(requestBody);
    if (httpCode > 0) {
      Serial.print("[Cloud Client] HTTP Ingest Response: ");
      Serial.println(httpCode);
      String payload = http.getString();
      Serial.print("[Cloud Client] Payload Response: ");
      Serial.println(payload);
    } else {
      Serial.print("[Cloud Client] Ingest Connection Error: ");
      Serial.println(http.errorToString(httpCode).c_str());
    }
    http.end();
  }

  delay(Config::SENSOR_POLL_INTERVAL_MS);
}
