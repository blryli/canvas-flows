import Flows from './flows';
import FlowsGroups from './flows-groups';

const components = [
  Flows,
  FlowsGroups
];

const install = function (Vue) {
  components.map(component => {
    Vue.component(component.name, component);
  });
};

if (typeof window !== 'undefined' && window.Vue) {
  install(window.Vue);
}

export default install;
