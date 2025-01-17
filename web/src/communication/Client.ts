import clientEmits from "@/communication/clientEmits";
import ClientCloseEvent from "@/communication/events/ClientCloseEvent";
import ClientDisconnectEvent from "@/communication/events/ClientDisconnectEvent";
import ClientEndEvent from "@/communication/events/ClientEndEvent";
import ClientMessageEvent from "@/communication/events/ClientMessageEvent";
import ClientOfflineEvent from "@/communication/events/ClientOfflineEvent";
import ClientPingEvent from "@/communication/events/ClientPingEvent";
import ClientPongEvent from "@/communication/events/ClientPongEvent";
import ClientPongMissedEvent from "@/communication/events/ClientPongMissedEvent";
import ClientReadyEvent from "@/communication/events/ClientReadyEvent";
import ClientReconnectEvent from "@/communication/events/ClientReconnectEvent";
import { DeviceMessage, WebMessage } from "@/communication/Message";
import PongDeviceMessage, { isPongDeviceMessage } from "@/communication/messages/device/PongDeviceMessage";
import PingWebMessage from "@/communication/messages/web/PingWebMessage";
import { CancelationToken, OperationCanceledError } from "@/utils/CancelationToken";
import { randomHex, strmask, trim } from "@/utils/helpers";
import logger, { LogLevel } from "@/utils/Logger";
import { decode, encode } from "cbor-x";
import mqtt, { MqttClient, PacketCallback } from "mqtt";

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
  constructor(readonly message: WebMessage) { }
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

  constructor(brokerUrl: string, rootTopic: string) {
    ClientValidator.validateBrokerUrl(brokerUrl);
    ClientValidator.validateRootTopic(rootTopic);

    this.brokerUrl = new URL(brokerUrl);
    this.rootTopic = trim(rootTopic, '/');
    this.webTopic = 'web';
    this.devTopic = 'dev';
    this.sendTimeoutMs = 2000;
    this.receiveTimeoutMs = 3000;
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

        resolve(new SendContext(message));
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

    this.mqttClient = mqtt.connect(this.brokerUrl.toString(), {
      clientId: `nfcity_${randomHex(4)}`,
    });

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
        clientEmits.emit('ready', new ClientReadyEvent(this));
      });
    });

    this.mqttClient.on('message', (topic, encodedMessage) => {
      const decodedMessage = decode(encodedMessage) as DeviceMessage;

      let logLevel = LogLevel.DEBUG;

      if (isPongDeviceMessage(decodedMessage)) {
        logLevel = LogLevel.VERBOSE;
      }

      this.logger.log(logLevel, 'message received', topic, decodedMessage);
      this.logger.verbose('encoded received message:', encodedMessage);

      clientEmits.emit('message', new ClientMessageEvent(this, decodedMessage));
    });

    this.mqttClient.on('reconnect', () => {
      this.logger.debug('reconnect');
      clientEmits.emit('reconnect', new ClientReconnectEvent(this));
    });

    this.mqttClient.on('close', () => {
      this.logger.debug('close');
      clientEmits.emit('close', new ClientCloseEvent(this));
    });

    this.mqttClient.on('disconnect', () => {
      this.logger.debug('disconnected');
      clientEmits.emit('disconnect', new ClientDisconnectEvent(this));
    });

    this.mqttClient.on('offline', () => {
      this.logger.debug('offline');
      clientEmits.emit('offline', new ClientOfflineEvent(this));
    });

    this.mqttClient.on('end', () => {
      this.logger.debug('end');
      clientEmits.emit('end', new ClientEndEvent(this));
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

    const context = new ClientPingContext(Date.now());

    clientEmits.emit('ping', new ClientPingEvent(this, context.pingTimestamp));
    cancelationToken?.throwIfCanceled();

    try {
      const pong = await this.transceive(new PingWebMessage(), cancelationToken);
      cancelationToken?.throwIfCanceled();

      if (isPongDeviceMessage(pong)) {
        this.logger.verbose('pong');
        context.pong = pong;
        clientEmits.emit('pong', new ClientPongEvent(
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

        clientEmits.emit('pongMissed', new ClientPongMissedEvent(
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

    const pingLoop = async () => {
      try {
        await this.ping(cancelationToken);
        errorCounter = 0;
      }
      catch (e) {
        if (e instanceof OperationCanceledError) {
          if (_interval) {
            clearInterval(_interval);
          }
          this.logger.debug("ping loop canceled,", 'ctoken', cancelationToken?.id);
          return;
        }

        this.logger.debug('failed to ping in loop,', 'ctoken', cancelationToken?.id, 'err', e);

        if (++errorCounter >= maxErrorCounter) {
          cancelationToken?.cancel(`failed to ping in loop for ${maxErrorCounter} times`);
        }
      }
    };

    await pingLoop();
    const _interval = setInterval(pingLoop, intervalMs);

    this.logger.debug('ping loop started,', 'ctoken', cancelationToken?.id);
  }
}

export class ClientPingContext {
  pingTimestamp: number;
  private _pong?: PongDeviceMessage;
  private _pongTimestamp?: number;

  get pong(): PongDeviceMessage | undefined {
    return this._pong;
  }

  set pong(message: PongDeviceMessage) {
    this._pong = message;
    this._pongTimestamp = Date.now();
  }

  public get pongTimestamp(): number | undefined {
    return this._pongTimestamp;
  }

  constructor(pingTimestamp: number) {
    this.pingTimestamp = pingTimestamp;
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
