#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Network credentials for Wokwi's virtual WiFi router
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// PIN DEFINITIONS (Matching diagram.json)
const int PIN_GRID_INCOMING = 12;       // Government Grid Node (Slide Switch)
const int PIN_SOLAR_INCOMING = 35;      // Rooftop Solar PV Node (LDR Sensor)
const int PIN_BATTERY_INCOMING = 34;    // Battery Storage Node (Potentiometer)

const int PIN_ESSENTIAL_OUTGOING = 18;    // Outgoing Essential Loads (Green LED)
const int PIN_NONESSENTIAL_OUTGOING = 19;  // Outgoing Non-Essential Loads (Red LED)

// Setup HTTP server on port 80
WebServer server(80);

// Setup I2C LCD Screen (Standard I2C address 0x27)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Global simulation state variables
bool gridOnline = true;
int solarKw = 0;
int batterySoc = 100;
bool essentialOn = true;
bool nonEssentialOn = true;

// HTTP Endpoint: Return JSON Telemetry
void handleGetState() {
  String json = "{";
  json += "\"grid_status\":\"" + String(gridOnline ? "ONLINE" : "OUTAGE") + "\",";
  json += "\"solar_generation_kw\":" + String(solarKw) + ",";
  json += "\"battery_soc_percent\":" + String(batterySoc) + ",";
  json += "\"essential_load_active\":" + String(essentialOn ? "true" : "false") + ",";
  json += "\"non_essential_load_active\":" + String(nonEssentialOn ? "true" : "false");
  json += "}";
  server.send(200, "application/json", json);
}

// HTTP Endpoint: Root Page showing current status
void handleRoot() {
  String html = "<html><head><title>Lumina Gateway V2</title>";
  html += "<style>body{font-family:Arial; margin:40px; background:#121212; color:#e0e0e0;}";
  html += ".card{background:#1e1e1e; padding:20px; border-radius:8px; max-width:500px; margin:auto;}";
  html += "h1{color:#4CAF50;} .status{font-weight:bold; margin:10px 0;}</style></head>";
  html += "<body><div class='card'><h1>Lumina Gateway V2</h1>";
  html += "<div class='status'>Grid: " + String(gridOnline ? "<span style='color:green;'>ONLINE</span>" : "<span style='color:red;'>OUTAGE</span>") + "</div>";
  html += "<div class='status'>Battery State: " + String(batterySoc) + "%</div>";
  html += "<div class='status'>Solar Generation: " + String(solarKw) + " kW</div>";
  html += "<div class='status'>Essential Loads: " + String(essentialOn ? "ON" : "OFF") + "</div>";
  html += "<div class='status'>Non-Essential Loads: " + String(nonEssentialOn ? "ON" : "OFF") + "</div>";
  html += "<hr><p>Connected to <b>Wokwi-GUEST</b></p></div></body></html>";
  server.send(200, "text/html", html);
}

void setup() {
  Serial.begin(115200);
  
  pinMode(PIN_GRID_INCOMING, INPUT_PULLUP);
  pinMode(PIN_ESSENTIAL_OUTGOING, OUTPUT);
  pinMode(PIN_NONESSENTIAL_OUTGOING, OUTPUT);
  
  // Initialize Relays as ON
  digitalWrite(PIN_ESSENTIAL_OUTGOING, HIGH);
  digitalWrite(PIN_NONESSENTIAL_OUTGOING, HIGH);
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.print("LUMINA V2 NODE");
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi...");

  // Connect to simulated Wi-Fi
  WiFi.begin(ssid, password);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 10) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  Serial.println("");
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    lcd.clear();
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
  } else {
    Serial.println("WiFi Connection Failed.");
    lcd.clear();
    lcd.print("WiFi Offline");
    lcd.setCursor(0, 1);
    lcd.print("Local Loop Only");
  }
  delay(2000);

  // Bind Web Server endpoints
  server.on("/", handleRoot);
  server.on("/api/state", handleGetState);
  server.begin();
  Serial.println("HTTP Server started.");
}

void loop() {
  server.handleClient(); // Handle incoming API calls

  // Read physical/simulated incoming energy nodes
  gridOnline = digitalRead(PIN_GRID_INCOMING) == HIGH;
  
  int rawSolar = analogRead(PIN_SOLAR_INCOMING);
  solarKw = map(rawSolar, 0, 4095, 0, 50); // Scale up to 50 kW solar peak
  
  int rawBattery = analogRead(PIN_BATTERY_INCOMING);
  batterySoc = map(rawBattery, 0, 4095, 0, 100); // Scale to 100% SoC

  // Intelligent Local Control Logic
  if (!gridOnline) {
    // Grid Outage Mode
    if (batterySoc > 20) {
      // Moderate battery: Automate load-shedding to save capacity
      essentialOn = true;
      nonEssentialOn = false;
    } else {
      // Critical battery threshold: Turn off everything to prevent deep-discharge damage
      essentialOn = false;
      nonEssentialOn = false;
    }
  } else {
    // Normal Grid Online mode
    essentialOn = true;
    nonEssentialOn = true;
  }

  // Actuate hardware relay coils
  digitalWrite(PIN_ESSENTIAL_OUTGOING, essentialOn ? HIGH : LOW);
  digitalWrite(PIN_NONESSENTIAL_OUTGOING, nonEssentialOn ? HIGH : LOW);

  // Update Local LCD Display Screen
  lcd.clear();
  if (gridOnline) {
    lcd.setCursor(0, 0);
    lcd.print("GRID: ONLINE  ");
    lcd.setCursor(0, 1);
    lcd.print("SOL:" + String(solarKw) + "kW B:" + String(batterySoc) + "%");
  } else {
    lcd.setCursor(0, 0);
    lcd.print("*GRID OUTAGE!*");
    lcd.setCursor(0, 1);
    if (essentialOn) {
      lcd.print("ESS-ONLY B:" + String(batterySoc) + "%");
    } else {
      lcd.print("BATTERY CRITICAL");
    }
  }

  // Serial printing output for debugging
  Serial.print("Grid:"); Serial.print(gridOnline ? "ONLINE" : "OUTAGE");
  Serial.print(", Solar:"); Serial.print(solarKw);
  Serial.print(", Battery%:"); Serial.print(batterySoc);
  Serial.print(", Ess:"); Serial.print(essentialOn ? "ON" : "OFF");
  Serial.print(", Non-Ess:"); Serial.println(nonEssentialOn ? "ON" : "OFF");

  delay(500); // Quick check interval
}
