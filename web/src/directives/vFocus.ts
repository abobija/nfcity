import { Directive } from "vue";

const vFocus: Directive<HTMLElement, boolean> = {
  mounted(el: HTMLElement) {
    el.focus();
  },
};

export default vFocus;
