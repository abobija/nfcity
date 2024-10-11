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
import mitt from "mitt";

const clientEmits = mitt<{
  'ready': ClientReadyEvent;
  'message': ClientMessageEvent;
  'ping': ClientPingEvent;
  'pong': ClientPongEvent;
  'pongMissed': ClientPongMissedEvent;
  'disconnect': ClientDisconnectEvent;
  'reconnect': ClientReconnectEvent;
  'close': ClientCloseEvent;
  'offline': ClientOfflineEvent;
  'end': ClientEndEvent;
}>();

export default clientEmits;
