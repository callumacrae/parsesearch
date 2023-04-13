<template>
  <SomeComponent
    v-model="hello"
    :class="someClass"
    @input="onInput"
  >
    <p>some stuff</p>
    <p>we don't</p>
    <span>care about</span>
  </SomeComponent>
</template>
