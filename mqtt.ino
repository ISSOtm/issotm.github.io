#include <WiFiEsp.h>
#include <Countdown.h>
#include <IPStack.h>
#include <MQTTClient.h>


// MQTT connection details
char * hostname = (char*)"192.168.1.136";
int port = 2512;
char * username = (char*)"G11";
char * password = (char*)"isimaG11";

// Pin definitions
const int led_D5 = 13;
const int led_D6 = 12;
const int button_S2 = 8; // BTN1
const int button_S3 = 9; // BTN2


// Global vars
WiFiEspClient c;
IPStack ipstack(c);
MQTT::Client<IPStack, Countdown> client = MQTT::Client<IPStack, Countdown>(ipstack);


void WifiConnect() {
  WiFi.init(&Serial1);

  WiFi.begin((char*)"ZZ_HSH","WIFI_ZZ_F5");
}

void BrokerConnect() {
  ipstack.connect(hostname, port);

  MQTTPacket_connectData cfg = MQTTPacket_connectData_initializer;
  cfg.username.cstring = username;
  cfg.password.cstring = password;
  int retcode = client.connect(cfg);
  Serial.print("Broker connection return code: ");
  Serial.println(retcode);
}

void setup() {
  Serial.begin(9600);
  Serial1.begin(9600);

  // Set up IO pins
  pinMode(led_D5, OUTPUT);
  pinMode(led_D6, OUTPUT);
  pinMode(button_S2, INPUT);
  pinMode(button_S3, INPUT);

  digitalWrite(led_D5, LOW);
  digitalWrite(led_D6, LOW);

  while(!Serial || !Serial1);

  WifiConnect();
  BrokerConnect();

  //client.subscribe("/isima/G12/LEDs/LED1", MQTT::QOS0, callback);
  //client.subscribe("/isima/G12/LEDs/LED2", MQTT::QOS0, callback);
}

void publish_button(int pin, char * btn_name, bool & state, bool & was_pressed) {
  char buf[50] = "isima/G12/BPs/";
  strcat(buf, btn_name);

  int btn_status = digitalRead(pin);
  if(btn_status == LOW && !was_pressed) {
    state = !state;
    const char * msg = state ? "ON" : "OFF";
    Serial.print("Sending message ");
    Serial.print(msg);
    Serial.print(" on topic ");
    Serial.println(buf);
    client.publish(buf, (void *)msg, strlen(msg));
  }
  was_pressed = btn_status == LOW;
}

void loop() {
  static bool bp1_state = false;
  static bool bp1_was_pressed = false;
  static bool bp2_state = false;
  static bool bp2_was_pressed = false;
  
  publish_button(button_S2, "BP1", bp1_state, bp1_was_pressed);
  publish_button(button_S3, "BP2", bp2_state, bp2_was_pressed);
  delay(200);
}
