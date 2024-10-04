export default class ClientPongEvent {
  readonly timestamp: number;

  protected constructor(timestamp: number) {
    this.timestamp = timestamp;
  }

  static from(timestamp: number) {
    return new ClientPongEvent(timestamp);
  }
}
