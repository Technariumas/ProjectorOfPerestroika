#define LED_RED D3
#define LED_GREEN D4
#define LAMP D0

void setup() {
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LAMP, OUTPUT);

}

void loop() {
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_GREEN, LOW);
  delay(500);

  for(int i = 0; i < 1023; i++){
    analogWrite(LAMP, i);
    delay(3);
  }
  delay(5000);
  for(int i = 1024; i >=0; i--){
    analogWrite(LAMP, i);
    delay(3);
  }

  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, HIGH);
  delay(3000);
}
