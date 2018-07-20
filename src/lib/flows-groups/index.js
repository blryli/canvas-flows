/* jshint esversion: 6 */
import FlowsGroups from './flows-groups.vue';

/* istanbul ignore next */
FlowsGroups.install = function(Vue) {
  Vue.component(FlowsGroups.name, FlowsGroups);
};

export default FlowsGroups;