<template>
  <div class="display">
    <el-upload
      drag
      action="#"
      :before-upload="beforeUpload">
      <i class="el-icon-upload" />
      <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
    </el-upload>
    <h1>{{title}}</h1>
    <p>Base: <span>{{baseTransposed}}</span></p>
    <p>Transpose: <el-input-number v-model="transpose" /></p>
    <p>Type: 
      <el-select v-model="type">
        <el-option
          v-for="(item, index) in typeOption"
          :key="index"
          :value="item">
        </el-option>
      </el-select>
    </p>
    <p>BPM: <el-input-number v-model="bpm" :min="0" @change="bpmChanged"/></p>
    <p>
      <el-button v-if="!isPlay" type="primary" @click="play">Play</el-button>
      <el-button v-if="isPlay" type="danger" @click="pause">Pause</el-button>
      <el-button @click="reset">Reset</el-button>
    </p>
    <div class="partitur">
      <div v-for="(row, i) in table" :key="i" class="row">
        <div 
          v-for="(cell, j) in row" 
          :key="j"
          :class="{ current: i * 32 + j == currentBeat}"
          @mousedown="playheadMouseMove($event, i * 32 + j)"
          @mousemove="playheadMouseMove($event, i * 32 + j)"
          class="cell">
          <div class="cell-melody">
            <Notasi 
              :notasi="cell['Melody']" 
              :type="type" 
              :base="base" 
              :transpose="transpose" />
            <Notasi 
              v-for="(item, index) in cell['Chord']"
              :key="index"
              :notasi="item" 
              :type="type" 
              :base="base" 
              :transpose="transpose" />
          </div>
          <div class="cell-lyrics">
            {{cell['Lyrics']}}
          </div>
          <div 
            v-if="i * 32 + j == currentBeat" 
            :style="{ left: `${currentFraction*100}%`}"
            class="playhead"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Notasi from './Notasi'
import {noteTranspose} from '@/js/Note'
import data2object from '@/js/data2object'

export default {
  name: 'Display',
  components: {
    Notasi,
  },
  data() {
    return {
      typeOption: ['notasi', 'angklung', 'note'],
      type: 'notasi',
      fps: 200,
      title: 'Untitled',
      base: 'C5',
      second: 0,
      transpose: 0,
      bpm: 60,
      fileList: [],
      table: [],
      startBeatFraction: 0.0,
      currentBeatFraction: 0.0,
      isPlay: false,
    }
  },
  props: {
    
  },
  computed: {
    baseTransposed() {
      return noteTranspose(this.base, this.transpose)
    },
    currentBeat() {
      return Math.floor(this.currentBeatFraction)
    },
    currentFraction() {
      return this.currentBeatFraction - this.currentBeat
    }
  },
  methods: {
    play() {
      if (!this.isPlay) {
        this.timer = window.requestAnimationFrame(this.update.bind(this))
        this.setStart()
        this.isPlay = true
      }
    },
    pause() {
      if (this.isPlay) {
        window.cancelAnimationFrame(this.timer)
        this.timer = null
        this.setStart()
        this.isPlay = false
      }
    },
    update(timestamp) {
      if (!this.startTime) this.startTime = timestamp
      var elapsedTime = timestamp - this.startTime // in ms
      var bpms = this.bpm / 60 / 1000 * 2
      this.currentBeatFraction = elapsedTime * bpms + this.startBeatFraction
      this.timer = window.requestAnimationFrame(this.update.bind(this))
    },
    reset() {
      this.currentBeatFraction = 0
      this.setStart()
      this.pause()
    },
    bpmChanged() {
      this.setStart()
    },
    setStart() {
      this.startTime = null
      this.startBeatFraction = this.currentBeatFraction
    },
    playheadMouseMove(ev, beat) {
      if (ev.buttons == 1) {
        var rect = ev.currentTarget.getBoundingClientRect()
        var x = ev.clientX - rect.left - ev.currentTarget.clientLeft
        var y = ev.clientY - rect.top - ev.currentTarget.clientTop
        var fraction = x / ev.currentTarget.clientWidth
        this.currentBeatFraction = beat + fraction
        this.setStart()
      }
    },
    beforeUpload(file) {
      const reader = new FileReader()

      reader.onload = this.onLoad.bind(this)
      reader.readAsBinaryString(file)
      return false
    },
    onLoad(event) {
      const data = event.target.result
      var obj = data2object(data)
      console.log(obj)
      this.title = obj.title
      this.base = obj.base
      this.bpm = obj.bpm
      this.transpose = 0
      this.table = []
      for (var i=0; i<obj.channels['Melody'].length; i++) {
        this.table.push([])
        for (var j=0; j<obj.channels['Melody'][i].length; j++) {
          var cell = {}
          for (var k=0; k<obj.channelNames.length; k++) {
            var channelName = obj.channelNames[k]
            cell[channelName] = obj.channels[channelName][i][j]
          }
          this.table[i].push(cell)
        }
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.partitur {
  display: flex;
  flex-flow: column nowrap;
  user-select: none;
}

.partitur .row {
  display: flex;
}

.partitur .cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 0 0 auto;
  width: 2.5em;
  background-color: white;
  border-right: 1px rgb(200, 200, 200) solid;
  border-bottom: 1px rgb(200, 200, 200) solid;
}

.partitur .cell:first-of-type {
  border-left: 1px rgb(200, 200, 200) solid;
}

.partitur .row:first-of-type .cell {
  border-top: 1px #c8c8c8 solid;
}

.partitur .cell:nth-of-type(4n - 3),
.partitur .cell:nth-of-type(4n - 2) {
  background-color: rgb(230, 230, 230);
}

.partitur .cell:nth-of-type(8n) {
  border-right-width: 5px;
}

.partitur .cell > * {
  z-index: 1;
}

.partitur .cell-melody {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3em;
}

.partitur .cell-lyrics {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1em;
  white-space: nowrap;
}

.partitur .cell.current {
  background-color: rgb(255, 183, 183);
}

.partitur .notasi {
  margin-left: 0.2em;
  margin-right: 0.2em;
}

.partitur .playhead {
  position: absolute;
  width: 1px;
  height: 100%;
  background-color: red;
  top: 0;
}
</style>
