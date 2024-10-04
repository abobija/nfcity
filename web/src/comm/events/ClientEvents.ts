
import mitt from 'mitt';
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

export default emits;
