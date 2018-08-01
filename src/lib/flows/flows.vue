<template>
  <div class="flows-group">
    <div ref="flows" class="flows">
      <canvas ref="flowsCanvas" class="flows__canvas" :width="width" :height="height" @mousemove="mousemoveCanvas($event)" @click="clickCanvas" @dblclick="edit"></canvas>
      <input class="flows__handle-input" type="text" ref="input" :style="handleStyle" @keyup.delete="deleted">
      <textarea rows="1" class="flows__handle-edit-textarea" v-show="isHandle" v-model="form.name" :style="editTextareaStyle" @keyup.enter="editInpuBlur($event)" @blur="editInpuBlur($event)" @focus="editInpuFocus($event)" ref="editTextarea"></textarea>
      <i class="flows__handle-next" v-show="moveData.flag && !isHandle" :style="handleStyle" type="text" @click="next(moveData.id)"></i>
    </div>
    <p>移过的节点： {{moveData}}</p>
    <p>选中的节点： {{activeData}}</p>
    <p>选中节点数据： {{form}}</p>
    <p>选中节点数据： {{dataArr}}</p>
  </div>
</template>

<script>
import Step from "./step.js";
import Arrow from "./arrow.js";
export default {
  name: "flows",
  props: {
    value: Object,
    nodeData: Object,
    currentId: [Number, String],
    finishNodes: {
      type: Array,
      default: () => []
    },
    nodeWidth: {
      type: Number,
      default: 100
    },
    nodeHeight: {
      type: Number,
      default: 30
    },
    offsetX: {
      type: Number,
      default: 12
    },
    offsetY: {
      type: Number,
      default: 80
    }
  },
  data() {
    return {
      dataArr: this.value,
      data: [], // 渲染结构
      dot: [], // 点数组
      line: [], // 线条数组
      canvas: "",
      cxt: "",
      width: 600,
      height: 500,
      minPosArr: [], // 每列最小坐标
      maxPosArr: [], // 每列最大坐标
      initDataFinish: false,
      isInit: true,

      form: this.nodeData ? this.nodeData : { id: 0, name: "NEW 0" },
      id: 0,
      moveData: {},
      activeData: {},
      isHandle: false,
      editTextareaStyle: {}
    };
  },
  created() {},
  computed: {
    minPos() {
      return Math.min(...this.minPosArr) - this.nodeWidth / 2;
    },
    maxPos() {
      return Math.max(...this.maxPosArr) + this.nodeWidth / 2;
    },
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
      style.top = this.moveData.y + 9 + "px";
      style.left = this.moveData.x - 8 + "px";
      return style;
    },
    // 编辑的索引
    editIndex() {
      return this.dataArr.nodes.findIndex(d => d.id === this.activeData.id);
    }
  },
  watch: {
    value() {
      if (this.isInit) {
        this.setCanvasWidth();
        this.init();
        this.draw();
        this.isInit = false;
      }
    },
    isHandle(val) {
      if (val) {
        this.form = this.dataUnBind(
          this.dataArr.nodes.find(d => d.id === this.moveData.id)
        );
        this.editTextareaStyle.width = this.nodeWidth - 18 + "px";
        this.editTextareaStyle.top = this.activeData.y + -9 + "px";
        this.editTextareaStyle.left = this.activeData.x - 42 + "px";
        // this.$refs.editTextarea.focus();
        this.$nextTick(() => {
          this.$refs.editTextarea.select();
        });
      } else {
        if (this.dataArr.nodes[this.editIndex].name === this.form.name) return;
        this.save();
      }
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
      this.init();
      this.draw();
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
      this.init();
      this.draw();
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

      this.init();
      this.draw();
      this.$emit("input", this.dataArr);
      this.$emit("change", this.dataArr);
    },
    // 保存
    save() {
      this.form.name = this.form.name.replace(/\n/g, "");
      this.dataArr.nodes[this.editIndex] = JSON.parse(
        JSON.stringify(this.form)
      );
      this.init();
      this.draw();
      this.isHandle = false;
      this.$emit("input", this.dataArr);
      this.$emit("change", this.dataArr);
    },
    // 获取事件所在节点
    clickCanvas() {
      if (this.isHandle) return;
      this.activeData = this.moveData;
      this.activeData.id && this.$refs.input.focus();
      this.$emit("update:currentId", this.activeData.id);
      this.draw(this.moveData.id);
    },
    mousemoveCanvas(e) {
      if (this.isHandle) return;
      var px = e.layerX;
      var py = e.layerY;
      this.moveData = { id: "" };
      // 逐条线确定是否有点中
      var offset = 5; // 可接受（偏移）范围
      this.dot.forEach(d => {
        this.inStep(px, py, d) && this.moveData !== d && (this.moveData = d);
      });
      for (var i = 0; i < this.line.length; i++) {
        var p1 = { x: this.line[i].fromX, y: this.line[i].fromY }; // 直线起点
        var p2 = { x: this.line[i].toX, y: this.line[i].toY }; // 直线终点
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
            this.moveData = this.line[i];
          }
        } else if (p1.x === p2.x) {
          // 垂直线
          if (
            py >= minY &&
            py <= maxY &&
            (px >= minX - offset && px <= maxX + offset)
          ) {
            this.moveData = this.line[i];
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
              this.moveData = this.line[i]; // 1 - 点中
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
    },
    // 初始化点
    initData(opts, flows, firstNode) {
      if (firstNode) {
        let arr = [];
        let targetRef;
        let index;
        firstNode.forEach(node => {
          flows.length &&
            flows.forEach((flow, i) => {
              if (parseInt(flow.sourceRef) === parseInt(node.id)) {
                // 来源相同
                if (targetRef !== parseInt(flow.targetRef)) {
                  arr.push({
                    id: parseInt(flow.targetRef),
                    from: parseInt(flow.sourceRef)
                  });
                  targetRef = parseInt(flow.targetRef); // 去重
                  index = i;
                } else if (targetRef === parseInt(flow.targetRef)) {
                  // 目标相同
                  !arr[arr.length - 1].froms &&
                    (arr[arr.length - 1].froms = [flows[index].sourceRef]);
                  arr[arr.length - 1].froms.push(parseInt(flow.sourceRef));
                }
              }
            });
        });
        if (!arr.length) {
          // 初始化点完成
          this.countDotCoord(); // 计算点坐标
          return;
        }
        this.data.push(arr);
        this.initData(opts, flows, arr);
      } else {
        this.initDataFinish = false;
        this.data = [];
        firstNode = [{ id: 3 }];
        this.data.push(firstNode);
        this.initData(opts, flows, firstNode);
      }
    },
    // 计算点坐标
    countDotCoord() {
      // 设置初始坐标
      this.data.forEach((da, idx) => {
        let y = idx * this.offsetY - 40;
        da.forEach(d => {
          let x = this.nodeWidth + this.offsetX;
          d.x = x;
          d.y = y;
        });
      });

      // 计算x坐标
      this.minPosArr = [];
      this.maxPosArr = [];
      this.setNodeX();
    },
    // 从最后一行递归设置每一行的x坐标
    setNodeX(lastRowIndex) {
      if (this.data.length > 1) {
        // 设置最后一行 为坐标计算起始行
        let index = (lastRowIndex = lastRowIndex || this.data.length - 1);

        if (lastRowIndex > 0) {
          // 当前行按来源进行分组：
          let rowGArr = [];
          let rowX = [];
          this.data[lastRowIndex].forEach(da => {
            rowX.push(da.id);
          });
          let nowRowArr = this.data[lastRowIndex];
          let n = 0;
          for (let i = 0; i < nowRowArr.length; i++) {
            if (
              !nowRowArr[i + 1] ||
              (nowRowArr[i + 1] && nowRowArr[i].from !== nowRowArr[i + 1].from)
            ) {
              rowGArr.push(rowX.slice(n, i + 1));
              n = i + 1;
            }
          }
          // console.log(
          //   `当前 ${lastRowIndex} 行按来源进行分组：` + JSON.stringify(rowGArr)
          // );
          // 当前行节点来源
          let fromArr = [];
          this.data[lastRowIndex].forEach(d => {
            d.froms ? fromArr.push(d.froms) : fromArr.push(d.from);
          });
          fromArr = Array.from(new Set(fromArr));
          // console.log(
          //   `当前 ${lastRowIndex} 行节点来源：` + JSON.stringify(fromArr)
          // );

          // 来源在上一行的位置
          let fromIndexArr = [];
          let fromatArr = [].concat.apply([], fromArr);
          this.data[lastRowIndex - 1].forEach((da, idx) => {
            fromatArr.forEach(d => {
              da.id === d && fromIndexArr.push(idx);
            });
          });
          // console.log(
          //   `${lastRowIndex} 行来源在上一行的位置` +
          //     JSON.stringify(fromIndexArr)
          // );

          // 最后一行节点x
          if (lastRowIndex === this.data.length - 1) {
            for (let i = 0; i < rowGArr.length; i++) {
              rowGArr[i].forEach((da, idx) => {
                if (i === 0) {
                  // 确定第一个分组的坐标
                  this.data[lastRowIndex].forEach(d => {
                    da === d.id &&
                      (d.x = (this.nodeWidth + this.offsetX) * (idx + 1));
                  });
                } else {
                  let offsetNum = fromIndexArr[i] - fromIndexArr[i - 1]; // 偏移量
                  this.data[lastRowIndex].forEach((d, i) => {
                    if (da === d.id) {
                      let prevNode = this.data[lastRowIndex][i - 1].x; // 上一个节点坐标
                      d.x =
                        idx === 0
                          ? prevNode +
                            (this.nodeWidth + this.offsetX) * offsetNum
                          : prevNode + this.nodeWidth + this.offsetX;
                    }
                  });
                }
              });
            }
          }
          // 当前行坐标值x：
          rowGArr.forEach(da => {
            da.forEach((d, i) => {
              this.data[lastRowIndex].forEach(x => {
                d === x.id && da.splice(i, 1, x.x);
              });
            });
          });
          this.minPosArr.push(this.data[lastRowIndex][0].x);
          this.maxPosArr.push(
            this.data[lastRowIndex][this.data[lastRowIndex].length - 1].x
          );
          // console.log(
          //   `当前 ${lastRowIndex} 行分组 的值x：` + JSON.stringify(rowGArr)
          // );
          let nodeArr = []; // 节点数组
          rowGArr.forEach(d => {
            nodeArr.push((d[0] + d[d.length - 1]) / 2);
          });
          let MinArr = []; // 最小点数组
          rowGArr.forEach(d => {
            MinArr.push(d[0]);
          });
          let MaxArr = []; // 最大点数组
          rowGArr.forEach(d => {
            MaxArr.push(d[d.length - 1]);
          });

          // 计算上一行的节点x
          for (let i = 0; i < fromIndexArr.length; i++) {
            this.data[lastRowIndex - 1].forEach((da, idx) => {
              if (idx < fromIndexArr[i]) {
                // 在来源节点左侧
                if (fromIndexArr.indexOf(idx) !== -1) return;
                let num = fromIndexArr[i] - idx; // 间隔数
                da.x = MinArr[i] - (this.nodeWidth + this.offsetX) * num;
                // console.log(
                //   `上一行 ${lastRowIndex - 1} ${da.id} 在来源节点左侧  位置: ` +
                //     da.x +
                //     " 最小点: " +
                //     MinArr[i] +
                //     " 间隔数: " +
                //     num
                // );

                // 最小点
                // idx === 0 && this.minPosArr.push(da.x);
              } else if (idx === fromIndexArr[i]) {
                // 来源对应节点
                // idx === 0 && this.minPosArr.push(da.x);
                // 在来源节点
                if (typeof fromArr[i] === "number") {
                  // 一对一
                  da.x = nodeArr[i];
                  // console.log(
                  //   `上一行 ${lastRowIndex - 1} ${
                  //     da.id
                  //   } 在来源节点中点  位置: ` +
                  //     da.x +
                  //     " 中点: " +
                  //     nodeArr[i]
                  // );
                } else {
                  // 一对多
                  fromArr[i] &&
                    fromArr[i].forEach((d, index) => {
                      // 最左侧坐标
                      let len = fromArr[i].length;
                      let startX =
                        nodeArr[i] -
                        ((this.nodeWidth + 50) * len +
                          this.offsetX * (len - 1)) /
                          2;
                      da.x =
                        startX + (this.nodeWidth + this.offsetX) * (index + 1);
                    });
                }
              } else {
                // 在来源点右侧
                if (fromIndexArr.indexOf(idx) !== -1) return;
                let num = Math.abs(idx - fromIndexArr[i]); // 间隔数
                da.x = MaxArr[i] + (this.nodeWidth + this.offsetX) * num;
                // console.log(
                //   `上一行 ${lastRowIndex - 1} ${da.id} 在来源节点右侧  位置: ` +
                //     da.x +
                //     " 最大点: " +
                //     MaxArr[i] +
                //     " 间隔数: " +
                //     num
                // );
              }
            });
          }
          lastRowIndex--;
        } else return;
        if (lastRowIndex === index || lastRowIndex === 0) {
          // x坐标计算完成
          // console.log("点坐标计算完成", JSON.stringify(this.data));
          this.dot = [];
          this.data.forEach((da, idx) => {
            da.forEach((d, i) => {
              // 整体调整坐标居中
              let flowsMid = (this.maxPos - this.minPos) / 2;
              let canvasMid = this.canvas.width / 2;
              let offset = Math.abs(canvasMid - this.minPos);
              d.x += offset - flowsMid;

              let text;
              this.dataArr.nodes.forEach(node => {
                parseInt(node.id) === d.id && (text = node.name);
              });
              // let color =
              //   this.active > idx
              //     ? "#67c23a"
              //     : this.active < idx ? "#666" : "#e6a23c";
              // 生成点渲染数据
              d.id !== 3 &&
                this.dot.push({
                  flag: "step",
                  id: d.id,
                  x: d.x,
                  y: d.y,
                  text: text,
                  bgColor: "#add8e6"
                });
            });
          });
          this.dataArr.sequenceFlows.length &&
            this.initLine(this.dataArr.nodes, this.dataArr.sequenceFlows); // 初始化线
          return;
        }
        this.setNodeX(lastRowIndex);
      }
    },
    // 初始化线
    initLine(opts, flows, firstNode) {
      let from;
      let to;
      if (firstNode) {
        firstNode.forEach(node => {
          let arr = [];
          this.dot.forEach(d => {
            d.id === node && (from = d);
          });
          flows.forEach(flow => {
            if (parseInt(flow.sourceRef) === node) {
              arr.push(parseInt(flow.targetRef));
              this.dot.forEach(d => {
                d.id === parseInt(flow.targetRef) && (to = d);
              });
              if (node !== 3) {
                let fromY = from.y + this.nodeHeight / 2 + 4;
                let toY = to.y - this.nodeHeight / 2 - 4;
                let line = {
                  id: Math.abs(from.id) + 1000 + Math.abs(to.id),
                  fromId: from.id,
                  toId: to.id,
                  fromX: from.x,
                  fromY: fromY,
                  toX: to.x,
                  toY: toY,
                  color: "#666"
                };
                this.line.push(line);
              }
            }
          });
          arr = Array.from(new Set(arr));
          if (!arr.length) {
            // console.log("线计算完成", JSON.stringify(this.line));
            this.initDataFinish = true;
            return;
          }
          this.initLine(opts, flows, arr);
        });
      } else {
        this.line = [];
        firstNode = 3;
        this.initLine(opts, flows, [firstNode]);
      }
    },
    // 画点
    drawdot(ctx, dot, id) {
      // 画出结构
      // console.log("开始画点");
      for (let i = 0; i < dot.length; i++) {
        dot[i].bgColor = "#fec500";
        dot[i].borderColor = "transparent";
        dot[i].textColor = "#333";
      }
      for (let i = 0; i < dot.length; i++) {
        id && id === dot[i].id && (dot[i].borderColor = "#139bd4");
        this.finishNodes.length &&
          this.finishNodes.forEach(d => {
            parseInt(d) === dot[i].id && (dot[i].bgColor = "#67c23a");
          });
        let d = new Step(
          ctx,
          dot[i].flag,
          dot[i].id,
          dot[i].x,
          dot[i].y,
          dot[i].text,
          dot[i].bgColor,
          dot[i].borderColor,
          dot[i].textColor
        );
        d.drawStep();
      }
    },
    // 画线
    drawLine(ctx, line, id) {
      // console.log("开始画线");
      for (let i = 0; i < line.length; i++) {
        line[i].color = "#666";
      }
      for (let i = 0; i < line.length; i++) {
        id && id === line[i].id && (line[i].color = "#139BD4");
        let l = new Arrow(
          ctx,
          line[i].id,
          line[i].fromId,
          line[i].toId,
          line[i].fromX,
          line[i].fromY,
          line[i].toX,
          line[i].toY,
          line[i].color
        );
        l.drawArrow();
      }
    },
    init() {
      this.initData(this.dataArr.nodes, this.dataArr.sequenceFlows);
      this.$emit("input", this.dataArr);
      this.canvas = this.$refs.flowsCanvas;
      this.ctx = this.canvas.getContext("2d");
      this.setCanvasWidth();
      this.canvas.height =
        this.data.length && this.data.length * 100 > 400
          ? this.data.length * 100
          : 398;
    },
    draw(id) {
      if (this.initDataFinish) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawdot(this.ctx, this.dot, id);
        this.line.length && this.drawLine(this.ctx, this.line, id);
      }
    },
    setCanvasWidth() {
      console.log("maxPos:", this.maxPos);
      console.log("flows:", this.$refs.flows.offsetHeight);
      // this.canvas.width = Math.max(...maxPosArr) + 140;
      this.canvas.width =
        this.maxPos < this.$refs.flows.offsetWidth
          ? this.$refs.flows.offsetWidth - 2
          : this.maxPos + 60;
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.init();
      this.draw();
      window.onresize = () => {
        this.init();
        this.draw();
      };
    });
  }
};
</script>

<style lang="scss" scoped>
.flows-group {
  * {
    box-sizing: border-box;
  }
}
.flows {
  position: relative;
  border: 1px solid #aaa;
  z-index: 99;
  width: 100%;
  height: 400px;
  overflow: auto;
}
.flows__canvas {
  position: absolute;
  z-index: 2;
  left: 0;
  top: 0;
}

.flows__handle-next {
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
    top: 2px;
    left: 3px;
    transform: rotate(-45deg);
    transition: transform 0.3s ease-out, top 0.3s ease-out;
  }
}
.flows__handle-edit-textarea {
  position: relative;
  z-index: 100;
  border: 0;
  box-sizing: border-box;
  font-size: 14px;
  outline: none;
  white-space: pre-wrap;
  overflow: hidden;
  height: 17px;
}
.flows__handle-input {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  opacity: 0;
}
</style>
