import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import LoadScript from 'vue-plugin-load-script'
import firebase from 'firebase/app'
import 'firebase/firestore'

import App from './App.vue'
import router from './router'

const config = {
  apiKey: "AIzaSyB3jQnfr3o-1qVKqJrcDhi9ikgeriUSlzI",
  authDomain: "angklung-grenoble.firebaseapp.com",
  databaseURL: "https://angklung-grenoble.firebaseio.com",
  projectId: "angklung-grenoble",
  storageBucket: "angklung-grenoble.appspot.com",
  messagingSenderId: "994515253512"
}

firebase.initializeApp(config)

Vue.prototype.$firebase = firebase
Vue.prototype.$db = firebase.firestore()

Vue.use(ElementUI)
Vue.use(LoadScript)

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
