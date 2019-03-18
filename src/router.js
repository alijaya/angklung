import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Control from './views/Control.vue'
import Music from './views/Music.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/control',
      name: 'control',
      component: Control
    },
    {
      path: '/music',
      name: 'music',
      component: Music
    }
  ]
})
