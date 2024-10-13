<template>
  <div class="SectorOverlay SectorEmptyOverlay">
    <p>This sector has not been loaded</p>
    <p>Click to unlock</p>
  </div>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.SectorEmptyOverlay {
  cursor: pointer;
  color: color.adjust($color-fg, $blackness: +50%, $alpha: -0.8);
  transition: color .3s ease-in-out;

  &:hover {
    color: color.adjust($color-fg, $blackness: +50%);
  }
}
</style>
