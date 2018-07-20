import Vue from 'vue'
import App from './App.vue'
import  CanvasFlows from './lib/index.js';

Vue.use(CanvasFlows);

new Vue({
  el: '#app',
  render: h => h(App)
})
