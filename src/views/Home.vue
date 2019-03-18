<template>
  <div class="home">
    <Display />
  </div>
</template>

<script>
import Display from '@/components/Display'

export default {
  name: 'home',
  components: {
    Display
  },
}
</script>

<style scoped>
.home {
  width: 100%;
  height: 100%;
}
</style>