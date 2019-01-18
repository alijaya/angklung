<template>
  <div v-if="parsed" class="notasi">
    <template v-if="type == 'notasi'">
      <div 
        v-if="parsed.sharp == 1" 
        class="sharp">
        /
      </div>
      <div class="note">{{parsed.note}}</div>
      <div 
        v-if="parsed.octave != 0"
        :class="{ 'high': parsed.octave > 0, 'low': parsed.octave < 0 }" 
        class="octave">
        <div 
          v-for="time in Math.abs(parsed.octave)" 
          :key="time"
          class="element"></div>
      </div>
    </template>
    <template v-if="type == 'note'">
      {{note}}
    </template>
    <template v-if="type == 'angklung'">
      {{angklung}}
    </template>
  </div>
</template>

<script>
import {notasi2parsed, parsed2note, parsed2angklung, parsedTranspose} from '@/js/Note'

export default {
  name: 'Notasi',
  props: {
    notasi: {
      type: String,
      default: '',
    },
    transpose: {
      type: Number,
      default: 0,
    },
    base: {
      type: String,
      default: 'C5'
    },
    type: {
      type: String,
      default: 'notasi',
    },
  },
  computed: {
    parsed() {
      if (this.notasi == '') return null
      return parsedTranspose(notasi2parsed(this.notasi), this.transpose)
    },
    note() {
      return parsed2note(this.parsed, this.base)
    },
    angklung() {
      return parsed2angklung(this.parsed, this.base)
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.notasi {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.sharp {
  position: absolute;
  font-size: 2em;
  opacity: 0.3;
}
.octave {
  position: absolute;
  display: flex;
  flex-direction: row;
  left: 50%;
  transform: translate(-50%, -50%);
}
.octave.high {
  top: -0.5em;
}
.octave.low {
  bottom: -0.5em;
}

.octave .element {
  width: 0.2em;
  height: 0.2em;
  background-color: black;
  border-radius: 50%;
  margin: 0.1em;
}
</style>
