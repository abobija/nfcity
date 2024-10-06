import clientEmits from "@/comm/events/ClientEmits";
import { onMounted, onUnmounted } from "vue";
import ClientDisconnectEvent from "../events/ClientDisconnectEvent";
import ClientMessageEvent from "../events/ClientMessageEvent";
import ClientPingEvent from "../events/ClientPingEvent";
import ClientPongEvent from "../events/ClientPongEvent";
import ClientPongMissedEvent from "../events/ClientPongMissedEvent";
import ClientReadyEvent from "../events/ClientReadyEvent";

export function onClientReady(hook: (e: ClientReadyEvent) => void) {
  onMounted(() => clientEmits.on('ready', hook));
  onUnmounted(() => clientEmits.off('ready', hook));
}

export function onClientMessage(hook: (e: ClientMessageEvent) => void) {
  onMounted(() => clientEmits.on('message', hook));
  onUnmounted(() => clientEmits.off('message', hook));
}

export function onClientPing(hook: (e: ClientPingEvent) => void) {
  onMounted(() => clientEmits.on('ping', hook));
  onUnmounted(() => clientEmits.off('ping', hook));
}

export function onClientPong(hook: (e: ClientPongEvent) => void) {
  onMounted(() => clientEmits.on('pong', hook));
  onUnmounted(() => clientEmits.off('pong', hook));
}

export function onClientPongMissed(hook: (e: ClientPongMissedEvent) => void) {
  onMounted(() => clientEmits.on('pongMissed', hook));
  onUnmounted(() => clientEmits.off('pongMissed', hook));
}

export function onClientDisconnect(hook: (e: ClientDisconnectEvent) => void) {
  onMounted(() => clientEmits.on('disconnect', hook));
  onUnmounted(() => clientEmits.off('disconnect', hook));
}
