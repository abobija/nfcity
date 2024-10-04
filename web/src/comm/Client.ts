import { logger, LogLevel } from '@/Logger';
import { DeviceMessage, WebMessage } from '@/comm/msgs/Message';
import { trim, trimRight } from '@/helpers';
import { decode, encode } from 'cbor-x';
import mqtt, { MqttClient } from 'mqtt';
import PongDevMessage from './msgs/dev/PongDevMessage';
import PingWebMessage from './msgs/web/PingWebMessage';

type Events =
  'ready' |
  'message' |
  'disconnect';

class Client {
  readonly brokerUrl: string;
  readonly rootTopic: string;
  private readonly devTopic: string;
  private readonly webTopic: string;
  private readonly eventListeners: {
    ready: Array<() => void>,
    message: Array<(message: DeviceMessage) => void>,
    pong: Array<(ts: number) => void>,
    disconnect: Array<() => void>,
  } = {
      ready: [],
      message: [],
      pong: [],
      disconnect: []
    };
  private mqttClient: MqttClient | null = null;
  private pingIntervalMs: number;
  private pingInterval?: NodeJS.Timeout;
  private lastPingTimestamp?: number;
  private lastPongTimestamp?: number;

  protected constructor(brokerUrl: string, rootTopic: string) {
    this.brokerUrl = trimRight(brokerUrl, '/');
    this.rootTopic = `/${trim(rootTopic, '/')}`;
    this.webTopic = '/web';
    this.devTopic = '/dev';
    this.pingIntervalMs = 5000;
  }

  static from(brokerUrl: string, rootTopic: string): Client {
    return new Client(brokerUrl, rootTopic);
  }

  get connected(): boolean {
    return this.mqttClient?.connected === true;
  }

  get devTopicAbs(): string {
    return this.rootTopic + this.devTopic;
  }

  get webTopicAbs(): string {
    return this.rootTopic + this.webTopic;
  }

  send(message: WebMessage): void {
    if (!this.connected) {
      throw new Error('not connected');
    }

    const encodedMessage = encode(message);

    this.mqttClient!.publish(this.webTopicAbs, encodedMessage, { qos: 0 }, err => {
      if (err) {
        logger.error('publish error', err);
        return;
      }

      const logLevel = message instanceof PingWebMessage ? LogLevel.VERBOSE : LogLevel.DEBUG;

      logger.log(logLevel, 'message sent', this.webTopicAbs, message);
      logger.verbose('encoded sent message:', encodedMessage);
    });
  }

  private pingingStart(): void {
    if (this.pingInterval) {
      logger.warning('pingingStart skipped: already started');
      return;
    }

    this.pingInterval = setInterval(() => {
      const pingHasBeenSent = this.lastPingTimestamp !== undefined;
      const pongHasBeenReceived = this.lastPongTimestamp !== undefined;
      const pongIsOutdated = pongHasBeenReceived && (Date.now() - this.lastPongTimestamp!) > this.pingIntervalMs;

      if (pingHasBeenSent && (!pongHasBeenReceived || pongIsOutdated)) {
        logger.warning('warning: no pong received in', this.pingIntervalMs, 'ms');
        this.disconnect();
        return;
      }

      this.send(PingWebMessage.create());
      this.lastPingTimestamp = Date.now();
    }, this.pingIntervalMs);

    logger.debug('pinging started');
  }

  private pingingStop(): void {
    if (!this.pingInterval) {
      logger.warning('pingingStop skipped: already stopped');
      return;
    }

    clearInterval(this.pingInterval);
    this.pingInterval = undefined;
    this.lastPingTimestamp = undefined;
    this.lastPongTimestamp = undefined;

    logger.debug('pinging stopped');
  }

  on(event: Events, listener: (...args: any[]) => void): Client {
    this.eventListeners[event].push(listener);

    return this;
  }

  off(event: Events, listener: (...args: any[]) => void): Client {
    const index = this.eventListeners[event].indexOf(listener);

    if (index !== -1) {
      this.eventListeners[event].splice(index, 1);
    }

    return this;
  }

  connect(): Client {
    if (this.connected) {
      logger.warning('connect skipped: already connected');
      return this;
    }

    this.mqttClient = mqtt.connect(this.brokerUrl);

    this.mqttClient.on('error', error => {
      logger.error('error', error);
    });

    this.mqttClient.on('connect', () => {
      logger.debug('connected');

      this.mqttClient!.subscribe(this.devTopicAbs, { qos: 0 }, err => {
        if (err) {
          logger.error('subscribe error', err);
          return;
        }

        logger.debug('subscribed to', this.devTopicAbs);
        this.pingingStart();
        this.eventListeners.ready.forEach(listener => listener());
      });
    });

    this.mqttClient.on('message', (topic, encodedMessage) => {
      const decodedMessage = decode(encodedMessage) as DeviceMessage;

      if (PongDevMessage.is(decodedMessage)) {
        logger.verbose('pong message received');

        const ts = Date.now();
        this.lastPongTimestamp = ts;
        this.eventListeners.pong.forEach(listener => listener(ts));
        return;
      }

      logger.debug('message received', topic, decodedMessage);
      logger.verbose('encoded received message:', encodedMessage);

      this.eventListeners.message.forEach(listener => listener(decodedMessage));
    });

    this.mqttClient.on('reconnect', () => {
      logger.debug('reconnect');
      this.pingingStop();
    });

    this.mqttClient.on('close', () => {
      logger.debug('close');
      this.pingingStop();
      this.eventListeners.disconnect.forEach(listener => listener());
    });

    this.mqttClient.on('disconnect', () => {
      logger.debug('disconnected');
      this.pingingStop();
      this.eventListeners.disconnect.forEach(listener => listener());
    });

    this.mqttClient.on('offline', () => {
      logger.debug('offline');
      this.pingingStop();
      this.eventListeners.disconnect.forEach(listener => listener());
    });

    this.mqttClient.on('end', () => {
      logger.debug('end');
      this.pingingStop();
      this.eventListeners.disconnect.forEach(listener => listener());
    });

    return this;
  }

  disconnect(): void {
    if (this.mqttClient?.connected !== true) {
      throw new Error('not connected');
    }

    this.pingingStop();
    this.mqttClient.end(true);
  }
}

export default Client;
