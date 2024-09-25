import './style.scss';
import Alpine from 'alpinejs';

window.Alpine = Alpine;
Alpine.start();

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div x-data="{ open: false }">
    <button @click="open = ! open">Expand</button>
 
    <span x-show="open" x-transition>
        Content...
    </span>
  </div>
`;
