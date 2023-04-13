<template>
  <div>
    <SomeComponent
      v-model="hello"
      @input="onInput"
    >
    </SomeComponent>
    <SomeComponent v-model="nah" />
    <p>waste</p>
    <p>waste</p>
    <p>waste</p>
    <some-component @input="sure" v-model="test" />
  </div>
</template>
