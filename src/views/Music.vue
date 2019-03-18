<template>
  <div class="music">
    <div ref="main" class="main">
      <audio ref="audio" class="audio" :src="require('@/assets/Romantic Tropical Beach.mp3')" />
    </div>
    <div class="information">
      <div ref="progress" class="progress">
        <div ref="progressBar" class="progress-bar"></div>
      </div>
      <el-form class="controls" :inline="true" @submit.native.prevent>
        <el-form-item>
          <el-upload
            action="#"
            :before-upload="beforeUpload">
            <el-button icon="el-icon-upload">Open</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-tooltip content="Reset Skew" placement="top">
            <el-button icon="el-icon-refresh" circle @click="resetSettings"></el-button>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="Skew">
          <el-input-number class="input" controls-position="right" :precision="2" :step="0.1" v-model="skew" @change="changeSkew"/>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

const timingsrcURL = 'https://webtiming.github.io/timingsrc/lib/timingsrc-min-v2.js'
const mcorpURL = 'https://www.mcorp.no/lib/mcorp-2.0.js'
const mediaSyncURL = 'https://mcorp.no/lib/mediasync.js'

const MCORP_APPID = '2089995353868620333'
const MCORP_MOTION_NAME = 'main'

export default {
  name: 'Music',
  data() {
    return {
      isPlay: false,
      to: null,
      sync: null,
      timer: null,
      skew: 0.0,
    }
  },
  watch: {
    skew() {
      if (this.sync) this.sync.setSkew(this.skew)
    }
  },
  created() {
    // persistent highlight
    // https://vuejs.org/v2/cookbook/client-side-storage.html
    this.changeVector = _.throttle((vector) => {
      if (this.to) this.to.update(vector)
    }, 300)

    Promise.all([
      this.$loadScript(timingsrcURL),
      this.$loadScript(mcorpURL),
      this.$loadScript(mediaSyncURL),
    ])
    .then(() => {
      /*global TIMINGSRC*/
      /*global MCorp*/
      const app = MCorp.app(MCORP_APPID, {anon: true})
      app.run = () => {
        const timingProvider = app.motions[MCORP_MOTION_NAME]
        this.to = new TIMINGSRC.TimingObject({provider: timingProvider})
        this.to.on('change', () => {
          this.isPlay = this.to.vel != 0
        })
        this.sync = MCorp.mediaSync(this.$refs.audio, this.to)
        this.sync.setSkew(this.skew)
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
      this.skew = data.skew
    })
  },
  destroyed() {
    cancelAnimationFrame(this.timer)
  },
  methods: {
    update() {
      // if (this._lastStamp) {
      //   console.log(1000 / (stamp - this._lastStamp))
      // }
      // this._lastStamp = stamp;
      if (this.to) {
        const progressBar = this.$refs.progressBar
        const finishPercentage = this.to.pos / this.$refs.audio.duration

        progressBar.style.width = `${100 * finishPercentage}%`
      }
      this.timer = requestAnimationFrame(this.update)
    },
    beforeUpload(file) {
      // to deselect
      document.activeElement.blur()
      // const reader = new FileReader()

      // reader.onload = this.onLoad.bind(this)
      // reader.readAsBinaryString(file)
      return false
    },
    changeSkew(skew) {
      this.$db.collection('global').doc('settings').set({
        skew: skew,
      }, { merge: true })
    },

    resetSettings() {
      this.$db.collection('global').doc('settings').set({
        skew: 0,
      }, { merge: true })
    },
  }
}

</script>

<style scoped>
.music {
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
  padding: 1rem;
  align-items: center;
  justify-content: center;
  flex: 1 1 auto;
  overflow-x: hidden;
  overflow-y: auto;
}

.audio {
  width: 100%;
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
  width: 10em;
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