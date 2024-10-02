import { inject, onMounted, onUnmounted } from "vue";
import Client from "../comm/Client";
import { DeviceMessage } from "../comm/msgs/Message";

export default function onDeviceMessage(hook: (message: DeviceMessage, client: Client) => void) {
  const client = inject('client') as Client;
  const listener = (message: DeviceMessage) => hook(message, client);

  onMounted(() => client.on('message', listener));
  onUnmounted(() => client.off('message', listener));
};
