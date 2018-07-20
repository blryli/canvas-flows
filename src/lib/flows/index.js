/* jshint esversion: 6 */
import Flows from './flows.vue';

/* istanbul ignore next */
Flows.install = function (Vue) {
  Vue.component(Flows.name, Flows);
};

export default Flows;