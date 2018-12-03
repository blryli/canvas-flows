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
import canvasFlows from 'canvas-flows'
Vue.use(canvasFlows)

// require
var canvasFlows = require('canvasFlows')


// 或者直接使用script导入
<script src="https://unpkg.com/canvas-flows/dist/canvas-flows.js"></script>
```

```html
<flows v-model="config"></flows>
```

```js
<script>
export default {
  data () {
    return {
      config: {
        nodes: [
          { id: -1, name: "NEW 1" },
          { id: -2, name: "NEW 2" },
          { id: -3, name: "NEW 3" },
          { id: -4, name: "NEW 4" },
          { id: -5, name: "NEW 5" },
          { id: -6, name: "NEW 6" },
          { id: -7, name: "NEW 7" }
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
      }
    }
  }
}
</script>
```

### Props

|    name    |    Description   |   type   |default|
| -----------------  | ---------------- | :--------: | :----------: |
| value       | 数据 |Object| {}
| nodeWidth        | 节点默认宽度 |Number | 100
| nodeHeight        | 节点默高度 |Number | 30
| offsetX        | 节点间横向间隔 |Number | 12
| offsetY        | 节点间纵向间隔 |Number | 80
| useInputaEdit        | 是否启用编辑框 |Boolean | true
| fristNodeOnly        | 首节点唯一，即首节点不可被连接或删除 |Boolean | true
| readonly        | 展示模式(不可编辑) |Boolean | false
| finishNodes        | 已完成节点(展示模式可用) |Array | []

### Methods

|  事件名 |    说明           |   参数      |
|--------|------             |------       |
|add     |不传参数默认添加到顶级节点，传入id则从此id处向下添加节点       |    id   |
|next    |从id处向下添加子节点 |id           |
|deleteDot|删除点             |id           |
|deleteLine|删除线            |id           |

### Events

|  事件名 |    说明           |   回调参数      |
|--------|------             |------          |
|check  |单击节点时触发        |-- 节点ID       |
|link  |连接节点时触发        |-- {form: name, to: name}       |
|edit    |双击节点时触发       |   节点对象          |
|delete|删除节点时触发         |  节点ID           |