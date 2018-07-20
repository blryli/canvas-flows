<template>
  <div class="flows-group">
      <flows ref="steps" v-model="dataArr" :datas.sync="datas" :lines.sync="lines" :moveData="moveData" @mousemove.native="mousemoveCanvas($event)"  @click.native="clickCanvas"  @dblclick.native="edit"></flows>
      <p>{{form}}</p>
      <p>{{editIndex}}</p>
      <p>{{activeData}}</p>
      <div class="flows-group__handle">
        <slot name="handle">
          <input class="flows-group__handle-input" type="text" ref="input" :style="handleStyle" @keyup.delete="deleted">
          <input class="flows-group__handle-edit-input" v-show="isHandle" v-model="form.name" :style="editInputStyle"
            @blur="editInpuBlur($event)"
            @focus="editInpuFocus($event)"
           type="text" ref="editInput">
          <i class="flows-group__handle-next" v-show="moveData.flag && !isHandle" :style="handleStyle" type="text" @click="next(moveData.id)"></i>
        </slot>
      </div>
  </div>
</template>

<script>
export default {
  name: "flows-groups",
  props: {
    value: Object,
    nodeData: Object,
    nodeWidth: {
      type: Number,
      default: 100
    },
    nodeHeight: {
      type: Number,
      default: 36
    },
    currentId: [Number, String]
  },
  watch: {
    isHandle(val) {
      if (val) {
        this.form = this.dataArr.nodes.find(d => d.id === this.moveData.id);
        this.editInputStyle.width = this.nodeWidth - 2 + "px";
        this.editInputStyle.height = this.nodeHeight - 2 + "px";
        this.editInputStyle.top = this.activeData.y + -17 + "px";
        this.editInputStyle.left = this.activeData.x - 49 + "px";
        this.$refs.editInput.focus();
        // this.$refs.editInput.select();
      } else {
        this.dataArr.nodes[this.editIndex].name = this.form.name;
        this.$emit("input", this.dataArr);
        this.$refs.steps.init();
        this.$refs.steps.draw();
        this.form = this.dataUnBind(this.nodeData);
      }
    }
  },
  data() {
    return {
      dataArr: this.value,
      datas: [],
      lines: [],
      form: this.nodeData ? this.nodeData : { id: 0, name: "NEW 0" },
      id: 0,
      moveData: {},
      activeData: {},
      isHandle: false,
      editInputStyle: {}
    };
  },
  computed: {
    nowId() {
      let id = 0;
      if (this.dataArr.nodes.length) {
        let ids = [];
        this.dataArr.nodes.forEach(d => {
          let id = parseInt(d.id);
          ids.push(id);
        });
        let minId = Math.min(...ids);
        id = minId;
      }
      return id;
    },
    // handle的位置
    handleStyle() {
      // if (!this.moveData.flag) return "";
      let style = {};
      style.top = this.moveData.y + 11 + "px";
      style.left = this.moveData.x - 8 + "px";
      return style;
    },
    // 编辑的索引
    editIndex() {
      return this.dataArr.nodes.findIndex(d => d.id === this.activeData.id);
    }
  },
  methods: {
    // 添加
    create() {
      this.id = this.nowId;
      --this.id;
      !this.dataArr.firstProcessNodeId &&
        (this.dataArr.firstProcessNodeId = this.id);
      let obj = this.dataUnBind(this.nodeData);
      obj.id = this.id;
      obj.name = `NEW ${Math.abs(this.id)}`;
      this.dataArr.sequenceFlows.push({
        sourceRef: 3,
        targetRef: this.id
      });
      this.dataArr.nodes.push(obj);
      this.$emit("input", this.dataArr);
      this.$refs.steps.init();
      this.$refs.steps.draw();
    },
    // 向下添加
    next(id) {
      this.id = this.nowId;
      --this.id;
      let obj = this.dataUnBind(this.nodeData);
      obj.id = this.id;
      obj.name = `NEW ${Math.abs(this.id)}`;
      this.dataArr.sequenceFlows.push({
        sourceRef: id,
        targetRef: this.id
      });
      this.dataArr.nodes.push(obj);
      this.$emit("input", this.dataArr);
      this.$refs.steps.init();
      this.$refs.steps.draw();
    },
    // 编辑
    edit() {
      if (!this.moveData.id) return;
      this.isHandle = true;
    },
    editInpuFocus(e) {
      e.currentTarget.select();
    },
    editInpuBlur() {
      this.isHandle = false;
    },
    // 删除线
    deleteLine(id) {
      this.dataArr.sequenceFlows.forEach((d, i) => {
        if (
          d.sourceRef === this.activeData.fromId &&
          d.targetRef === this.activeData.toId
        ) {
          // 目标是当前ID的关系删除
          this.dataArr.sequenceFlows.splice(i, 1);
          this.dataArr.sequenceFlows.push({
            sourceRef: 3,
            targetRef: d.targetRef
          });
        }
      });
    },
    // 删除点
    deleteDot(id) {
      let target;
      let sourceArr = [];
      this.dataArr.sequenceFlows.forEach((d, i) => {
        if (d.targetRef === this.activeData.id) {
          // 目标是当前ID的关系删除
          target = i;
        }
        if (d.sourceRef === this.activeData.id) {
          // 来源是当前ID的添加到根节点
          sourceArr.push({ source: i, targetRef: d.targetRef });
        }
      });
      this.dataArr.nodes.splice(this.editIndex, 1);
      this.dataArr.sequenceFlows.splice(target, 1);
      if (sourceArr.length) {
        sourceArr.forEach(d => {
          this.dataArr.sequenceFlows.splice(d.source, 1);
          this.dataArr.sequenceFlows.push({
            sourceRef: 3,
            targetRef: d.targetRef
          });
        });
      }
    },
    // 删除
    deleted() {
      if (this.isHandle) return;
      if (!this.activeData.flag) {
        // 删除线
        this.deleteLine(this.activeData.toId, false);
      } else {
        // 删除点
        this.deleteDot(this.activeData.toId, true);
      }

      this.$refs.steps.init();
      this.$refs.steps.draw();
      this.$emit("input", this.dataArr);
      this.$emit("change", this.dataArr);
    },
    // 保存
    save() {
      if (this.isHandle) {
        this.dataArr.nodes[this.editIndex] = JSON.parse(
          JSON.stringify(this.form)
        );
      } else {
        this.dataArr.nodes.push(this.form);
      }
      this.$refs.steps.init();
      this.$refs.steps.draw();
      this.isHandle = false;
      this.$emit("input", this.dataArr);
      this.$emit("change", this.dataArr);
    },
    // 获取事件所在节点
    clickCanvas() {
      if (this.isHandle || !this.moveData.id) return;
      this.activeData = this.moveData;
      this.activeData.id && this.$refs.input.focus();
      this.$emit("update:currentId", this.activeData.id);
      this.$refs.steps.draw(this.activeData.id);
    },
    mousemoveCanvas(e) {
      if (this.isHandle) return;
      var px = e.layerX;
      var py = e.layerY;
      this.moveData = { id: "" };
      // 逐条线确定是否有点中
      var offset = 5; // 可接受（偏移）范围
      this.datas.forEach(d => {
        this.inStep(px, py, d) && this.moveData !== d && (this.moveData = d);
      });
      for (var i = 0; i < this.lines.length; i++) {
        var p1 = { x: this.lines[i].fromX, y: this.lines[i].fromY }; // 直线起点
        var p2 = { x: this.lines[i].toX, y: this.lines[i].toY }; // 直线终点
        var minX = Math.min(p1.x, p2.x); // 较小的X轴坐标值
        var maxX = Math.max(p1.x, p2.x); // 较大的X轴坐标值
        var minY = Math.min(p1.y, p2.y); // 较小的Y轴坐标值
        var maxY = Math.max(p1.y, p2.y); // 较大的Y轴坐标值

        if (p1.y === p2.y) {
          // 水平线
          if (
            px >= minX &&
            px <= maxX &&
            (py >= minY - offset && py <= maxY + offset)
          ) {
            this.moveData = this.lines[i];
          }
        } else if (p1.x === p2.x) {
          // 垂直线
          if (
            py >= minY &&
            py <= maxY &&
            (px >= minX - offset && px <= maxX + offset)
          ) {
            this.moveData = this.lines[i];
          }
        } else {
          // 斜线 (先判断点是否进入可接受大范围(矩形)，然后再根据直线上的交叉点进行小范围比较)
          if (
            px >= minX &&
            px <= maxX &&
            (py >= minY - offset && py <= maxY + offset)
          ) {
            // 求Y轴坐标
            // 方法1：根据tanθ= y/x = y1/x1, 即y = (y1/x1)*x  (该方法有局限性，垂直线(p2.x - p1.x)=0，不能用)
            // var y = ((p2.y - p1.y) / (p2.x - p1.x)) * (px - p1.x);

            // 方法2：先求弧度hudu，根据cosθ=x/r, r=x/cosθ,求得r，再根据sinθ=y/r, y=sinθ*r, 求得y
            var hudu = Math.atan2(p2.y - p1.y, p2.x - p1.x); // 直线的弧度(倾斜度)
            // 用三角函数计出直线上的交叉点
            var r = (px - p1.x) / Math.cos(hudu); // 直角三角形的斜边（或理解成圆的半径）
            var y = Math.sin(hudu) * r; // Y轴坐标

            var p = { x: px, y: p1.y + y }; // 直线上的交叉点
            if (Math.abs(px - p.x) <= offset && Math.abs(py - p.y) <= offset) {
              this.moveData = this.lines[i]; // 1 - 点中
            }
          }
        }
      }
    },
    // 判断鼠标是否在节点内
    inStep(x, y, node) {
      var offsetW = this.nodeWidth / 2;
      var offsetH = this.nodeHeight / 2;
      return (
        x &&
        x >= node.x - offsetW &&
        x <= node.x + offsetW &&
        y >= node.y - offsetH &&
        y <= node.y + offsetH
      );
    },
    dataUnBind(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
  },
  mounted() {}
};
</script>

<style lang="scss" scoped>
.flows-group {
  position: relative;
  border: 1px solid #aaa;
  z-index: 99;
  max-height: 600px;
  overflow: auto;
}
.flows-group__handle {
  position: absolute;
  left: 0;
  top: 0;
}
.flows-group__handle-next {
  z-index: 100;
  position: absolute;
  top: 0;
  left: 0;
  padding: 0px;
  width: 16px;
  height: 16px;
  color: #fff;
  border-radius: 50%;
  border: 1px solid #139bd4;
  background-color: #139bd4;
  cursor: pointer;
  &::before {
    content: "";
    display: block;
    width: 6px;
    height: 6px;
    border-left: 2px #fff solid;
    border-bottom: 2px #fff solid;
    position: absolute;
    top: 2.5px;
    left: 4px;
    transform: rotate(-45deg);
    transition: transform 0.3s ease-out, top 0.3s ease-out;
  }
}
.flows-group__handle-edit-input {
  position: relative;
  z-index: 100;
  border: 0;
  padding: 10px;
  box-sizing: border-box;
  font-size: 15px;
  outline: none;
}
.flows-group__handle-input {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  opacity: 0;
}
</style>
