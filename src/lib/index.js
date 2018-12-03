import Flows from './flows';
import Info from './info';

const components = [
  Flows
];

const install = function (Vue) {
  components.map(component => {
    Vue.component(component.name, component);
  });
  Vue.prototype.$info = Info;
};

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}

export default install;
