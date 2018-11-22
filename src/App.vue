<template>
  <div id="app">
    <h3>steps 流程图</h3>
    <p>
      <button @click="$refs.flows.create()">添加节点</button>
    </p>
    <flows ref="flows" :useInputaEdit="true" v-model="config" :nodeData="operation"  :currentNode.sync="currentNode" :finishNodes="finishNodes" @edit="edit"></flows>
    <p>当前选中节点： {{currentNode}}</p>
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
          { id: -5, name: "NEW 5" },
          { id: -6, name: "NEW 6" }
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
        ]
      },
      operation: {
        id: 0,
        name: "NEW 0"
      },
      currentNode: {},
      finishNodes: []
    };
  },
  methods: {
    edit(id) {
      console.log('edit: ' + id)
    }
  }
};
</script>

<style lang="scss" scoped>
h3{
  text-align: center;
}
</style>

