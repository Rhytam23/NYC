# Smart Meter Reader — ESP32 Firmware Scaffold

> Production firmware is not yet implemented. This scaffold defines the structure and key interfaces for the ESP32 Modbus reader node.

## Project Structure (PlatformIO)

```
smart-meter-reader/
├── platformio.ini               # PlatformIO config (ESP32, Arduino framework)
├── src/
│   ├── main.cpp                 # Arduino setup() / loop()
│   ├── modbus_reader.h/.cpp     # Modbus RTU register reads via MAX485
│   ├── mqtt_client.h/.cpp       # MQTT publish over Wi-Fi TLS
│   ├── config.h                 # Wi-Fi credentials, MQTT settings (provisioned)
│   └── register_maps.h          # Genus meter register definitions
├── test/
│   └── test_modbus_parser.cpp   # Unity unit tests for register parsing
└── README.md                    # This file
```

## platformio.ini (planned)

```ini
[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps =
  4-20ma/ModbusMaster
  knolleary/PubSubClient
  bblanchon/ArduinoJson
monitor_speed = 115200
build_flags = -DCORE_DEBUG_LEVEL=3
```

## Key Behavior

1. On boot: Connect to Wi-Fi → Connect to MQTT broker → Start polling loop
2. Every 10 seconds: Read Modbus registers from meter → Parse → Publish MQTT
3. Every 60 seconds: Publish heartbeat
4. On Wi-Fi loss: Buffer last 100 readings in SPIRAM → Republish on reconnect
5. OTA: Listen for OTA updates via `ArduinoOTA`

## Bill of Materials

| Component | Spec | Qty |
|---|---|---|
| ESP32-WROOM-32U module | 240 MHz, 4 MB flash, external antenna | 1 |
| MAX485 RS-485 transceiver | Half-duplex, 3.3V compatible | 1 |
| 120Ω termination resistor | 1/4W | 1 |
| TVS diode (RS-485 protection) | SMAJ5.0A | 2 |
| 5V DIN PSU | Mean Well HDR-15-5 | 1 |
| 3.3V LDO | AMS1117-3.3 | 1 |
| DIN enclosure | 3-module size | 1 |
