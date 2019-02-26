<template>
  <div class="display">
    <div class="information">
      <div>
        <el-upload
          drag
          action="#"
          :before-upload="beforeUpload">
          <i class="el-icon-upload" />
          <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
        </el-upload>
        <el-form label-width="5em">
          <el-form-item>
            <h1>{{title}}</h1>
          </el-form-item>
          <el-form-item>
            <el-button @click="resetSettings">Reset Settings</el-button>
          </el-form-item>
          <el-form-item label="Base">
            <span>{{baseTransposed}}</span>
          </el-form-item>
          <el-form-item label="Transpose">
            <el-input-number v-model="transpose" @change="changeTranspose"/>
          </el-form-item>
          <el-form-item label="BPM">
            <el-input-number v-model="bpm" :min="0" @change="changeBPM"/>
          </el-form-item>
          <el-form-item label="Type">
            <el-select v-model="type" @change="changeType">
              <el-option
                v-for="(item, index) in typeOption"
                :key="index"
                :value="item">
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button v-if="!isPlay" type="primary" @click="play">Play</el-button>
            <el-button v-if="isPlay" type="danger" @click="pause">Pause</el-button>
            <el-button @click="reset">Reset</el-button>
          </el-form-item>
        </el-form>
      </div>
      <div>
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
          </tr>
        </table>
      </div>
    </div>

    <div class="partitur">
      <div v-for="(row, i) in table" :key="i" class="row">
        <div 
          v-for="(cell, j) in row" 
          :key="j"
          :class="{ current: i * row.length + j == currentBeat}"
          @mousedown="playheadMouseMove($event, i * row.length + j)"
          @mousemove="playheadMouseMove($event, i * row.length + j)"
          class="cell">
          <div class="cell-melody">
            <Notasi 
              v-for="(item, index) in cell['Melody']"
              :key="index"
              :notasi="item" 
              :type="type" 
              :base="base" 
              :transpose="transpose" />
            <Notasi 
              v-for="(item, index) in cell['Chord']"
              :key="cell['Melody'].length + index"
              :notasi="item" 
              :type="type" 
              :base="base" 
              :transpose="transpose" />
          </div>
          <div class="cell-lyrics">
            {{cell['Lyrics']}}
          </div>
          <div 
            v-if="i * row.length + j == currentBeat" 
            :style="{ left: `${currentFraction*100}%`}"
            class="playhead"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Notasi from './Notasi'
import {noteTranspose, notasi2angklung} from '@/js/Note'
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
      fps: 200,
      title: 'Untitled',
      base: 'C5',
      second: 0,
      transpose: 0,
      initTranspose: 0,
      bpm: 60,
      initBPM: 60,
      freq: [],
      fileList: [],
      table: [],
      startBeatFraction: 0.0,
      currentBeatFraction: 0.0,
      isPlay: false,
      to: null,
      beatLength: 0,
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
    },
    finishPercentage() {
      const finish = this.currentBeatFraction / this.beatLength
      return (finish < 0)? 0 : (finish > 1)? 1 : finish
    },
    halfbps() {
      return this.bpm / 60 * 2
    }
  },
  watch: {
    bpm(bpm) {
      if (this.isPlay) this.play()
    }
  },
  created() {
    this.changeVector = _.throttle((vector) => {
      if (this.to) this.to.update(vector)
    }, 300)

    Promise.all([
      this.$loadScript(timingsrcURL),
      this.$loadScript(mcorpURL)
    ])
    .then(() => {
      /*global TIMINGSRC*/
      /*global MCorp*/
      const app = MCorp.app(MCORP_APPID)
      app.run = () => {
        const timingProvider = app.motions[MCORP_MOTION_NAME]
        this.to = new TIMINGSRC.TimingObject({provider: timingProvider})
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
        if (!this.isPlay) {
          this.play()
        } else {
          this.pause()
        }
      }
      if (e.key == 'Escape') {
        this.reset()
      }
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
  methods: {
    play() {
      this.changeVector({velocity: this.halfbps, acceleration: 0})
    },
    pause() {
      this.changeVector({velocity: 0, acceleration: 0})
    },
    update() {
      if (this.to) {
        this.currentBeatFraction = this.to.pos
        if (this.isPlay) {
          const el = document.documentElement
          el.scrollTop = (el.scrollHeight - el.clientHeight) * this.finishPercentage
        }
      }
      this.timer = requestAnimationFrame(this.update)
    },
    reset() {
      this.changeVector({position: 0, velocity: 0, acceleration: 0})
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
    playheadMouseMove(ev, beat) {
      if (ev.buttons == 1) {
        var x = ev.clientX - ev.currentTarget.offsetLeft
        // var y = ev.clientY - ev.currentTarget.offsetTop
        var fraction = x / ev.currentTarget.offsetWidth
        this.changeVector({position: beat + fraction})
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
    loadData(data){
      const obj = data2object(data)
      this.freq = this.getFreq(obj)
      this.title = obj.title
      this.base = obj.base
      this.initBPM = obj.bpm
      this.initTranspose = obj.transpose
      if (this.isResetSettings) {
        this.isResetSettings = false
        this.resetSettings()
      }
      this.table = []
      for (let i=0; i<obj.channels['Melody'].length; i++) {
        this.table.push([])
        for (let j=0; j<obj.channels['Melody'][i].length; j++) {
          const cell = {}
          for (let k=0; k<obj.channelNames.length; k++) {
            const channelName = obj.channelNames[k]
            cell[channelName] = obj.channels[channelName][i][j]
          }
          this.table[i].push(cell)
        }
      }
      this.beatLength = obj.numCol * obj.numRow
    },
    getFreq(obj) {
      const freq = {}
      for (let i=0; i<obj.channels['Melody'].length; i++) {
        for (let j=0; j<obj.channels['Melody'][i].length; j++) {
          for (let k=0; k<obj.channelNames.length; k++) {
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
          freq: freq[item]
        })
      }
      sortedFreq.sort((a, b) => a.angklung - b.angklung)
      return sortedFreq
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.display {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  margin-bottom: 75vh;
}

.partitur {
  display: flex;
  flex-flow: column nowrap;
  user-select: none;
  width: 100%;
  font-size: 1.5em;
}

.partitur .row {
  display: flex;
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
  background-color: rgb(196, 225, 255);
}

.partitur .notasi {
  margin-left: 0.2em;
  margin-right: 0.2em;
}

.partitur .playhead {
  position: absolute;
  width: 1px;
  height: 100%;
  background-color: #409EFF;
  top: 0;
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
  display: flex;
}

.information > * + * {
  margin-left: 1em;
}

</style>
