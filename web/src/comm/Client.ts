import ClientCloseEvent from '@/comm/events/ClientCloseEvent';
import ClientDisconnectEvent from '@/comm/events/ClientDisconnectEvent';
import clientEmits from '@/comm/events/ClientEmits';
import ClientEndEvent from '@/comm/events/ClientEndEvent';
import ClientMessageEvent from '@/comm/events/ClientMessageEvent';
import ClientOfflineEvent from '@/comm/events/ClientOfflineEvent';
import ClientPingEvent from '@/comm/events/ClientPingEvent';
import ClientPongEvent from '@/comm/events/ClientPongEvent';
import ClientPongMissedEvent from '@/comm/events/ClientPongMissedEvent';
import ClientReadyEvent from '@/comm/events/ClientReadyEvent';
import ClientReconnectEvent from '@/comm/events/ClientReconnectEvent';
import { DeviceMessage, WebMessage } from '@/comm/msgs/Message';
import ErrorDevMessage from '@/comm/msgs/dev/ErrorDevMessage';
import PongDevMessage from '@/comm/msgs/dev/PongDevMessage';
import PingWebMessage from '@/comm/msgs/web/PingWebMessage';
import { CancelationToken, OperationCanceledError } from '@/utils/CancelationToken';
import logger, { LogLevel } from '@/utils/Logger';
import { strmask, trim } from '@/utils/helpers';
import { decode, encode } from 'cbor-x';
import mqtt, { MqttClient, PacketCallback } from 'mqtt';

export abstract class MessageTimeoutError extends Error { }

export class MessageSendTimeoutError extends MessageTimeoutError {
  constructor() {
    super("Message send timeout");
  }
}

export class MessageReceiveTimeoutError extends MessageTimeoutError {
  constructor() {
    super("Message receive timeout");
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

class Client {
  private readonly logger = logger('Client');
  static readonly DefaultBrokerUrl = "wss://broker.emqx.io:8084/mqtt";
  readonly brokerUrl: URL;
  readonly rootTopic: string;
  readonly devTopic: string;
  readonly webTopic: string;
  private mqttClient: MqttClient | null = null;
  private readonly sendTimeoutMs;
  private readonly receiveTimeoutMs;

  get rootTopicMasked(): string {
    return strmask(this.rootTopic, { side: 'right', offset: 2, ratio: .65 });
  }

  protected constructor(brokerUrl: string, rootTopic: string) {
    ClientValidator.validateBrokerUrl(brokerUrl);
    ClientValidator.validateRootTopic(rootTopic);

    this.brokerUrl = new URL(brokerUrl);
    this.rootTopic = trim(rootTopic, '/');
    this.webTopic = 'web';
    this.devTopic = 'dev';
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

  async transceive(message: WebMessage, cancelationToken?: CancelationToken): Promise<DeviceMessage> {
    const ctx = await this.send(message, cancelationToken);
    return this.receive(ctx, cancelationToken);
  }

  async send(message: WebMessage, cancelationToken?: CancelationToken): Promise<SendContext> {
    if (!this.connected) {
      throw new Error('not connected');
    }

    return new Promise((resolve, reject) => {
      const topic = `/${this.webTopicAbs}`;
      const encodedMessage = encode(message);

      const _timeout = setTimeout(() => {
        reject(new MessageSendTimeoutError());
      }, this.sendTimeoutMs);

      const _onCanceled = () => {
        if (_timeout) {
          clearTimeout(_timeout);
        }
        reject(new OperationCanceledError());
      }

      cancelationToken?.onCancel(_onCanceled);

      const _onMessagePublished: PacketCallback = (err) => {
        cancelationToken?.offCancel(_onCanceled);
        if (_timeout) {
          clearTimeout(_timeout);
        }

        if (err) {
          reject(err);
          return;
        }

        const logLevel = message instanceof PingWebMessage ? LogLevel.VERBOSE : LogLevel.DEBUG;

        this.logger.log(logLevel, 'message sent', topic, message);
        this.logger.verbose('encoded sent message:', encodedMessage);

        resolve(SendContext.from(message));
      };

      this.mqttClient!.publish(topic, encodedMessage, { qos: 0 }, _onMessagePublished);
    });
  }

  private async receive(ctx: SendContext, cancelationToken?: CancelationToken): Promise<DeviceMessage> {
    if (!this.connected) {
      throw new Error('not connected');
    }

    return new Promise((resolve, reject) => {
      const _onCanceled = () => {
        if (_timeout) {
          clearTimeout(_timeout);
        }
        reject(new OperationCanceledError());
      }

      cancelationToken?.onCancel(_onCanceled);

      const _onMessageReceived = (e: ClientMessageEvent) => {
        if (e.message.$ctx?.$id !== ctx.message.$id) {
          return;
        }

        cancelationToken?.offCancel(_onCanceled);
        if (_timeout) {
          clearTimeout(_timeout);
        }
        clientEmits.off('message', _onMessageReceived);
        resolve(e.message);
      };

      const _timeout = setTimeout(() => {
        clientEmits.off('message', _onMessageReceived);
        reject(new MessageReceiveTimeoutError());
      }, this.receiveTimeoutMs);

      clientEmits.on('message', _onMessageReceived);
    });
  }

  connect(): Client {
    if (this.connected) {
      this.logger.debug('connect skipped: already connected');
      return this;
    }

    this.mqttClient = mqtt.connect(this.brokerUrl.toString());

    this.mqttClient.on('error', error => {
      this.logger.warning('error', error);
    });

    this.mqttClient.on('connect', () => {
      this.logger.debug('connected');
      const topic = `/${this.devTopicAbs}`;

      this.mqttClient!.subscribe(topic, { qos: 0 }, err => {
        if (err) {
          this.logger.warning('subscribe error', err);
          return;
        }

        this.logger.debug('subscribed to', topic);
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

      this.logger.log(logLevel, 'message received', topic, decodedMessage);
      this.logger.verbose('encoded received message:', encodedMessage);

      clientEmits.emit('message', ClientMessageEvent.from(this, decodedMessage));
    });

    this.mqttClient.on('reconnect', () => {
      this.logger.debug('reconnect');
      clientEmits.emit('reconnect', ClientReconnectEvent.from(this));
    });

    this.mqttClient.on('close', () => {
      this.logger.debug('close');
      clientEmits.emit('close', ClientCloseEvent.from(this));
    });

    this.mqttClient.on('disconnect', () => {
      this.logger.debug('disconnected');
      clientEmits.emit('disconnect', ClientDisconnectEvent.from(this));
    });

    this.mqttClient.on('offline', () => {
      this.logger.debug('offline');
      clientEmits.emit('offline', ClientOfflineEvent.from(this));
    });

    this.mqttClient.on('end', () => {
      this.logger.debug('end');
      clientEmits.emit('end', ClientEndEvent.from(this));
    });

    return this;
  }

  disconnect(): void {
    if (this.mqttClient?.connected !== true) {
      throw new Error('not connected');
    }

    this.mqttClient.end(true);
  }

  async ping(cancelationToken?: CancelationToken): Promise<ClientPingContext> {
    this.logger.verbose('ping');

    const context = ClientPingContext.create(Date.now());

    clientEmits.emit('ping', ClientPingEvent.from(this, context.pingTimestamp));
    cancelationToken?.throwIfCanceled();

    try {
      const pong = await this.transceive(PingWebMessage.create(), cancelationToken);
      cancelationToken?.throwIfCanceled();

      if (PongDevMessage.is(pong)) {
        this.logger.verbose('pong');
        context.pong = pong;
        clientEmits.emit('pong', ClientPongEvent.from(
          this, context.pingTimestamp, context.pongTimestamp!
        ));
        cancelationToken?.throwIfCanceled();
      } else {
        throw new Error('invalid type of pong message');
      }
    } catch (e) {
      cancelationToken?.throwIfCanceled();

      if (e instanceof MessageTimeoutError) {
        this.logger.verbose('pong miss,', 'reason', e);

        clientEmits.emit('pongMissed', ClientPongMissedEvent.from(
          this,
          context.pingTimestamp,
          context.pongTimestamp
        ));
      }

      throw e;
    }

    return context;
  }

  async pingLoop(intervalMs: number, cancelationToken?: CancelationToken): Promise<void> {
    const maxErrorCounter = 3;
    let errorCounter = 0;

    const _ping = async () => {
      try {
        await this.ping(cancelationToken);
        errorCounter = 0;
      }
      catch (e) {
        if (e instanceof OperationCanceledError) {
          if (_interval) {
            clearTimeout(_interval);
          }
          this.logger.debug("Ping loop canceled, reason:", cancelationToken?.reason);
          return;
        }

        this.logger.debug('Failed to ping in loop', e);

        if (++errorCounter >= maxErrorCounter) {
          cancelationToken?.cancel(`Failed to ping in loop for ${maxErrorCounter} times`);
        }
      }
    };

    await _ping();
    const _interval = setInterval(_ping, intervalMs);

    this.logger.debug('Ping loop started');
  }
}

export class ClientPingContext {
  pingTimestamp: number;
  private _pong?: PongDevMessage;
  private _pongTimestamp?: number;

  get pong(): PongDevMessage | undefined {
    return this._pong;
  }

  set pong(message: PongDevMessage) {
    this._pong = message;
    this._pongTimestamp = Date.now();
  }

  public get pongTimestamp(): number | undefined {
    return this._pongTimestamp;
  }

  protected constructor(pingTimestamp: number) {
    this.pingTimestamp = pingTimestamp;
  }

  static create(pingTimestamp: number): ClientPingContext {
    return new ClientPingContext(pingTimestamp);
  }
}

export abstract class ClientValidator {
  static readonly RootTopicLength = 16;

  static validateBrokerUrl(brokerUrl?: string): void {
    if (!brokerUrl) {
      throw new Error('Broker URL is required');
    }

    if (!brokerUrl.startsWith('wss://')) {
      throw new Error('Broker URL must use wss://');
    }

    new URL(brokerUrl);
  }

  static validateRootTopic(rootTopic?: string): void {
    if (!rootTopic) {
      throw new Error('Root Topic is required');
    }

    if (rootTopic.length != ClientValidator.RootTopicLength) {
      throw new Error(`Root Topic must be ${ClientValidator.RootTopicLength} characters long`);
    }

    if (!rootTopic.match(/^[0-9a-fA-F]+$/)) {
      throw new Error('Root Topic must contain only hexadecimal characters');
    }
  }
}

export default Client;
