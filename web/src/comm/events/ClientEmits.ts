import ClientDisconnectEvent from '@/comm/events/ClientDisconnectEvent';
import ClientMessageEvent from '@/comm/events/ClientMessageEvent';
import ClientPingEvent from '@/comm/events/ClientPingEvent';
import ClientPongEvent from '@/comm/events/ClientPongEvent';
import ClientPongMissedEvent from '@/comm/events/ClientPongMissedEvent';
import ClientReadyEvent from '@/comm/events/ClientReadyEvent';
import mitt from 'mitt';

const clientEmits = mitt<{
  'ready': ClientReadyEvent;
  'message': ClientMessageEvent;
  'ping': ClientPingEvent;
  'pong': ClientPongEvent;
  'pongMissed': ClientPongMissedEvent;
  'disconnect': ClientDisconnectEvent;
}>();

export default clientEmits;
