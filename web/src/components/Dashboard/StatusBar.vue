<script setup lang="ts">

</script>

<template>
  <section class="StatusBar">
    <div class="left">
      <slot name="left"></slot>
    </div>
    <div class="right">
      <slot name="right"></slot>
    </div>
  </section>
</template>

<style lang="scss">
@use 'sass:color';
@import '@/theme.scss';

.StatusBar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  background-color: color.adjust($color-bg, $lightness: +2%);
  border-top: 1px solid color.adjust($color-bg, $lightness: +10%);
  padding: .2rem .5rem;
  font-size: .6rem;
  box-shadow: 0 -0.1rem .3rem color.adjust($color-bg, $lightness: -3%);
  color: color.adjust($color-fg, $lightness: -25%);

  $margin-between-items: .8rem;
  $margin-inside-item: .5rem;

  .left,
  .right {
    display: flex;
    flex-wrap: wrap;

    >* {
      display: flex;


      &:not(:last-child) {
        margin-right: $margin-between-items;
      }

      &:not(:first-child) {
        border-left: 1px solid color.adjust($color-bg, $lightness: +20%);
        padding-left: $margin-between-items;
      }

      >* {
        display: flex;

        &:not(:last-child) {
          margin-right: $margin-inside-item;
        }
      }

      >.name {
        font-weight: 600;
      }

      >ul>li {
        &:not(:last-child) {
          margin-right: $margin-inside-item;
        }
      }
    }
  }
}
</style>
