/* ESP32 HTTP IoT Server Example for Wokwi.com

  https://wokwi.com/projects/320964045035274834

  To test, you need the Wokwi IoT Gateway, as explained here:

  https://docs.wokwi.com/guides/esp32-wifi#the-private-gateway

  Then start the simulation, and open http://localhost:9080
  in another browser tab.

  Note that the IoT Gateway requires a Wokwi Club subscription.
  To purchase a Wokwi Club subscription, go to https://wokwi.com/club
*/

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define GRID_PIN 13         // Utility Grid Node Sensor
#define BATT_SOC_PIN 34     // Battery SoC Node Sensor
#define SOLAR_LDR_PIN 35    // Solar PV Input Sensor
#define RELAY_ESSENTIAL 18  // Essential Load Relay
#define RELAY_NONESS 19     // Non-Essential Load Relay

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  Serial.begin(115200);

  pinMode(GRID_PIN, INPUT_PULLDOWN);
  pinMode(RELAY_ESSENTIAL, OUTPUT);
  pinMode(RELAY_NONESS, OUTPUT);

  lcd.init();
  lcd.backlight();
  
  lcd.setCursor(0, 0);
  lcd.print(" Lumina AI OS ");
  lcd.setCursor(0, 1);
  lcd.print("Energy Gateway");
  delay(2000);
  lcd.clear();
}

void loop() {
  bool gridAvailable = digitalRead(GRID_PIN);
  int batterySoC = map(analogRead(BATT_SOC_PIN), 0, 4095, 0, 100);
  int solarPower = map(analogRead(SOLAR_LDR_PIN), 0, 4095, 0, 100);

  bool essentialActive = (batterySoC > 15);
  bool nonEssentialActive = gridAvailable || (batterySoC >= 50 && solarPower > 40);

  digitalWrite(RELAY_ESSENTIAL, essentialActive ? HIGH : LOW);
  digitalWrite(RELAY_NONESS, nonEssentialActive ? HIGH : LOW);

  // LCD Line 1: Telemetry
  lcd.setCursor(0, 0);
  lcd.print(gridAvailable ? "GRID:ON " : "GRID:OFF");
  lcd.print(" BATT:");
  if (batterySoC < 10) lcd.print(" ");
  lcd.print(batterySoC);
  lcd.print("%");

  // LCD Line 2: System Status Text
  lcd.setCursor(0, 1);
  if (gridAvailable) {
    lcd.print("MODE: NORMAL PWR");
  } else if (!gridAvailable && nonEssentialActive) {
    lcd.print("MODE: SOLAR+BATT");
  } else if (!gridAvailable && essentialActive) {
    lcd.print("LOAD SHEDDING ON");
  } else {
    lcd.print("CRITICAL CUTOUT!");
  }

  // Serial Monitor Output with Component Tags
  Serial.println("=============================================");
  Serial.println("[ LUMINA AI GATEWAY TELEMETRY DIAGNOSTICS ]");
  Serial.print("1. Utility Grid Node    : "); 
  Serial.println(gridAvailable ? "ONLINE" : "OUTAGE");
  Serial.print("2. Rooftop Solar PV     : "); 
  Serial.print(solarPower); Serial.println("%");
  Serial.print("3. Battery Storage SoC  : "); 
  Serial.print(batterySoC); Serial.println("%");
  Serial.print("4. Essential Load Node  : "); 
  Serial.println(essentialActive ? "ACTIVE" : "SHUTDOWN");
  Serial.print("5. Non-Essential Load   : "); 
  Serial.println(nonEssentialActive ? "ACTIVE" : "SHEDDED");
  Serial.println("=============================================\n");

  delay(1000);
}