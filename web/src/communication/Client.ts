import mqtt, { MqttClient } from 'mqtt';
import { decode, encode } from 'cbor-x';
import { DeviceMessage, WebMessage } from './messages/Message';
import PiccBlockReadMessage, { piccBlockReadKind } from './messages/PiccBlockReadMessage';

type Events = 'connect' | 'deviceMessage' | 'reconnect' | 'close' | 'disconnect' | 'offline' | 'end';

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
                console.error('publish error', err);
                return;
            }

            console.debug('published', topic, message);
            //console.debug('encoded:', encodedMessage);
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
            console.debug('error', error);
        });

        this.mqttClient.on('connect', () => {
            console.debug('connected');

            const topic = this.rootTopic + this.devTopic;

            this.mqttClient!.subscribe(topic, { qos: 0 }, err => {
                if (err) {
                    console.error('subscribe error', err);
                    return;
                }

                console.debug('subscribed', topic);
            });
        });

        this.mqttClient.on('reconnect', () => {
            console.debug('reconnect');
        });

        this.mqttClient.on('close', () => {
            console.debug('close');
        });

        this.mqttClient.on('disconnect', () => {
            console.debug('disconnected');
        });

        this.mqttClient.on('offline', () => {
            console.debug('offline');
        });

        this.mqttClient.on('end', () => {
            console.debug('end');
        });

        this.mqttClient.on('message', (topic, encodedMessage) => {
            const decodedMessage = decode(encodedMessage);

            console.debug('message', topic, decodedMessage);
            //console.debug('encoded:', encodedMessage);

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
        console.debug('readBlock', message);

        this.send(message);
    }
}

export default Client;
