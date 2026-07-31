#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>

// Wi-Fi Credentials for Wokwi Simulator
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Next.js API Endpoint URL (Replace with your actual Vercel or Ngrok endpoint URL)
const char* serverName = "https://your-cee-ai-app.vercel.app/api/v1/telemetry/ingest";

// Hardware Input Pins
const int PIN_GRID_INCOMING = 12;    // Government Grid (Slide Switch)
const int PIN_SOLAR_INCOMING = 35;   // Solar Irradiance (LDR Sensor)
const int PIN_BATTERY_INCOMING = 34; // Battery SoC (Potentiometer)

// Hardware Output Pins
const int PIN_ESSENTIAL_OUTGOING = 18;   // Essential Load (Green LED Relay)
const int PIN_NONESSENTIAL_OUTGOING = 19; // Non-Essential Load (Red LED Relay)

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);

  // Initialize GPIOs
  pinMode(PIN_GRID_INCOMING, INPUT_PULLUP);
  pinMode(PIN_ESSENTIAL_OUTGOING, OUTPUT);
  pinMode(PIN_NONESSENTIAL_OUTGOING, OUTPUT);

  // Default output states (both energized on boot)
  digitalWrite(PIN_ESSENTIAL_OUTGOING, HIGH);
  digitalWrite(PIN_NONESSENTIAL_OUTGOING, HIGH);

  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("CONNECTING WI-FI");
  
  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected to Wi-Fi!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    lcd.setCursor(0, 1);
    lcd.print("Wi-Fi Connected!");
  } else {
    Serial.println("\nWi-Fi Connection Failed (Local Offline Mode Active)");
    lcd.setCursor(0, 1);
    lcd.print("Offline Mode");
  }
  delay(1500);
}

void loop() {
  // 1. Read Inputs (Sensor Telemetry)
  bool gridOnline = digitalRead(PIN_GRID_INCOMING) == HIGH;
  int rawSolar = analogRead(PIN_SOLAR_INCOMING);
  int solarKw = map(rawSolar, 0, 4095, 0, 50); // Scale up to 50kW peak capacity
  int rawBattery = analogRead(PIN_BATTERY_INCOMING);
  int batterySoc = map(rawBattery, 0, 4095, 0, 100); // Scale to 0-100%

  // Fallback default state control (offline algorithm)
  bool shedEssential = false;
  bool shedNonEssential = false;

  // 2. HTTP POST Telemetry to Next.js API
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");

    // Package JSON Payload
    StaticJsonDocument<200> doc;
    doc["device_id"] = "ESP32-GATEWAY-001";
    doc["grid_status"] = gridOnline ? "ONLINE" : "OUTAGE";
    doc["solar_gen_kw"] = solarKw;
    doc["battery_soc"] = batterySoc;

    String requestBody;
    serializeJson(doc, requestBody);

    Serial.print("Sending Telemetry to API: ");
    Serial.println(requestBody);

    int httpResponseCode = http.POST(requestBody);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.print("HTTP Response Code: ");
      Serial.println(httpResponseCode);
      Serial.print("API Response: ");
      Serial.println(response);

      // Parse AI Dispatch commands returned from the Next.js API
      StaticJsonDocument<300> responseDoc;
      DeserializationError error = deserializeJson(responseDoc, response);

      if (!error) {
        shedEssential = responseDoc["commands"]["shed_essential"];
        shedNonEssential = responseDoc["commands"]["shed_non_essential"];
      }
    } else {
      Serial.print("Error sending POST request: ");
      Serial.println(httpResponseCode);
      // Fallback to local logic on error
      if (!gridOnline) {
        shedNonEssential = true;
        if (batterySoc <= 15) shedEssential = true;
      }
    }
    http.end();
  } else {
    // Offline logic fallback
    if (!gridOnline) {
      shedNonEssential = true;
      if (batterySoc <= 15) shedEssential = true;
    }
  }

  // 3. Actuate Relays (Note: Relay modules are typically active-LOW, adjusting output logic)
  digitalWrite(PIN_ESSENTIAL_OUTGOING, shedEssential ? LOW : HIGH);
  digitalWrite(PIN_NONESSENTIAL_OUTGOING, shedNonEssential ? LOW : HIGH);

  // 4. Update LCD Diagnostics Screen
  lcd.clear();
  if (gridOnline) {
    lcd.setCursor(0, 0);
    lcd.print("GRID: ONLINE");
    lcd.setCursor(0, 1);
    lcd.print("SOL:" + String(solarKw) + "kW B:" + String(batterySoc) + "%");
  } else {
    lcd.setCursor(0, 0);
    lcd.print("*GRID OUTAGE!*");
    lcd.setCursor(0, 1);
    if (!shedEssential) {
      lcd.print("ESS-ONLY B:" + String(batterySoc) + "%");
    } else {
      lcd.print("CRITICAL SHUTDOWN");
    }
  }

  delay(3000); // Poll/Upload every 3 seconds
}
