import Flows from './flows';
import Info from './info';

const components = [
  Flows
];

const plugin = {
  install(Vue, opts = {}) {
    components.forEach(component => {
      Vue.component(component.name, component)
    })
    Vue.prototype.$info = Info;
  }
}

// Auto-install
let GlobalVue = null
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue
}
if (GlobalVue) {
  GlobalVue.use(plugin)
}

export default plugin
