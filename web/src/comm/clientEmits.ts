import ClientCloseEvent from "@/comm/events/ClientCloseEvent";
import ClientDisconnectEvent from "@/comm/events/ClientDisconnectEvent";
import ClientEndEvent from "@/comm/events/ClientEndEvent";
import ClientMessageEvent from "@/comm/events/ClientMessageEvent";
import ClientOfflineEvent from "@/comm/events/ClientOfflineEvent";
import ClientPingEvent from "@/comm/events/ClientPingEvent";
import ClientPongEvent from "@/comm/events/ClientPongEvent";
import ClientPongMissedEvent from "@/comm/events/ClientPongMissedEvent";
import ClientReadyEvent from "@/comm/events/ClientReadyEvent";
import ClientReconnectEvent from "@/comm/events/ClientReconnectEvent";
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
