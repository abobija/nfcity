export default class ClientPingEvent {
  readonly timestamp: number;

  protected constructor(timestamp: number) {
    this.timestamp = timestamp;
  }

  static from(timestamp: number) {
    return new ClientPingEvent(timestamp);
  }
}
