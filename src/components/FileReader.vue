<template>
  <label class="file-reader">
    <input type="file" @change="load">
  </label>
</template>

<script>
export default {
  methods: {
    load(ev) {
      const file = ev.target.files[0]
      const reader = new FileReader()

      reader.onload = e => this.$emit("load", e.target.result)
      reader.readAsBinaryString(file)
    }
  }
};
</script>