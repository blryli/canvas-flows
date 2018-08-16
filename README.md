# canvas-flows

> A canvas flows project

## 项目演示

[演示地址](https://blryli.github.io/canvas-flows/)

## 安装

``` Bash
npm install canvas-flows -S
```

## 使用

```js
//ES6
import canvasFlows from 'canvas-flows.js'

// require
var canvasFlows = require('canvasFlows')

Vue.use(canvasFlows)

// 或者直接使用script导入
<script src="https://unpkg.com/canvas-flows/dist/canvas-flows.js"></script>
```

```html
<flows ref="flowsGroups" v-model="config" :nodeData="operation" :currentNode.sync="currentNode"></flows>
```

```js
<script>
export default {
  data () {
    return {
      config: {},
      currentNode: {},
      operation: {},
      finishNodes: []
    }
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
| nodeWidth        | 节点默认宽度 |Number | 100
| nodeHeight        | 节点默高度 |Number | 30
| offsetX        | 节点间横向间隔 |Number | 12
| offsetY        | 节点间纵向间隔 |Number | 80
| useInputaEdit        | 是否启用编辑框 |Boolean | true
| onlyLook        | 展示模式(不可编辑) |Boolean | false
| finishNodes        | 已完成节点(展示模式可用) |Array | []

### Events

|  事件名 |    说明           |   参数      |
|--------|------             |------       |
|create  |增加节点            |--           |
|next    |从id处向下添加子节点 |id           |
|deleteDot|删除点             |id           |
|deleteLine|删除线            |id           |