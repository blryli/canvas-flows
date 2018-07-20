<template>
  <div id="app">
    <h3>steps 流程图</h3>
    <button @click="$refs.flowsGroups.create()">添加节点</button>
    <flows ref="flowsGroups" v-model="config" :nodeData="operation" :currentId.sync="currentId"></flows>
    <p>当前选中ID： {{currentId}}</p>
  </div>
</template>

<script>
export default {
  name: "app",
  data() {
    return {
      config: {
        nodes: [],
        sequenceFlows: []
      },
      operation: {
        id: 0,
        name: "NEW 0"
      },
      currentId: '',
      dialogFormVisible: false,
    };
  }
};
</script>

<style lang="scss" scoped>
</style>

