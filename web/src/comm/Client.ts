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
  readonly devTopic: string;
  readonly webTopic: string;
  private mqttClient: MqttClient | null = null;
  private readonly pinger: ClientPinger;

  protected constructor(brokerUrl: string, rootTopic: string) {
    this.brokerUrl = trimRight(brokerUrl, '/');
    this.rootTopic = trim(rootTopic, '/');
    this.webTopic = 'web';
    this.devTopic = 'dev';
    this.pinger = ClientPinger.from(this);
  }

  static from(brokerUrl: string, rootTopic: string): Client {
    return new Client(brokerUrl, rootTopic);
  }

  get connected(): boolean {
    return this.mqttClient?.connected === true;
  }

  get devTopicAbs(): string {
    return `${this.rootTopic}/${this.devTopic}`;
  }

  get webTopicAbs(): string {
    return `${this.rootTopic}/${this.webTopic}`;
  }

  send(message: WebMessage): void {
    if (!this.connected) {
      throw new Error('not connected');
    }

    const topic = `/${this.webTopicAbs}`;
    const encodedMessage = encode(message);

    this.mqttClient!.publish(topic, encodedMessage, { qos: 0 }, err => {
      if (err) {
        logger.error('publish error', err);
        return;
      }

      const logLevel = message instanceof PingWebMessage ? LogLevel.VERBOSE : LogLevel.DEBUG;

      logger.log(logLevel, 'message sent', topic, message);
      logger.verbose('encoded sent message:', encodedMessage);
    });
  }

  connect(): Client {
    if (this.connected) {
      logger.debug('connect skipped: already connected');
      return this;
    }

    this.mqttClient = mqtt.connect(this.brokerUrl);

    this.mqttClient.on('error', error => {
      logger.error('error', error);
    });

    this.mqttClient.on('connect', () => {
      logger.debug('connected');
      const topic = `/${this.devTopicAbs}`;

      this.mqttClient!.subscribe(topic, { qos: 0 }, err => {
        if (err) {
          logger.error('subscribe error', err);
          return;
        }

        logger.debug('subscribed to', topic);
        this.pinger.ping({
          repeat: true,
          interval: 5000,
        });
        emits.emit('ready', ClientReadyEvent.from(this));
      });
    });

    this.mqttClient.on('message', (topic, encodedMessage) => {
      const decodedMessage = decode(encodedMessage) as DeviceMessage;

      if (PongDevMessage.is(decodedMessage)) {
        this.pinger.pong();
        return;
      }

      logger.debug('message received', topic, decodedMessage);
      logger.verbose('encoded received message:', encodedMessage);

      emits.emit('message', ClientMessageEvent.from(this, decodedMessage));
    });

    this.mqttClient.on('reconnect', () => {
      logger.debug('reconnect');
      this.pinger.stop();
    });

    this.mqttClient.on('close', () => {
      logger.debug('close');
      this.pinger.stop();
      emits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    this.mqttClient.on('disconnect', () => {
      logger.debug('disconnected');
      this.pinger.stop();
      emits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    this.mqttClient.on('offline', () => {
      logger.debug('offline');
      this.pinger.stop();
      emits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    this.mqttClient.on('end', () => {
      logger.debug('end');
      this.pinger.stop();
      emits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    return this;
  }

  disconnect(): void {
    if (this.mqttClient?.connected !== true) {
      throw new Error('not connected');
    }

    this.pinger.stop();
    this.mqttClient.end(true);
  }
}

interface ClientPingerStartProps {
  repeat: boolean;
  interval: number;
}

class ClientPinger {
  readonly client: Client;
  private timeout?: NodeJS.Timeout;
  private lastPing?: number;
  private lastPong?: number;

  protected constructor(client: Client) {
    this.client = client;
  }

  static from(client: Client): ClientPinger {
    return new ClientPinger(client);
  }

  private get pingHasBeenSent(): boolean {
    return this.lastPing !== undefined;
  }

  private get isPongReceived(): boolean {
    return this.lastPong !== undefined;
  }

  private pongIsMissing(interval: number): boolean {
    return this.pingHasBeenSent
      && this.isPongReceived
      && ((Date.now() - this.lastPong!) > interval);
  }

  ping(props: ClientPingerStartProps): void {
    if (this.pongIsMissing(props.interval)) {
      this.pongMiss();
    }

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    this.lastPing = Date.now();
    this.client.send(PingWebMessage.create());
    logger.verbose('ping');

    emits.emit('ping', ClientPingEvent.from(this.client, this.lastPing));

    if (props.repeat) {
      this.timeout = setTimeout(() => this.ping(props), props.interval);
    }
  }

  pong(): void {
    logger.verbose('pong');

    this.lastPong = Date.now();

    emits.emit('pong', ClientPongEvent.from(
      this.client,
      this.lastPing!,
      this.lastPong
    ));
  }

  private pongMiss(): void {
    logger.debug('pong miss');

    emits.emit('pongMissed', ClientPongMissedEvent.from(
      this.client,
      this.lastPing!,
      this.lastPong
    ));
  }

  stop(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = undefined;
    this.lastPing = undefined;
    this.lastPong = undefined;

    logger.debug('ping stopped');
  }
}

export default Client;
