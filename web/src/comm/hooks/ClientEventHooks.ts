import emits from "@/comm/events/ClientEvents";
import { onMounted, onUnmounted } from "vue";
import ClientDisconnectEvent from "../events/ClientDisconnectEvent";
import ClientMessageEvent from "../events/ClientMessageEvent";
import ClientPingEvent from "../events/ClientPingEvent";
import ClientPongEvent from "../events/ClientPongEvent";
import ClientReadyEvent from "../events/ClientReadyEvent";

export function onClientReady(hook: (e: ClientReadyEvent) => void) {
  onMounted(() => emits.on('ready', hook));
  onUnmounted(() => emits.off('ready', hook));
}

export function onClientMessage(hook: (e: ClientMessageEvent) => void) {
  onMounted(() => emits.on('message', hook));
  onUnmounted(() => emits.off('message', hook));
}

export function onClientPing(hook: (e: ClientPingEvent) => void) {
  onMounted(() => emits.on('ping', hook));
  onUnmounted(() => emits.off('ping', hook));
}

export function onClientPong(hook: (e: ClientPongEvent) => void) {
  onMounted(() => emits.on('pong', hook));
  onUnmounted(() => emits.off('pong', hook));
}

export function onClientDisconnect(hook: (e: ClientDisconnectEvent) => void) {
  onMounted(() => emits.on('disconnect', hook));
  onUnmounted(() => emits.off('disconnect', hook));
}
