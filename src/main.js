import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import LoadScript from 'vue-plugin-load-script'

import App from './App.vue'

Vue.use(ElementUI)
Vue.use(LoadScript)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
