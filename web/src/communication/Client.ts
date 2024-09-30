import { decode, encode } from 'cbor-x';
import mqtt, { MqttClient } from 'mqtt';
import { logger } from '../Logger';
import { DeviceMessage, WebMessage } from './messages/Message';
import PiccBlockReadMessage, { piccBlockReadKind } from './messages/PiccBlockReadMessage';

type Events =
  'connect' |
  'deviceMessage' |
  'reconnect' |
  'close' |
  'disconnect' |
  'offline' |
  'end';

class Client {
  private _broker?: string;
  private _rootTopic?: string;
  private devTopic: string = 'dev';
  private webTopic: string = 'web';
  private mqttClient: MqttClient | null = null;
  private deviceMessageListeners: Array<(message: DeviceMessage) => void> = [];

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

      logger.debug('published', topic, message);
      logger.verbose('encoded:', encodedMessage);
    });
  }

  on(event: Events, listener: (...args: any[]) => void): Client {
    if (this.mqttClient == null) {
      throw new Error('not connected');
    }

    if (event === 'deviceMessage') {
      this.deviceMessageListeners.push(listener);
    } else {
      this.mqttClient.on(event, listener);
    }

    return this;
  }

  off(event: Events, listener: (...args: any[]) => void): Client {
    if (this.mqttClient == null) {
      throw new Error('not connected');
    }

    if (event === 'deviceMessage') {
      const index = this.deviceMessageListeners.indexOf(listener);

      if (index !== -1) {
        this.deviceMessageListeners.splice(index, 1);
      }

      return this;
    }

    this.mqttClient.off(event, listener);

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
      logger.debug('error', error);
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
      });
    });

    this.mqttClient.on('reconnect', () => {
      logger.debug('reconnect');
    });

    this.mqttClient.on('close', () => {
      logger.debug('close');
    });

    this.mqttClient.on('disconnect', () => {
      logger.debug('disconnected');
    });

    this.mqttClient.on('offline', () => {
      logger.debug('offline');
    });

    this.mqttClient.on('end', () => {
      logger.debug('end');
    });

    this.mqttClient.on('message', (topic, encodedMessage) => {
      const decodedMessage = decode(encodedMessage);

      logger.debug('message', topic, decodedMessage);
      logger.verbose('encoded:', encodedMessage);

      this.deviceMessageListeners.forEach(listener => listener(decodedMessage));
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

  readBlock(message: PiccBlockReadMessage): void {
    message.kind = piccBlockReadKind;
    logger.debug('readBlock', message);

    this.send(message);
  }
}

export default Client;
