// MqttService.ts
import * as Paho from 'paho-mqtt';

type MessageCallback = (payload: any) => void;

interface ConnectOptions {
  clientId: string;
  onSuccess?: () => void;
  onFailure?: (error: any) => void;
}

class MqttService {
  private client: Paho.Client | null = null;
  private isConnected: boolean = false;
  private subscriptions: Map<string, MessageCallback> = new Map();
  private readonly host = '37.60.242.176';
  private readonly port = 8083;

  connect(options: ConnectOptions) {
    if (this.client) {
      console.log('MQTT client already exists');
      return;
    }

    const { clientId, onSuccess, onFailure } = options;
    const url = `ws://${this.host}:${this.port}/mqtt`;

    this.client = new Paho.Client(url, clientId);

    this.client.onConnectionLost = (responseObject: Paho.MQTTError) => {
      this.isConnected = false;
      console.log('MQTT connection lost:', responseObject?.errorMessage);
    };

    this.client.onMessageArrived = (message: Paho.Message) => {
      const topic = message.destinationName;
      const payloadString = message.payloadString;
      const callback = this.subscriptions.get(topic);
      if (callback) {
        try {
          callback(JSON.parse(payloadString));
        } catch (err) {
          console.log('Invalid JSON payload', err, payloadString);
          callback(payloadString); // fallback: send raw string
        }
      }
    };

    this.client.connect({
      onSuccess: () => {
        this.isConnected = true;
        console.log('MQTT connected!');
        onSuccess?.();
      },
      onFailure: (err) => {
        console.log('MQTT connection failed:', err);
        onFailure?.(err);
      },
    });
  }

  subscribe(topic: string, callback: MessageCallback) {
    if (!this.isConnected || !this.client) {
      console.warn('MQTT not connected yet');
      return;
    }

    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, callback);
      this.client.subscribe(topic);
      console.log(`Subscribed to topic: ${topic}`);
    }
  }

  unsubscribe(topic: string) {
    if (this.client && this.subscriptions.has(topic)) {
      this.client.unsubscribe(topic);
      this.subscriptions.delete(topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    }
  }

  publish(topic: string, payload: string | object) {
    if (!this.isConnected || !this.client) {
      console.warn('MQTT not connected yet');
      return;
    }

    const message = new Paho.Message(typeof payload === 'string' ? payload : JSON.stringify(payload));
    message.destinationName = topic;
    this.client.send(message);
  }

  disconnect() {
    if (this.client && this.isConnected) {
      this.client.disconnect();
      this.isConnected = false;
      console.log('MQTT disconnected');
    }
  }
}

// Singleton export
export const mqttService = new MqttService();
