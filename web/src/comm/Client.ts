import { logger, LogLevel } from '@/Logger';
import ClientDisconnectEvent from '@/comm/events/ClientDisconnectEvent';
import clientEmits from '@/comm/events/ClientEmits';
import ClientMessageEvent from '@/comm/events/ClientMessageEvent';
import ClientPingEvent from '@/comm/events/ClientPingEvent';
import ClientPongEvent from '@/comm/events/ClientPongEvent';
import ClientPongMissedEvent from '@/comm/events/ClientPongMissedEvent';
import ClientReadyEvent from '@/comm/events/ClientReadyEvent';
import { DeviceMessage, WebMessage } from '@/comm/msgs/Message';
import ErrorDevMessage from '@/comm/msgs/dev/ErrorDevMessage';
import PongDevMessage from '@/comm/msgs/dev/PongDevMessage';
import PingWebMessage from '@/comm/msgs/web/PingWebMessage';
import { trim, trimRight } from '@/helpers';
import { decode, encode } from 'cbor-x';
import mqtt, { MqttClient, PacketCallback } from 'mqtt';


export class MessageSendTimeoutError extends Error {
  constructor() {
    super("Send message timeout");
  }
}

export class MessageReceiveTimeoutError extends Error {
  constructor() {
    super("Receive message timeout");
  }
}

class Client {
  readonly brokerUrl: string;
  readonly rootTopic: string;
  readonly devTopic: string;
  readonly webTopic: string;
  private mqttClient: MqttClient | null = null;
  readonly pinger: ClientPinger;
  private readonly sendTimeoutMs;
  private readonly receiveTimeoutMs;

  protected constructor(brokerUrl: string, rootTopic: string) {
    this.brokerUrl = trimRight(brokerUrl, '/');
    this.rootTopic = trim(rootTopic, '/');
    this.webTopic = 'web';
    this.devTopic = 'dev';
    this.pinger = ClientPinger.from(this);
    this.sendTimeoutMs = 2000;
    this.receiveTimeoutMs = 3000;
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

  async transceive(message: WebMessage): Promise<DeviceMessage> {
    return this.receive(await this.send(message));
  }

  async send(message: WebMessage): Promise<SendContext> {
    if (!this.connected) {
      throw new Error('not connected');
    }

    return new Promise((resolve, reject) => {
      const topic = `/${this.webTopicAbs}`;
      const encodedMessage = encode(message);

      const _handler: PacketCallback = (err) => {
        clearTimeout(_timeout);

        if (err) {
          reject(err);
          return;
        }

        const logLevel = message instanceof PingWebMessage ? LogLevel.VERBOSE : LogLevel.DEBUG;

        logger.log(logLevel, 'message sent', topic, message);
        logger.verbose('encoded sent message:', encodedMessage);

        resolve(SendContext.from(message));
      };

      const _timeout = setTimeout(() => {
        reject(new MessageSendTimeoutError());
      }, this.sendTimeoutMs);

      this.mqttClient!.publish(topic, encodedMessage, { qos: 0 }, _handler);
    });
  }

  private async receive(ctx: SendContext): Promise<DeviceMessage> {
    if (!this.connected) {
      throw new Error('not connected');
    }

    return new Promise((resolve, reject) => {
      const _handler = (e: ClientMessageEvent) => {
        if (e.message.$ctx?.$id !== ctx.message.$id) {
          return;
        }

        clearTimeout(_timeout);
        clientEmits.off('message', _handler);
        resolve(e.message);
      };

      const _timeout = setTimeout(() => {
        clientEmits.off('message', _handler);
        reject(new MessageReceiveTimeoutError());
      }, this.receiveTimeoutMs);

      clientEmits.on('message', _handler);
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
        clientEmits.emit('ready', ClientReadyEvent.from(this));
      });
    });

    this.mqttClient.on('message', (topic, encodedMessage) => {
      const decodedMessage = decode(encodedMessage) as DeviceMessage;

      let logLevel = LogLevel.DEBUG;

      if (PongDevMessage.is(decodedMessage)) {
        logLevel = LogLevel.VERBOSE;
      } else if (ErrorDevMessage.is(decodedMessage)) {
        logLevel = LogLevel.WARNING;
      }

      logger.log(logLevel, 'message received', topic, decodedMessage);
      logger.verbose('encoded received message:', encodedMessage);

      clientEmits.emit('message', ClientMessageEvent.from(this, decodedMessage));
    });

    this.mqttClient.on('reconnect', () => {
      logger.debug('reconnect');
      this.pinger.stop();
    });

    this.mqttClient.on('close', () => {
      logger.debug('close');
      this.pinger.stop();
      clientEmits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    this.mqttClient.on('disconnect', () => {
      logger.debug('disconnected');
      this.pinger.stop();
      clientEmits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    this.mqttClient.on('offline', () => {
      logger.debug('offline');
      this.pinger.stop();
      clientEmits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    this.mqttClient.on('end', () => {
      logger.debug('end');
      this.pinger.stop();
      clientEmits.emit('disconnect', ClientDisconnectEvent.from(this));
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

class SendContext {
  readonly message: WebMessage;

  protected constructor(message: WebMessage) {
    this.message = message;
  }

  static from(message: WebMessage): SendContext {
    return new SendContext(message);
  }
}

interface ClientPingerStartProps {
  repeat: boolean;
  interval: number;
}

class ClientPinger {
  private readonly client: Client;
  private timeout?: NodeJS.Timeout;
  private lastPing?: number;
  private lastPong?: number;

  protected constructor(client: Client) {
    this.client = client;
  }

  static from(client: Client): ClientPinger {
    return new ClientPinger(client);
  }

  async ping(props: ClientPingerStartProps): Promise<PongDevMessage | undefined> {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    this.lastPing = Date.now();
    clientEmits.emit('ping', ClientPingEvent.from(this.client, this.lastPing));

    let result: PongDevMessage | undefined = undefined;

    try {
      const pong = await this.client.transceive(PingWebMessage.create());

      if (PongDevMessage.is(pong)) {
        result = pong;

        logger.verbose('pong');
        this.lastPong = Date.now();
        clientEmits.emit('pong', ClientPongEvent.from(this.client, this.lastPing, this.lastPong));
      } else {
        throw new Error('invalid type of pong message');
      }
    } catch (e) {
      logger.debug('pong miss,', 'reason', e);
      clientEmits.emit('pongMissed', ClientPongMissedEvent.from(this.client, this.lastPing, this.lastPong));
    }

    if (props.repeat) {
      this.timeout = setTimeout(() => this.ping(props), props.interval);
    }

    return result;
  }

  stop(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = undefined;
    this.lastPing = undefined;
    this.lastPong = undefined;
  }
}

export default Client;
