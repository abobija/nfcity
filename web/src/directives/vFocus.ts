import { Directive } from "vue";

const vFocus: Directive<HTMLElement, boolean> = {
  mounted(el: HTMLElement, binding) {
    if (typeof binding.value === 'undefined' || binding.value === true) {
      el.focus();
    }
  },
};

export default vFocus;
