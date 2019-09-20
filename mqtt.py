#-------------------------------------------------------------------------------
# Name:        module1
# Purpose:
#
# Author:      elhabert
#
# Created:     13/09/2019
# Copyright:   (c) elhabert 2019
# Licence:     <your licence>
#-------------------------------------------------------------------------------

import paho.mqtt.client as mqtt
from time import sleep


# Connection details

hostname = "172.16.32.8"
port = 1883
username = "G11"
password = "isimaG11"


# On CONNACK reception
def on_connect(client, userdata, flags, rc):
    print(f"Connection established with code {rc}")

# On message reception
def on_message(client, userdata, msg):
    print(f"<{msg.topic}> {msg.payload}")

# On subscription response
def on_subscribe(client, userdata, mid, qos):
    print(f"Broker accepted subscription {mid} with QoS {qos}")

# On message publishing response
def on_publish(client, userdata, mid):
    print(f"Message {mid} published")

# On connection loss (whether intentional or not!)
def on_disconnect(client, userdata, rc):
    print(f"Disconnected with status {rc}")


def subscribe_to(client, topic, qos):
    print(f"Subscribed to {topic} with QoS {qos}, got ID {client.subscribe(topic, qos)}")

def publish(client, topic, payload=None, qos=0, retain=False):
    print(f"Published to {topic} with QoS {qos}, got response {client.publish(topic, payload, qos, retain).rc}")


def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_subscribe = on_subscribe
    client.on_publish = on_publish
    #client.username_pw_set(username, password)

    client.connect(hostname, port)
    subscribe_to(client, "isima/G12/BPs/BP1", 0)
    subscribe_to(client, "isima/G12/BPs/BP2", 0)
    subscribe_to(client, "isima/G12/LEDs/LED1", 0)
    subscribe_to(client, "isima/G12/LEDs/LED2", 0)
    client.loop_forever()
    # NOT REACHED


if __name__ == '__main__':
    main()
