import Client from "@/communication/Client";

export abstract class ClientEvent {
  constructor(readonly client: Client) { }
}
