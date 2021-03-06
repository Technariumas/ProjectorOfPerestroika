#include <FS.h>
#include <ArduinoJson.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <WebSocketsServer.h>

ESP8266WiFiMulti wifiMulti;       // Create an instance of the ESP8266WiFiMulti class, called 'wifiMulti'
ESP8266WebServer server(80);       // create a web server on port 80

WebSocketsServer webSocket = WebSocketsServer(81);    // create a websocket server on port 81

char ssid[12] = ""; // The name of the Wi-Fi network that will be created
char password[11] = "";   // The password required to connect to it, leave blank for an open network


File fsUploadFile;                                    // a File variable to temporarily store the received file


#define LAMP D1
#define UP 0
#define DOWN 1
#define LED_RED D3
#define LED_GREEN D4
#define settingsFile  "/settings.json"
#define wifiSettingsFile  "/wifiSettings.json"

int wifiChannel = 3;

float voltage = 0;
int sleepTime = 10;  //change to 5 minutes
const int preheatValue = 30;
int maxBrightnessLimit = 900;

int maxBrightness = 3;
int brightness = preheatValue;
int blinkRate = 50;
String state = "OFF";
unsigned long prevMillis = millis();

unsigned long previousMillis = 0;
unsigned long currentMillis = 0;
int batteryCheckStep = 30*1000;
float dcf = 0.8; //initial duty cycle factor

void startSPIFFS();  
void loadWiFiSettings();
void startWiFi();
void startWebSocket();            
void startMDNS();                 
void startServer();

void setup() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  randomSeed(3);
  pinMode(LAMP, OUTPUT);    // the pins with LEDs connected are outputs
  digitalWrite(LAMP, LOW);
  pinMode(A0, INPUT_PULLUP);
  Serial.begin(115200);        // Start the Serial communication to send messages to the computer
  delay(10);
  Serial.println("\r\n");

  analogWriteFreq(18000);
  //analogWriteRange(1023);

  startSPIFFS();               // Start the SPIFFS and list all contents
  loadWiFiSettings();
    
  startWiFi();                 // Start a Wi-Fi access point, and try to connect to some given access points. Then wait for either an AP or STA connection

  startWebSocket();            // Start a WebSocket server
  
  startMDNS();                 // Start the mDNS responder

  startServer();               // Start a HTTP server with a file read handler and an upload handler

  loadSettings();
}




void loop() {
  webSocket.loop();                           // constantly check for websocket events
  server.handleClient();
  if(millis() > prevMillis + batteryCheckStep) { 
    voltage = 8*(analogRead(A0)/1023.0);
    sendVoltage(voltage);
    calculateDutyCycleFactor(voltage);
    if (voltage < 1.84) {
      state = "LOW";
    }
    prevMillis = millis();
  }

  if (state == "OFF") {
    startPreheat();
  }
  else if (state == "LOW") {
    Serial.println("Going to sleep");
    ESP.deepSleep(1000000*sleepTime); 
    }
    else if (state == "SHINE") {
    shine(brightness);
    }
  else if (state == "BLINK") {
    startFlicker();
  }
  else if (state == "DISC") {
    Serial.println("DISCONNECT websocket");
    //webSocket.stop();
    //webSocket.disconnect();
    state = "OFF";
    }
  else {
    Serial.println("Error");
    }
 
 }

void calculateDutyCycleFactor(float voltage) { //1.84 -- A0 measurement at 6.4V, nominal lamp voltage
  dcf = 1./(voltage/1.84);
  }

const size_t settingsBufferSize = JSON_OBJECT_SIZE(3) + 80;
StaticJsonBuffer<settingsBufferSize> jsonSettingsBuffer;
char settingsBuf[settingsBufferSize];

void loadSettings() {
  // parse json config file
  File jsonFile = SPIFFS.open(settingsFile, "r");
  if (jsonFile) {
    jsonSettingsBuffer.clear();
    JsonObject& root = jsonSettingsBuffer.parseObject(jsonFile);
    if (root.success()) {
      brightness = root["brightness"]; 
      maxBrightness = root["maxBrightness"]; 
      blinkRate = root["blinkRate"]; 
      root.printTo(Serial);
      yield();
      size_t s = root.printTo(settingsBuf, sizeof(settingsBuf));
      yield();
      webSocket.sendTXT(0, settingsBuf, s);
      yield();
      yield();
    }  else {
      Serial.println("failed to load json config");
    }
    jsonFile.close();
  }
  else {
    Serial.println("failed to load settings file");}
}

//WiFi settings file

const size_t wifiBufferSize = JSON_OBJECT_SIZE(2) + 80;
StaticJsonBuffer<wifiBufferSize> wifiSettingsBuffer;

void loadWiFiSettings() {
  // parse json config file
  File jsonFile = SPIFFS.open(wifiSettingsFile, "r");
  if (jsonFile) {
    jsonSettingsBuffer.clear();
    JsonObject& root = wifiSettingsBuffer.parseObject(jsonFile);
    if (root.success()) {
      strcpy(ssid, root["ssid"]); 
      strcpy(password, root["password"]); 
      root.printTo(Serial);
      yield();
    }  else {
      Serial.println("failed to load WiFi config");
    }
    jsonFile.close();
  }
  else {
    Serial.println("No WiFi settings file");
    }
}

const size_t voltageBufferSize = JSON_OBJECT_SIZE(1);
StaticJsonBuffer<voltageBufferSize> jsonVoltageBuffer;
char voltageBuf[voltageBufferSize];

void sendVoltage(float voltage) {
  jsonVoltageBuffer.clear();
  JsonObject& voltageRoot = jsonVoltageBuffer.createObject();
  voltageRoot["voltage"] = voltage;
  size_t s = voltageRoot.printTo(voltageBuf, sizeof(voltageBuf));
  webSocket.sendTXT(0, voltageBuf, s);
  voltageRoot.printTo(Serial);
  Serial.println("");
}

void saveSettings() {
  jsonSettingsBuffer.clear();
  JsonObject& settingsRoot = jsonSettingsBuffer.createObject();
  settingsRoot["brightness"] = brightness;
  settingsRoot["maxBrightness"] = maxBrightness;
  settingsRoot["blinkRate"] = blinkRate;
  Serial.println("opening file");
  File jsonFile = SPIFFS.open(settingsFile, "w");
  if (jsonFile) {
    yield();
    settingsRoot.printTo(jsonFile);
    yield();
    if (settingsRoot.success()) {
      settingsRoot.printTo(Serial);
    } 
    else {
    Serial.println("failed to save json config");
    }
  jsonFile.close();
  }
  else {
    Serial.println("failed to open settingsFile for writing");
    }
}


void startPreheat() {
  digitalWrite(LAMP, LOW); 
  }  

 void startFlicker() {
    int v = 22 + random(maxBrightness);
    shine(v);
    //Serial.println("Blinking");
    //Serial.println(blinkRate);
    for(int i = 0; i < random(blinkRate); i++){
      delay(10);
      webSocket.loop();
    }
  }

void shine(int brightness) {
          if(brightness < preheatValue) {
          analogWrite(LAMP,  preheatValue);
        } else if(brightness > maxBrightnessLimit) {
          analogWrite(LAMP, dcf*maxBrightnessLimit);
        } else {
          analogWrite(LAMP,  dcf*brightness);
        }
}


WiFiEventHandler stationConnectedHandler;
WiFiEventHandler stationDisconnectedHandler;

void startWiFi() { // Start a Wi-Fi access point, and try to connect to some given access points. Then wait for either an AP or STA connection
  while(!WiFi.softAP(ssid, password, wifiChannel, false, 1)) {             // Start the access point
    Serial.println("Starting AP");
    delay(100);
  }
  stationConnectedHandler = WiFi.onSoftAPModeStationConnected(&onStationConnected);
  stationDisconnectedHandler = WiFi.onSoftAPModeStationDisconnected(&onStationDisconnected);
  Serial.print("Access Point \"");
  Serial.print(ssid);
  Serial.println("\" started");
  Serial.println(WiFi.softAPIP());
}


void onStationConnected(const WiFiEventSoftAPModeStationConnected& evt) {
  Serial.print("Client connected: ");
  Serial.println(macToString(evt.mac));
  //webSocket.sendTXT(0, settingsBuf, s);
  digitalWrite(LED_GREEN, HIGH);
}

void onStationDisconnected(const WiFiEventSoftAPModeStationDisconnected& evt) {
  Serial.print("Client disconnected: ");
   Serial.println(macToString(evt.mac));
  digitalWrite(LED_GREEN, LOW);
  state = "DISC";
}

String macToString(const unsigned char* mac) {
  char buf[20];
  snprintf(buf, sizeof(buf), "%02x:%02x:%02x:%02x:%02x:%02x",
           mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
  return String(buf);
}

String formatBytes(size_t bytes);

void startSPIFFS() { // Start the SPIFFS and list all contents
  SPIFFS.begin();                             // Start the SPI Flash File System (SPIFFS)
  Serial.println("SPIFFS started. Contents:");
  {
    Dir dir = SPIFFS.openDir("/");
    while (dir.next()) {                      // List the file system contents
      String fileName = dir.fileName();
      size_t fileSize = dir.fileSize();
      Serial.printf("\tFS File: %s, size: %s\r\n", fileName.c_str(), formatBytes(fileSize).c_str());
    }
    Serial.printf("\n");
  }
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t lenght);

void startWebSocket() { // Start a WebSocket server
  webSocket.begin();                          // start the websocket server
  webSocket.onEvent(webSocketEvent);          // if there's an incomming websocket message, go to function 'webSocketEvent'
  Serial.println("WebSocket server started.");
}

void startMDNS() { // Start the mDNS responder
  MDNS.begin(ssid);                        // start the multicast domain name server
  Serial.print("mDNS responder started: http://");
  Serial.print(ssid);
  Serial.println(".local");
}

void handleFileUpload();
void handleNotFound();

void startServer() { // Start a HTTP server with a file read handler and an upload handler
  server.on("/edit.html",  HTTP_POST, []() {  // If a POST request is sent to the /edit.html address,
    server.send(200, "text/plain", ""); 
  }, handleFileUpload);                       // go to 'handleFileUpload'

  server.onNotFound(handleNotFound);          // if someone requests any other file or page, go to function 'handleNotFound'
                                              // and check if the file exists

  server.begin();                             // start the HTTP server
  Serial.println("HTTP server started.");
}


bool handleFileRead(String path);

void handleNotFound(){ // if the requested file or page doesn't exist, return a 404 not found error
  if(!handleFileRead(server.uri())){          // check if the file exists in the flash memory (SPIFFS), if so, send it
    server.send(404, "text/plain", "404: File Not Found");
  }
}

String getContentType(String filename);

bool handleFileRead(String path) { // send the right file to the client (if it exists)
  Serial.println("handleFileRead: " + path);
  if (path.endsWith("/")) path += "index.html";          // If a folder is requested, send the index file
  String contentType = getContentType(path);             // Get the MIME type
  String pathWithGz = path + ".gz";
  if (SPIFFS.exists(pathWithGz) || SPIFFS.exists(path)) { // If the file exists, either as a compressed archive, or normal
    if (SPIFFS.exists(pathWithGz))                         // If there's a compressed version available
      path += ".gz";                                         // Use the compressed verion
    File file = SPIFFS.open(path, "r");                    // Open the file
    size_t sent = server.streamFile(file, contentType);    // Send it to the client
    file.close();                                          // Close the file again
    Serial.println(String("\tSent file: ") + path);
    return true;
  }
  Serial.println(String("\tFile Not Found: ") + path);   // If the file doesn't exist, return false
  return false;
}

void handleFileUpload(){ // upload a new file to the SPIFFS
  HTTPUpload& upload = server.upload();
  String path;
  if(upload.status == UPLOAD_FILE_START){
    path = upload.filename;
    if(!path.startsWith("/")) path = "/"+path;
    if(!path.endsWith(".gz")) {                          // The file server always prefers a compressed version of a file 
      String pathWithGz = path+".gz";                    // So if an uploaded file is not compressed, the existing compressed
      if(SPIFFS.exists(pathWithGz))                      // version of that file must be deleted (if it exists)
         SPIFFS.remove(pathWithGz);
    }
    Serial.print("handleFileUpload Name: "); Serial.println(path);
    fsUploadFile = SPIFFS.open(path, "w");            // Open the file for writing in SPIFFS (create if it doesn't exist)
    path = String();
  } else if(upload.status == UPLOAD_FILE_WRITE){
    if(fsUploadFile)
      fsUploadFile.write(upload.buf, upload.currentSize); // Write the received bytes to the file
  } else if(upload.status == UPLOAD_FILE_END){
    if(fsUploadFile) {                                    // If the file was successfully created
      fsUploadFile.close();                               // Close the file again
      Serial.print("handleFileUpload Size: "); Serial.println(upload.totalSize);
      server.sendHeader("Location","/success.html");      // Redirect the client to the success page
      server.send(303);
    } else {
      server.send(500, "text/plain", "500: couldn't create file");
    }
  }
}


void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t lenght) { // When a WebSocket message is received
  switch (type) {
    case WStype_DISCONNECTED:             // if the websocket is disconnected
      Serial.printf("[%u] Disconnected!\n", num);
      break;
    case WStype_CONNECTED: {              // if a new websocket connection is established
        IPAddress ip = webSocket.remoteIP(num);
        Serial.printf("[%u] Connected from %d.%d.%d.%d url: %s\n", num, ip[0], ip[1], ip[2], ip[3], payload);
        //state = "OFF";                  // Turn flicker off when a new connection is established
        loadSettings();
      }
      break;
    case WStype_TEXT:                     // if new text data is received
      Serial.printf("[%u] get Text: %s\n", num, payload);
      if (payload[0] == '#') {            // we get brightness data
        uint32_t val = (uint32_t) strtol((const char *) &payload[1], NULL, 16);   // decode brightness data
        brightness =          val & 0x3FF;                      // B: bits  0-9
        }
        else if (payload[0] == 'H') {
          state = "SHINE";
        }
        else if (payload[0] == 'B') {
          state = "BLINK";
        }
      if (payload[0] == 'L') {
          loadSettings();
        }
        else if (payload[0] == 'S') {
          Serial.print("save settings command received");
          saveSettings();
        }        
        else if (payload[0] == '*') {                      // the browser sends a * when the flicker effect is enabled
        uint32_t val = (uint32_t) strtol((const char *) &payload[1], NULL, 16);   // decode brightness data
        maxBrightness =          val & 0x3FF;                      // B: bits  0-9
      }
        else if (payload[0] == '_') {                      // the browser sends a * when the flicker effect is enabled
        uint32_t val = (uint32_t) strtol((const char *) &payload[1], NULL, 16);   // decode brightness data
        blinkRate =          val & 0x3FF;                      // B: bits  0-9
      }
       else if (payload[0] == 'O') {                      // the browser sends an O when the preheat mode is on
        state = "OFF";
      }
      break;
  }
}

String formatBytes(size_t bytes) { // convert sizes in bytes to KB and MB
  if (bytes < 1024) {
    return String(bytes) + "B";
  } else if (bytes < (1024 * 1024)) {
    return String(bytes / 1024.0) + "KB";
  } else if (bytes < (1024 * 1024 * 1024)) {
    return String(bytes / 1024.0 / 1024.0) + "MB";
  }
}

String getContentType(String filename) { // determine the filetype of a given filename, based on the extension
  if (filename.endsWith(".html")) return "text/html";
  else if (filename.endsWith(".css")) return "text/css";
  else if (filename.endsWith(".js")) return "application/javascript";
  else if (filename.endsWith(".ico")) return "image/x-icon";
  else if (filename.endsWith(".gz")) return "application/x-gzip";
  return "text/plain";
}


