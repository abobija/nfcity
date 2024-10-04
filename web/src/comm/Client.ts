import { logger, LogLevel } from '@/Logger';
import emits from '@/comm/events/ClientEvents';
import { DeviceMessage, WebMessage } from '@/comm/msgs/Message';
import { trim, trimRight } from '@/helpers';
import { decode, encode } from 'cbor-x';
import mqtt, { MqttClient } from 'mqtt';
import ClientDisconnectEvent from './events/ClientDisconnectEvent';
import ClientMessageEvent from './events/ClientMessageEvent';
import ClientPingEvent from './events/ClientPingEvent';
import ClientPongEvent from './events/ClientPongEvent';
import ClientPongMissedEvent from './events/ClientPongMissedEvent';
import ClientReadyEvent from './events/ClientReadyEvent';
import PongDevMessage from './msgs/dev/PongDevMessage';
import PingWebMessage from './msgs/web/PingWebMessage';

class Client {
  readonly brokerUrl: string;
  readonly rootTopic: string;
  private readonly devTopic: string;
  private readonly webTopic: string;
  private mqttClient: MqttClient | null = null;
  readonly pingIntervalMs: number;
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
      const timeSinceLastPongMs = pongHasBeenReceived ? (Date.now() - this.lastPongTimestamp!) : undefined;
      const pongIsOutdated = timeSinceLastPongMs && timeSinceLastPongMs > this.pingIntervalMs;

      if (pingHasBeenSent && (!pongHasBeenReceived || pongIsOutdated)) {
        logger.warning('no pong received in', timeSinceLastPongMs, 'ms');
        emits.emit('pongMissed', ClientPongMissedEvent.from(
          this,
          this.lastPingTimestamp!,
          this.lastPongTimestamp
        ));
      }

      this.lastPingTimestamp = Date.now();
      this.send(PingWebMessage.create());
      emits.emit('ping', ClientPingEvent.from(this, this.lastPingTimestamp));
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
        emits.emit('ready', ClientReadyEvent.from(this));
      });
    });

    this.mqttClient.on('message', (topic, encodedMessage) => {
      const decodedMessage = decode(encodedMessage) as DeviceMessage;

      if (PongDevMessage.is(decodedMessage)) {
        logger.verbose('pong message received');

        this.lastPongTimestamp = Date.now();
        emits.emit('pong', ClientPongEvent.from(
          this,
          this.lastPingTimestamp!,
          this.lastPongTimestamp
        ));
        return;
      }

      logger.debug('message received', topic, decodedMessage);
      logger.verbose('encoded received message:', encodedMessage);

      emits.emit('message', ClientMessageEvent.from(this, decodedMessage));
    });

    this.mqttClient.on('reconnect', () => {
      logger.debug('reconnect');
      this.pingingStop();
    });

    this.mqttClient.on('close', () => {
      logger.debug('close');
      this.pingingStop();
      emits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    this.mqttClient.on('disconnect', () => {
      logger.debug('disconnected');
      this.pingingStop();
      emits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    this.mqttClient.on('offline', () => {
      logger.debug('offline');
      this.pingingStop();
      emits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    this.mqttClient.on('end', () => {
      logger.debug('end');
      this.pingingStop();
      emits.emit('disconnect', ClientDisconnectEvent.from(this));
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
