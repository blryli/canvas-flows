# canvas-flows

> A canvas flows project

The project address https://blryli.github.io/canvas-flows/

```html
<flows ref="flowsGroups" v-model="config" :currentNode.sync="currentNode"></flows>
```

```js
<script>
export default {
  data () {
    return {
      config: {},
      currentNode: {},
      finishNodes: []
    }
  },
  methods: {
    //当前选中的值
    getSaskStatus(val) {
      this.checkValues = val;
      console.log('按钮 选中的值: '+val)
    },
  }
}
</script>
```

### Props

|    name    |    Description   |   type   |default|
| -----------------  | ---------------- | :--------: | :----------: |
| value       | 数据 |Object| {}
| nodeData       | 节点默认数据 |Object| 
| currentNode        | 当前选中节点 |Object | 
| finishNodes        | 已完成节点 |Array | []
| nodeWidth        | 节点默认宽度 |Number | 100
| nodeHeight        | 节点默高度 |Number | 30
| offsetX        | 节点间横向间隔 |Number | 12
| offsetY        | 节点间纵向间隔 |Number | 80
| onlyLook        | 展示模式(不可编辑) |Boolean | false
| useInputaEdit        | 是否启用编辑框 |Boolean | true