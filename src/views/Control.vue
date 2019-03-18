<template>
  <div class="control">
    <Display controls/>
  </div>
</template>

<script>
import Display from '@/components/Display'

export default {
  name: 'control',
  components: {
    Display
  },
}
</script>

<style scoped>
.control {
  width: 100%;
  height: 100%;
}
</style>