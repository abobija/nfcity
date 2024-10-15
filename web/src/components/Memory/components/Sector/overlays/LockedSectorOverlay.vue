<template>
  <section class="LockedSectorOverlay txt-unselectable">
    <p>This sector has not been loaded</p>
    <p>Click to unlock</p>
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.LockedSectorOverlay {
  cursor: pointer;
  color: color.adjust($color-fg, $blackness: +50%, $alpha: -0.8);
  transition: color .3s ease-in-out;

  &:hover {
    color: color.adjust($color-fg, $blackness: +50%);
  }
}
</style>
