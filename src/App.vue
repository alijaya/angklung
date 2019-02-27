<template>
  <div id="app">
    <Display />
  </div>
</template>

<script>
import Display from './components/Display.vue'

export default {
  name: 'app',
  components: {
    Display
  },
}
</script>

<style>
html, body, #app {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}
</style>
