import { inject, onMounted, onUnmounted } from "vue";
import Client from "../communication/Client";
import { DeviceMessage } from "../communication/messages/Message";

export default function onDeviceMessage(hook: (message: DeviceMessage, client: Client) => void) {
  const client = inject('client') as Client;

  const listener = (message: DeviceMessage) => hook(message, client);

  onMounted(() => client.on('message', listener));
  onUnmounted(() => client.off('message', listener));
};
