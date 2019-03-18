import Vue from 'vue'
import Router from 'vue-router'
import Display from './views/Display.vue'
import Music from './views/Music.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Display
    },
    {
      path: '/music',
      name: 'music',
      component: Music
    }
  ]
})
