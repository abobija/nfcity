import { Directive } from "vue";

const vFocus: Directive<HTMLElement, boolean> = {
  mounted(el: HTMLElement, binding) {
    if (binding.value === true) {
      el.focus();
    }
  },
};

export default vFocus;
