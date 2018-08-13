<template>
  <div id="app">
    <h3>steps 流程图</h3>
    <button @click="$refs.flowsGroups.create()">添加节点</button>
    <flows ref="flowsGroups" v-model="config" :nodeData="operation" :currentName.sync="currentName" :finishNodes="finishNodes"></flows>
    <p>当前选中节点： {{currentName}}</p>
  </div>
</template>

<script>
export default {
  name: "app",
  data() {
    return {
      config: {
        nodes: [
          { id: -1, name: "NEW 1" },
          { id: -2, name: "NEW 2" },
          { id: -3, name: "NEW 3" },
          { id: -4, name: "NEW 4" },
          { id: -6, name: "NEW 6" },
          { id: -7, name: "NEW 7" },
          { id: -5, name: "NEW 5" }
        ],
        sequenceFlows: [
          { sourceRef: 3, targetRef: -1 },
          { sourceRef: -1, targetRef: -2 },
          { sourceRef: -1, targetRef: -3 },
          { sourceRef: -1, targetRef: -4 },
          { sourceRef: -1, targetRef: -6 },
          { sourceRef: -2, targetRef: -5 },
          { sourceRef: -3, targetRef: -5 },
          { sourceRef: -4, targetRef: -5 },
          { sourceRef: -6, targetRef: -5 }
        ],
        firstProcessNodeId: -1
      },
      finishNodes: [],
      operation: {
        id: 0,
        name: "NEW 0"
      },
      currentName: "",
      dialogFormVisible: false
    };
  }
};
</script>

<style lang="scss" scoped>
</style>

