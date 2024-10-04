
import mitt from 'mitt';
import { onMounted, onUnmounted } from 'vue';
import ClientDisconnectEvent from './ClientDisconnectEvent';
import ClientMessageEvent from './ClientMessageEvent';
import ClientPingEvent from './ClientPingEvent';
import ClientPongEvent from './ClientPongEvent';
import ClientReadyEvent from './ClientReadyEvent';

const emits = mitt<{
  'ready': ClientReadyEvent;
  'message': ClientMessageEvent;
  'ping': ClientPingEvent;
  'pong': ClientPongEvent;
  'disconnect': ClientDisconnectEvent;
}>();

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

export default emits;
