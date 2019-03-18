<template>
  <div class="display">
    <el-dialog
      title="Frequency Table"
      :visible.sync="frequencyVisible">
      <table class="freq-table">
        <tr 
          v-for="(item, index) in freq"
          :key="index">
          <td>
            <Notasi 
              :notasi="item.notasi" 
              :type="type" 
              :base="base" 
              :transpose="transpose" />
          </td>
          <td>{{item.freq}}</td>
          <td>
            <el-switch v-model="highlight[getAngklung(item.notasi)]" />
          </td>
        </tr>
      </table>
      <div slot="footer">
        <el-button type="primary" @click="frequencyVisible = false">Close</el-button>
      </div>
    </el-dialog>
    <div ref="main" class="main">
      <div>
        <h1>{{title}}</h1>
        <p>Base: {{baseTransposed}}</p>
      </div>
      <div 
        ref="partitur"
        class="partitur"
        @mousedown="playheadMouseMove"
        @mousemove="playheadMouseMove">
        <div v-for="(row, i) in table" :key="i" class="row">
          <div 
            v-for="(cell, j) in row" 
            :key="j"
            class="cell">
            <div class="cell-melody">
              <Notasi 
                v-for="(item, index) in cell['Melody']"
                :key="index"
                :notasi="item" 
                :type="type" 
                :base="base" 
                :transpose="transpose"
                :class="{'highlight': highlight[getAngklung(item)]}" />
              <Notasi 
                v-for="(item, index) in cell['Chord']"
                :key="cell['Melody'].length + index"
                :notasi="item" 
                :type="type" 
                :base="base" 
                :transpose="transpose"
                :class="{'highlight': highlight[getAngklung(item)]}" />
            </div>
            <div class="cell-lyrics">
              {{cell['Lyrics']}}
            </div>
          </div>
        </div>

        <div 
          ref="activeCell"
          class="active-cell">
        </div>
        <div 
          ref="playhead"
          class="playhead">
        </div>
      </div>
    </div>
    <div class="information">
      <div ref="progress" class="progress">
        <div ref="progressBar" class="progress-bar"></div>
      </div>
      <el-form class="controls" :inline="true">
        <el-form-item>
          <el-upload
            action="#"
            :before-upload="beforeUpload">
            <el-button icon="el-icon-upload">Open</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-tooltip content="See Frequency Table" placement="top">
            <el-button type="text" @click="frequencyVisible = true">Frequency</el-button>
          </el-tooltip>
          <el-tooltip content="Reset BPM and Transpose" placement="top">
            <el-button icon="el-icon-refresh" circle @click="resetSettings"></el-button>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="Transpose">
          <el-input-number class="input" v-model="transpose" controls-position="right" @change="changeTranspose"/>
        </el-form-item>
        <el-form-item label="BPM">
          <el-input-number class="input" v-model="bpm" controls-position="right" @change="changeBPM"/>
        </el-form-item>
        <el-form-item label="Type">
          <el-select class="input" v-model="type" @change="changeType">
            <el-option
              v-for="(item, index) in typeOption"
              :key="index"
              :value="item">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-tooltip content="Shortcut: Space" placement="top">
            <el-button :type="isPlay? 'danger' : 'primary'" @click="toggle">{{isPlay? 'Pause' : 'Play'}}</el-button>
          </el-tooltip>
          <el-tooltip content="Shortcut: Esc" placement="top">
            <el-button @click="reset">Reset</el-button>
          </el-tooltip>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import Notasi from '@/components/Notasi'
import {angklungTranspose, noteTranspose, notasi2angklung} from '@/js/Note'
import data2object from '@/js/data2object'
import _ from 'lodash'

const timingsrcURL = 'https://webtiming.github.io/timingsrc/lib/timingsrc-min-v2.js'
const mcorpURL = 'https://www.mcorp.no/lib/mcorp-2.0.js'

const MCORP_APPID = '2089995353868620333'
const MCORP_MOTION_NAME = 'main'

export default {
  name: 'Display',
  components: {
    Notasi,
  },
  data() {
    return {
      typeOption: ['notasi', 'angklung', 'note'],
      type: 'angklung',
      title: 'Untitled',
      base: 'C5',
      second: 0,
      transpose: 0,
      initTranspose: 0,
      bpm: 60,
      initBPM: 60,
      numRow: 0,
      numCol: 0,
      numChannel: 0,
      freq: [],
      highlight: [],
      freqDict: {},
      fileList: [],
      table: [],
      isPlay: false,
      to: null,
      toBPM: null,
      beatLength: 0,
      frequencyVisible: false,
    }
  },
  props: {
    
  },
  computed: {
    baseTransposed() {
      return noteTranspose(this.base, this.transpose)
    },
    halfbps() {
      return this.bpm / 60 * 2
    },
    halfInitBPS() {
      return this.initBPM / 60 * 2
    },
  },
  watch: {
    bpm() {
      if (this.isPlay) this.play()
    },
    highlight() {
      localStorage.setItem('highlight', JSON.stringify(this.highlight))
    }
  },
  created() {
    // persistent highlight
    // https://vuejs.org/v2/cookbook/client-side-storage.html
    if (localStorage.getItem('highlight')) {
      try {
        this.highlight = JSON.parse(localStorage.getItem('highlight'))
      } catch(e) {
        localStorage.removeItem('highlight')
      }
    }

    this.changeVector = _.throttle((vector) => {
      if (this.toBPM) this.toBPM.update(vector)
    }, 300)

    Promise.all([
      this.$loadScript(timingsrcURL),
      this.$loadScript(mcorpURL)
    ])
    .then(() => {
      /*global TIMINGSRC*/
      /*global MCorp*/
      const app = MCorp.app(MCORP_APPID, {anon: true})
      app.run = () => {
        const timingProvider = app.motions[MCORP_MOTION_NAME]
        this.to = new TIMINGSRC.TimingObject({provider: timingProvider})
        this.createTOBPM()
        this.to.on('change', () => {
          this.isPlay = this.to.vel != 0
        })
        this.update()
      }
    })

    // add spacebar listener
    window.addEventListener('keydown', e => {
      if (e.key == ' ' && e.target == document.body) {
        // stop space to scroll page
        e.preventDefault()
      }
    })
    window.addEventListener('keyup', e => {
      if (e.key == ' ') {
        this.toggle()
      }
      if (e.key == 'Escape') {
        this.reset()
      }
      e.preventDefault()
    })

    this.$db.collection('global').doc('settings')
    .onSnapshot((doc) => {
      const data = doc.data()
      this.bpm = data.bpm
      this.transpose = data.transpose
      this.type = data.type
    })

    this.$db.collection('global').doc('global')
    .onSnapshot((doc) => {
      this.loadData(doc.data().data)
    })
  },
  destroyed() {
    cancelAnimationFrame(this.timer)
  },
  methods: {
    toggle() {
      if (this.isPlay) {
        this.pause()
      } else {
        this.play()
      }
    },
    play() {
      this.changeVector({velocity: this.halfbps, acceleration: 0})
    },
    pause() {
      this.changeVector({velocity: 0, acceleration: 0})
    },
    reset() {
      this.changeVector({position: 0, velocity: 0, acceleration: 0})
    },
    update() {
      // if (this._lastStamp) {
      //   console.log(1000 / (stamp - this._lastStamp))
      // }
      // this._lastStamp = stamp;
      if (this.toBPM) {
        const currentBeatFraction = this.toBPM.pos

        const currentBeat = Math.floor(currentBeatFraction)
        const currentFraction = currentBeatFraction - currentBeat
        
        const finish = currentBeatFraction / this.beatLength
        const finishPercentage = isNaN(finish)? 0 : finish < 0? 0 : finish > 1? 1 : finish
        
        const hide = isNaN(finish) || finish < 0 || finish >= 1

        const partitur = this.$refs.partitur
        const activeCell = this.$refs.activeCell
        const playhead = this.$refs.playhead
        const progressBar = this.$refs.progressBar

        const currentCol = currentBeat % this.numCol
        const currentRow = Math.floor(currentBeat / this.numCol)
        const cellWidth = partitur.offsetWidth / this.numCol
        const cellHeight = partitur.offsetHeight / this.numRow

        activeCell.style.display = hide? 'none' : 'block'
        activeCell.style.width = `${cellWidth}px`
        activeCell.style.height = `${cellHeight}px`
        activeCell.style.transform = `translate(${currentCol * cellWidth}px, ${currentRow * cellHeight}px)`
        
        const offset = currentCol + currentFraction
        playhead.style.display = hide? 'none' : 'block'
        playhead.style.height = `${cellHeight}px`
        playhead.style.transform = `translate(${offset * cellWidth}px, ${currentRow * cellHeight}px)`
      
        progressBar.style.width = `${100 * finishPercentage}%`

        if (this.isPlay) {
          const el = this.$refs.main
          el.scrollTop = (el.scrollHeight - el.clientHeight) * finishPercentage
        }
      }
      this.timer = requestAnimationFrame(this.update)
    },
    changeTranspose(transpose) {
      this.$db.collection('global').doc('settings').set({
        transpose: transpose,
      }, { merge: true })
    },
    changeBPM(bpm) {
      this.$db.collection('global').doc('settings').set({
        bpm: bpm,
      }, { merge: true })
    },
    changeType(type) {
      this.$db.collection('global').doc('settings').set({
        type: type,
      }, { merge: true })
    },
    resetSettings() {
      this.$db.collection('global').doc('settings').set({
        transpose: this.initTranspose,
        bpm: this.initBPM,
      }, { merge: true })
    },
    playheadMouseMove(ev) {
      if (ev.buttons == 1) {
        const bb = ev.currentTarget.getBoundingClientRect()
        const x = ev.clientX - bb.left
        const y = ev.clientY - bb.top
        const row = Math.floor(this.numRow * y / bb.height) * this.numCol
        const col = this.numCol * x / bb.width
        this.changeVector({position: row + col})
      }
    },
    beforeUpload(file) {
      // to deselect
      document.activeElement.blur()
      const reader = new FileReader()

      reader.onload = this.onLoad.bind(this)
      reader.readAsBinaryString(file)
      return false
    },
    onLoad(event) {
      const data = event.target.result
      this.isResetSettings = true
      this.$db.collection('global').doc('global').set({
        data: data,
      }, { merge: true })
    },
    createTOBPM() {
      this.toBPM = new TIMINGSRC.ScaleConverter(this.to, this.halfInitBPS)
    },
    loadData(data){
      const obj = data2object(data)
      this.numCol = obj.numCol
      this.numRow = obj.numRow
      this.numChannel = obj.numChannel
      this.freq = this.getFreq(obj)
      this.freqDict = this.getFreqDict(this.freq)
      this.title = obj.title
      this.base = obj.base
      this.initBPM = obj.bpm
      this.initTranspose = obj.transpose
      this.createTOBPM()
      if (this.isResetSettings) {
        this.isResetSettings = false
        this.resetSettings()
      }
      this.table = []
      for (let i=0; i<this.numRow; i++) {
        this.table.push([])
        for (let j=0; j<this.numCol; j++) {
          const cell = {}
          for (let k=0; k<this.numChannel; k++) {
            const channelName = obj.channelNames[k]
            cell[channelName] = obj.channels[channelName][i][j]
          }
          this.table[i].push(cell)
        }
      }
      this.beatLength = this.numCol * this.numRow
    },
    getFreq(obj) {
      const freq = {}
      for (let i=0; i<this.numRow; i++) {
        for (let j=0; j<this.numCol; j++) {
          for (let k=0; k<this.numChannel; k++) {
            const channelName = obj.channelNames[k]
            const data = obj.channels[channelName][i][j]
            if (channelName == 'Melody' || channelName == 'Chord') {
              for (let note of data) {
                if (note == '' || note == '0') continue
                if(!freq[note]) freq[note] = 0
                freq[note]++
              }
            }
          }
        }
      }

      const sortedFreq = []
      for (let item in freq) {
        sortedFreq.push({
          angklung: notasi2angklung(item, obj.base),
          notasi: item, 
          freq: freq[item],
          highlight: false,
        })
      }
      sortedFreq.sort((a, b) => a.angklung - b.angklung)
      return sortedFreq
    },

    getFreqDict(freq) {
      const freqDict = {}
      for (let i=0; i<freq.length; i++) {
        const item = freq[i]
        freqDict[item.angklung] = item
      }
      return freqDict
    },

    getAngklung(notasi) {
      return angklungTranspose(notasi2angklung(notasi, this.base), this.transpose)
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.display {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-flow: column nowrap;
}

.main {
  display: flex;
  flex-flow: column nowrap;
  box-sizing: border-box;
  align-items: center;
  flex: 1 1 auto;
  overflow-x: hidden;
  overflow-y: auto;
}

.partitur {
  position: relative;
  display: flex;
  flex-flow: column nowrap;
  box-sizing: border-box;
  user-select: none;
  flex: 0 0 auto;
  min-width: 100%;
  margin-bottom: 25vh;
}

.partitur .row {
  display: flex;
  flex: 0 0 auto;
}

.partitur .cell {
  position: relative;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  flex: 1 0 auto;
  width: 2.5em;
  background-color: white;
  border-right: 1px rgb(200, 200, 200) solid;
  border-bottom: 1px rgb(200, 200, 200) solid;
}

.partitur .cell:first-of-type {
  border-left: 1px rgb(200, 200, 200) solid;
}

.partitur .row:first-of-type .cell {
  border-top: 1px rgb(200, 200, 200) solid;
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
  height: 4em;
  flex-flow: row wrap;
}

.partitur .cell-lyrics {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 1em;
  white-space: nowrap;
}

.partitur .notasi {
  margin-left: 0.2em;
  margin-right: 0.2em;
}

.partitur .active-cell {
  position: absolute;
  background-color: rgba(64, 160, 255, 0.2);
  z-index: 1;
  top: 0;
  left: 0;
  pointer-events: none;
}

.partitur .playhead {
  position: absolute;
  background-color: rgb(64, 160, 255);
  width: 1px;
  z-index: 1;
  top: 0;
  left: 0;
  pointer-events: none;
}

.partitur .highlight {
  background: rgb(151, 230, 151);
  transform: scale(1.5);
}

.freq-table {
  border-collapse: collapse;
}

.freq-table td {
  padding: .5em 2em;
  text-align: center;
  border: 1px solid rgb(200, 200, 200);
}

.freq-table td:first-of-type {
  background-color: rgb(230, 230, 230);
}

.information {
  box-sizing: border-box;
  background: white;
  width: 100%;
  z-index: 2;
  box-shadow: 0 -15px 30px 0 rgba(0,0,0,0.11),
              0 -5px 15px 0 rgba(0,0,0,0.08);
}

.controls {
  padding: 1em;
}

.input {
  width: 7em;
}

.progress {
  width: 100%;
  height: 4px;
  background: rgb(200, 200, 200);
}

.progress-bar {
  height: 100%;
  width: 0%;
  background: rgb(64, 160, 255);
}

.el-form--inline .el-form-item {
  margin-bottom: 0;
}

</style>
