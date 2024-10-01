import { decode, encode } from 'cbor-x';
import mqtt, { MqttClient } from 'mqtt';
import { logger } from '../Logger';
import { DeviceMessage, WebMessage } from './messages/Message';
import GetPiccMessage, { getPiccMessageKind } from './messages/web/GetPiccMessage';
import ReadBlockMessage, { readBlockMessageKind } from './messages/web/ReadBlockMessage';

type Events =
  'ready' |
  'message' |
  'disconnect';

class Client {
  private _broker?: string;
  private _rootTopic?: string;
  private devTopic: string = 'dev';
  private webTopic: string = 'web';
  private mqttClient: MqttClient | null = null;
  private eventListeners: {
    ready: Array<() => void>,
    message: Array<(message: DeviceMessage) => void>,
    disconnect: Array<() => void>
  } = {
      ready: [],
      message: [],
      disconnect: []
    };

  get broker(): string | undefined {
    return this._broker;
  }

  set broker(value: string) {
    this._broker = value;
  }

  get rootTopic(): string | undefined {
    return this._rootTopic;
  }

  set rootTopic(value: string) {
    this._rootTopic = value;
  }

  private send(message: WebMessage): void {
    if (this.mqttClient == null) {
      throw new Error('not connected');
    }

    const topic = this.rootTopic + this.webTopic;
    const encodedMessage = encode(message);

    this.mqttClient.publish(topic, encodedMessage, { qos: 0 }, err => {
      if (err) {
        logger.error('publish error', err);
        return;
      }

      logger.debug('message sent', topic, message);
      logger.verbose('encoded sent message:', encodedMessage);
    });
  }

  on(event: Events, listener: (...args: any[]) => void): Client {
    if (this.mqttClient == null) {
      throw new Error('not connected');
    }

    this.eventListeners[event].push(listener);

    return this;
  }

  off(event: Events, listener: (...args: any[]) => void): Client {
    if (this.mqttClient == null) {
      throw new Error('not connected');
    }

    const index = this.eventListeners[event].indexOf(listener);

    if (index !== -1) {
      this.eventListeners[event].splice(index, 1);
    }

    return this;
  }

  connect(): Client {
    if (this.mqttClient != null) {
      throw new Error('already connected');
    }

    if (this._broker == undefined) {
      throw new Error('broker is not set');
    }

    if (this._rootTopic == undefined) {
      throw new Error('rootTopic is not set');
    }

    this.mqttClient = mqtt.connect(this._broker);

    this.mqttClient.on('error', error => {
      logger.error('error', error);
    });

    this.mqttClient.on('connect', () => {
      logger.debug('connected');

      const topic = this.rootTopic + this.devTopic;

      this.mqttClient!.subscribe(topic, { qos: 0 }, err => {
        if (err) {
          logger.error('subscribe error', err);
          return;
        }

        logger.debug('subscribed', topic);
        this.eventListeners.ready.forEach(listener => listener());
      });
    });

    this.mqttClient.on('reconnect', () => {
      logger.debug('reconnect');
    });

    this.mqttClient.on('close', () => {
      logger.debug('close');
      this.eventListeners.disconnect.forEach(listener => listener());
    });

    this.mqttClient.on('disconnect', () => {
      logger.debug('disconnected');
      this.eventListeners.disconnect.forEach(listener => listener());
    });

    this.mqttClient.on('offline', () => {
      logger.debug('offline');
      this.eventListeners.disconnect.forEach(listener => listener());
    });

    this.mqttClient.on('end', () => {
      logger.debug('end');
      this.eventListeners.disconnect.forEach(listener => listener());
    });

    this.mqttClient.on('message', (topic, encodedMessage) => {
      const decodedMessage = decode(encodedMessage);

      logger.debug('message received', topic, decodedMessage);
      logger.verbose('encoded received message:', encodedMessage);

      this.eventListeners.message.forEach(listener => listener(decodedMessage));
    });

    return this;
  }

  disconnect(): Client {
    if (this.mqttClient == null) {
      throw new Error('not connected');
    }

    this.mqttClient.end(true);
    this.mqttClient = null;

    return this;
  }

  getPicc(message?: GetPiccMessage): void {
    message ||= {};
    message.kind = getPiccMessageKind;
    this.send(message);
  }

  readBlock(message: ReadBlockMessage): void {
    message.kind = readBlockMessageKind;
    this.send(message);
  }
}

export default Client;
