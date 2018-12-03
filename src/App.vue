<template>
  <div id="app">
    <h3>steps 流程图</h3>
    <p>
      <button @click="$refs.flows.add()">添加节点</button>
    </p>
    <flows
      ref="flows"
      v-model="config"
      :model="form"
      :useInputaEdit="true"
      :fristNodeOnly="true"
      :finishNodes="finishNodes"
      @edit="edit"
      @delete="deleteNode"
      @check="check"
      @link="link"
    ></flows>
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
      form: {id: '', name: '', age: '', left: {}, right: {}},
      currentNode: "",
      finishNodes: []
    };
  },
  methods: {
    edit(obj) {
      console.log("edit: " + JSON.stringify(obj));
    },
    link(obj) {
      console.log("link: " + JSON.stringify(obj));
    },
    check(name) {
      this.currentNode = name;
    },
    deleteNode(val) {
      console.log(`delete ${val}`);
    },
    save() {
      this.config.nodes.splice(
        this.config.nodes.findIndex(d => d.id === this.form.id),
        1,
        this.form
      );
      this.$refs.flows.redraw();
    }
  }
};
</script>

<style lang="scss" scoped>
h3 {
  text-align: center;
}
</style>

