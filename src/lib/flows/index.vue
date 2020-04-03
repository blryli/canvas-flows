<template>
  <div class="flows-group">
    <div ref="flows" class="flows" :style="{height: height + 'px', '--lineHeight': lineHeight}">
      <canvas ref="flowsCanvas" class="flows__canvas" :width="width" :height="height" @mousemove="mousemoveCanvas($event)" @click="clickCanvas" @dblclick="edit" @mousedown="cvsMousedown($event)" @mouseup="mouseup($event)"></canvas>
      <input class="flows__handle-input" type="text" ref="input" :style="inputHandleStyle" @keyup.delete="deleted">
      <textarea class="flows__handle-edit-textarea" cols="10" :rows="rows" v-show="useInputaEdit && isEdit" v-model="form.name" :style="editInputStyle" @blur="editInpuBlur($event)" @focus="editInpuFocus($event)" ref="editInput"></textarea>
      <i class="flows__handle-next" v-show="moveData.flag && moveData.flag !== 'arrow' && !isEdit && !isLinkMousedown" :style="nextHandleStyle" type="text" @click="add(moveData.id)"></i>
      <i class="flows__handle-link" v-show="moveData.flag && moveData.flag !== 'arrow' && !isEdit && !isLinkMousedown" :style="linkHandleStyle" type="text" @mousedown="mousedown($event)" @mouseup="iconMouseup"></i>
    </div>
    <!-- <p>moveData: {{moveData}}</p>
    <p>activeData: {{activeData}}</p>
    <p>saveData: {{saveData}}</p> -->
  </div>
</template>

<script>
import Handle from "./handle";
import Graph from "./graph";
import { on, off } from "../../utils/dom";

export default {
  name: "Flows",
  mixins: [Handle, Graph],
  props: {
    value: {
      type: Object,
      default: () => {}
    },
    model: {
      type: Object,
      default: () => {}
    },
    readonly: {
      type: Boolean,
      default: false
    },
    useInputaEdit: {
      type: Boolean,
      default: true
    },
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
      default: 32
    },
    offsetX: {
      type: Number,
      default: 12
    },
    offsetY: {
      type: Number,
      default: 80
    },
    fristNodeOnly: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      data: [], // 渲染结构
      dot: [], // 点数组
      line: [], // 线条数组
      canvas: "",
      ctx: "",
      width: 600,
      height: 500,
      lineHeight: 16,
      minPosArr: [], // 每列最小坐标
      maxPosArr: [], // 每列最大坐标
      isInit: false,
      errorShow: false,
      pointOffset: {x: 0, y: 0}
    };
  },
  created() {
    // this.initDataArr();
    this.$nextTick(() => {
      this.canvas = this.$refs.flowsCanvas;
      this.ctx = this.canvas.getContext("2d");
    });
  },
  watch: {
    value(val) {
      if (val && !this.isInit) {
        this.redraw();
        this.isInit = true;
      }
    }
  },
  computed: {
    minPos() {
      return Math.min(...this.minPosArr);
    },
    maxPos() {
      return Math.max(...this.maxPosArr);
    },
    dataArr() {
      return this.value;
    },
    hasData() {
      return (
        this.dataArr &&
        this.dataArr.nodes &&
        this.dataArr.nodes.length &&
        this.dataArr.sequenceFlows &&
        this.dataArr.sequenceFlows.length
      );
    }
  },
  methods: {
    // 初始化数据
    initDataArr() {
      if (!this.hasData) return;
      let noHeadNodes = [];
      this.dataArr.sequenceFlows.forEach(flow => {
        !this.dataArr.sequenceFlows.find(
          d => parseInt(d.targetRef) === parseInt(flow.sourceRef)
        ) && noHeadNodes.push(flow.sourceRef);
      });
      this.dataArr.nodes.forEach(node => {
        !this.dataArr.sequenceFlows.find(
          flow => parseInt(flow.sourceRef) === parseInt(node.id)
        ) &&
          !this.dataArr.sequenceFlows.find(
            flow => parseInt(flow.targetRef) === parseInt(node.id)
          ) &&
          noHeadNodes.push(node.id);
      });
      noHeadNodes.length &&
        noHeadNodes.forEach(d => {
          this.dataArr.sequenceFlows.push({ sourceRef: 3, targetRef: d });
        });
      noHeadNodes.length && this.$emit("input", this.dataArr);
    },
    // 初始化点
    initData(opts, flows, firstNode, row) {
      if (firstNode) {
        let arr = [];
        row++;
        firstNode.forEach(node => {
          flows &&
            flows.length &&
            flows.forEach((flow, i) => {
              if (parseInt(flow.sourceRef) === parseInt(node.id)) {
                // 来源相同
                  if (
                    !arr.find(
                      d => parseInt(d.id) === parseInt(flow.targetRef)
                    )
                  ) {
                    const id = parseInt(flow.targetRef);
                    const target = this.dataArr.nodes.find(
                      node => parseInt(node.id) === parseInt(flow.targetRef)
                    );
                    const name = node.id === 3 ? 3 : target.name;
                    const nameWidth = Math.ceil(
                      this.ctx.measureText(name).width
                    );
                    arr.push({
                      id: id,
                      name: name,
                      width: nameWidth,
                      from: parseInt(flow.sourceRef)
                    });
                  }
              }
            });
        });
        if (!arr.length) {
          // 初始化点完成
          // console.log('初始化点完成');
          this.dataUniq(this.data);
          this.countDotCoord(); // 计算点坐标
          return;
        }
        this.data.push(arr);
        this.initData(opts, flows, arr, row);
      } else {
        this.data = [];
        firstNode = [{ id: 3, name: 3 }];
        this.data.push(firstNode);
        this.initData(opts, flows, firstNode);
      }
    },
    // 数据去重
    dataUniq(data, lastRowIndex) {
      if (data.length > 1) {
        if (lastRowIndex < 1) return;
        lastRowIndex = lastRowIndex || data.length - 1;
        data[lastRowIndex].forEach(d => {
          data.forEach((da, idx) => {
            if (idx < lastRowIndex) {
              da.findIndex(a => a.id === d.id) !== -1 &&
                da.splice(da.findIndex(a => a.id === d.id), 1);
            }
          });
        });
        lastRowIndex--;
        this.dataUniq(data, lastRowIndex);
      }
    },
    // 计算点坐标
    countDotCoord() {
      // 设置初始x坐标和y坐标
      this.data.forEach((da, idx) => {
        const len = this.data.length - 1;
        da.forEach(d => {
          const y = idx * this.offsetY - this.nodeHeight;
          const x = this.nodeWidth + this.offsetX;
          d.x = x;
          d.y = y;
        });
      });

      // 计算x坐标
      this.minPosArr = [];
      this.maxPosArr = [];

      this.getNodeTos();
      this.addPosNodes();
      this.setNodeX();
    },
    // 设置目标点
    getNodeTos(lastRowIndex, fromIndexArr) {
      if (this.data.length > 1) {
        // 设置最后一行 为坐标计算起始行
        let index = (lastRowIndex = lastRowIndex || this.data.length - 1);
        fromIndexArr = fromIndexArr || [];

        if (lastRowIndex > 0) {
          // 当前行按来源进行分组：
          let rowGArr = [];
          let rowIdArr = [];
          this.data[lastRowIndex].forEach(da => {
            rowIdArr.push(da.id);
          });
          let nowRowArr = this.data[lastRowIndex];
          let n = 0;
          for (let i = 0; i < nowRowArr.length; i++) {
            if (
              !nowRowArr[i + 1] ||
              (nowRowArr[i + 1] && nowRowArr[i].from !== nowRowArr[i + 1].from)
            ) {
              rowGArr.push(rowIdArr.slice(n, i + 1));
              n = i + 1;
            }
          }
          // 当前行节点来源
          let fromArr = [];
          this.data[lastRowIndex].forEach(d => {
            d.froms ? fromArr.push(d.froms) : fromArr.push(d.from);
          });
          fromArr = Array.from(new Set(fromArr));

          // 来源在上一行的位置
          fromIndexArr = [];
          let fromatArr = [].concat.apply([], fromArr);
          this.data[lastRowIndex - 1].forEach((da, idx) => {
            let tos = [];
            this.data[lastRowIndex].forEach(d => {
              if (d.froms) {
                d.froms.forEach((d1, i1) => {
                  i1 === 0 && d1;
                });
                d.froms[0] === da.id && tos.push(d.id);
              } else {
                d.from === da.id && tos.push(d.id);
              }
            });
            da.tos = tos;
            fromatArr.forEach(d => {
              da.id === d && fromIndexArr.push(idx);
            });
          });
        }
        lastRowIndex--;
        if (lastRowIndex === index || lastRowIndex === 0) return;
        this.getNodeTos(lastRowIndex, fromIndexArr);
      }
    },
    // 添加占位节点
    addPosNodes() {
      this.data.forEach((da, idx) => {
        if (idx === 0) return;
        let index = 0;
        da.forEach((d, i) => {
          if (!d.tos) return;
          if (d.tos.length) {
            index += d.tos.length;
          } else {
            let id = d.id < 0 ? 10000 - d.id : d.id + 10000;
            let obj = {
              id: id,
              pos: true,
              name: d.name,
              width: d.width,
              from: d.id,
              x: d.x,
              y: d.y + this.offsetY,
              tos: []
            };
            this.data[idx + 1] && this.data[idx + 1].splice(index, 0, obj);
            index++;
          }
        });
      });
    },
    // 从最后一行递归设置每一行的x坐标
    setNodeX(lastRowIndex) {
      if (this.data.length > 1) {
        // 设置最后一行 为坐标计算起始行
        let index = (lastRowIndex = lastRowIndex || this.data.length - 1);

        if (lastRowIndex > 0) {
          // 当前行按来源进行分组：
          let rowGArr = [];
          let rowIdArr = [];
          this.data[lastRowIndex].forEach(da => {
            rowIdArr.push(da.id);
          });
          let nowRowArr = this.data[lastRowIndex];
          let n = 0;
          for (let i = 0; i < nowRowArr.length; i++) {
            if (
              !nowRowArr[i + 1] ||
              (nowRowArr[i + 1] && nowRowArr[i].from !== nowRowArr[i + 1].from)
            ) {
              rowGArr.push(rowIdArr.slice(n, i + 1));
              n = i + 1;
            }
          }
          // 当前行节点来源
          let fromArr = [];
          this.data[lastRowIndex].forEach(d => {
            d.froms ? fromArr.push(d.froms) : fromArr.push(d.from);
          });
          fromArr = Array.from(new Set(fromArr));

          // 来源在上一行的位置
          let fromIndexArr = [];
          let fromatArr = [].concat.apply([], fromArr);
          this.data[lastRowIndex - 1].forEach((da, idx) => {
            fromatArr.forEach(d => {
              da.id === d && fromIndexArr.push(idx);
            });
          });
          fromIndexArr = Array.from(new Set(fromIndexArr));

          // 最后一行节点x
          if (lastRowIndex === this.data.length - 1) {
            for (let i = 0; i < rowGArr.length; i++) {
              rowGArr[i].forEach((da, idx) => {
                if (i === 0) {
                  // 确定第一个分组的坐标
                  this.data[lastRowIndex].forEach((d, i) => {
                    da === d.id && (d.x = (this.nodeWidth + this.offsetX) * (idx + 1));
                  });
                } else {
                  let offsetNum = fromIndexArr[i] - fromIndexArr[i - 1]; // 偏移量
                  this.data[lastRowIndex].forEach((d, i) => {
                    if (da === d.id) {
                      let prevNode = this.data[lastRowIndex][i - 1]; // 上一个节点
                      if (!prevNode) return;
                      let prevNodeX = prevNode.x; // 上一个节点坐标
                      d.x =
                        idx === 0
                          ? prevNodeX +
                            (this.nodeWidth + this.offsetX) * offsetNum
                          : prevNodeX + this.nodeWidth + this.offsetX;
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
          let nodeArr = []; // 节点数组
          rowGArr.forEach(d => {
            nodeArr.push((d[0] + d[d.length - 1]) / 2);
          });
          let MinArr = []; // 最小点数组
          rowGArr.forEach(d => {
            MinArr.push(d[0]);
          });
          let MaxArr = []; // 最大点数组
          rowGArr.forEach((d, i) => {
            let max = d[d.length - 1];
            MaxArr.push(max);
          });

          // 计算上一行的节点x
          for (let i = 0; i < fromIndexArr.length; i++) {
            this.data[lastRowIndex - 1].forEach((da, idx) => {
              if (idx < fromIndexArr[i]) {
                // 在来源节点左侧
                if (fromIndexArr.indexOf(idx) !== -1) return;
                let num = fromIndexArr[i] - idx; // 间隔数
                da.x = MinArr[i] - (this.nodeWidth + this.offsetX) * num;

                // 在来源节点中点
              } else if (idx === fromIndexArr[i]) {
                fromArr.forEach((fromD, fromI) => {
                  if (typeof fromD === "number") {
                    da.id === fromD && (da.x = nodeArr[fromI]);
                  } else {
                    fromD.forEach((fD, fI) => {
                      if (da.id === fD) {
                        if (fromD.length === 1) {
                          da.x = nodeArr[fromI];
                        } else {
                          da.x =
                            nodeArr[fromI] +
                            (this.nodeWidth + this.offsetX) * fI;
                        }
                      }
                    });
                  }
                });
              } else {
                // 在来源点右侧
                if (fromIndexArr.indexOf(idx) !== -1) return;
                let num = Math.abs(idx - fromIndexArr[i]); // 间隔数
                da.x = MaxArr[i] + (this.nodeWidth + this.offsetX) * num;
              }
            });
          }
          lastRowIndex--;
        } else return;
        if (lastRowIndex === index || lastRowIndex === 0) {
          // x坐标计算完成
          // console.log("点坐标计算完成", JSON.stringify(this.data));
          this.dot = [];
          let fristNodeHeight = this.nodeHeight;
          this.setCanvasWidth();
          this.data.forEach((da, idx) => {
            da.forEach((d, i) => {
              if (this.$refs.flows && this.maxPos > this.canvas.width) {
                d.x -= this.nodeWidth / 2;
              } else {
                // 整体坐标居中
                const flowsMid = (this.maxPos - this.minPos) / 2;
                const canvasMid = this.canvas.width / 2;
                d.x += Math.ceil(canvasMid - this.minPos - flowsMid);
                this.pointOffset.x = Math.ceil(canvasMid - this.minPos - flowsMid);
              }
              const node = this.dataArr.nodes.find(node => parseInt(node.id) === d.id);
              let name = node && node.name;
              const width = this.nodeWidth;
              let height = d.height = name && this.nodeHeight + (this.textRows(name) - 1) * this.lineHeight;
              d.id === -1 && d.height > this.nodeHeight && (fristNodeHeight = d.height);
              fristNodeHeight && (d.y += (fristNodeHeight - this.nodeHeight) / 2);
              // 生成点渲染数据
              if (d.id !== 3) {
                d.pos && (name = d.name);
                if (!d.pos) {
                  this.dot.push({flag: "roundRect",id: d.id,name: name,x: d.x,y: d.y,width: width,height: height,tos: d.tos});
                }
              }
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
    initLine() {
      this.line = [];
      this.dataArr.sequenceFlows.forEach(flow => {
        let from = this.dot.find(d => d.id === parseInt(flow.sourceRef));
        let to = this.dot.find(d => d.id === parseInt(flow.targetRef));
        if (flow.sourceRef === 3 || !from || !to) return;
        let fromY = from.y + from.height / 2;
        let toY = to.y - to.height / 2;
        let line = {
          flag: "arrow",
          id: Math.abs(from.id) + 1000 + "-" + Math.abs(to.id),
          fromId: from.id,
          toId: to.id,
          fromX: from.x,
          fromY: fromY,
          toX: to.x,
          toY: toY,
          tos: from.tos
        };
        this.line.push(line);
      });
    },
    // 画点
    drawdot(e, event) {
      // console.log("开始画点");
      this.dot.forEach(d => {
        if (d.id === -1) {
          d.bgColor = "#FF794B";
          d.borderColor = "transparent";
          d.textColor = "#333";
        } else {
          d.bgColor = "#fec500";
          d.borderColor = "transparent";
          d.textColor = "#333";
        }
      });
      this.moveDot = false;
      this.clickDot = false;
      this.dot.forEach(d => {
        if (d.pos) return;
        this.activeData.id && this.activeData.id === d.id && (d.borderColor = "#139bd4");
        d.id === this.saveData.id && (d.borderColor = "#fc06fc");
        this.isLinkMousedown &&
          d.id === this.moveData.id &&
          (d.borderColor = "#fc06fc");
        this.finishNodes.length &&
          this.finishNodes.forEach(o => {
            parseInt(o) === d.id && (d.bgColor = "#67c23a");
          });
        this.RoundRect(d.x, d.y, d.width, d.height, d.name, 4, d.bgColor, d.borderColor, d.textColor, this.lineHeight);
        const p = e && this.getEventPosition(e);
        if (p && event && this.ctx.isPointInPath(p.x, p.y)) {
          if (event === "move") {
            this.moveData = d;
            this.moveDot = true;
          } else if (event === "click") {
            this.activeData = d;
            this.clickDot = true;
            this.downPosition = this.getEventPosition(e);
          } else if (event === "down") {
            this.activeData = d;
            this.clickDot = true;
          }
        }
      });
    },
    // 画线
    drawLine(e, event, color) {
      // console.log("开始画线");
      this.line.forEach(d => {
        d.color = '#666';
        d.activeColor = "transparent";
      });
      this.moveLine = false;
      this.clickLine = false;
      this.line.forEach(d => {
        this.activeData.id && this.activeData.id === d.id && (d.activeColor = "#139BD4");
        this.Arrow(d.fromX, d.fromY, d.toX, d.toY, d.tos, d.color, d.activeColor);
        const p = e && this.getEventPosition(e);
        if (
          p &&
          event &&
          (this.ctx.isPointInPath(p.x, p.y) || this.ctx.isPointInStroke(p.x, p.y))
        ) {
          if (event === "move") {
            this.moveData = d;
            this.moveLine = true;
          } else if (event === "click") {
            this.activeData = d;
            this.clickLine = true;
          } else if (event === "down") {
            this.activeData = d;
            this.clickDot = true;
          }
        }
      });
      if (this.isLinkMousedown) {
        this.Line(
          this.saveData.x,
          this.saveData.y,
          this.movePosition.x,
          this.movePosition.y,
          "#3a8dff"
        );
      }
    },
    init() {
      this.initData(this.dataArr.nodes, this.dataArr.sequenceFlows);
      this.$emit("input", this.dataArr);
      this.setCanvasHeight();
    },
    draw(e, event) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.dot.length && this.drawdot(e, event);
      this.drawLine(e, event);
    },
    redraw() {
      if (!this.hasData) return;
      this.init();
      this.draw();
    },
    setCanvasWidth() {
      if (!this.$refs.flows) return;
      if (this.maxPos > this.$refs.flows.offsetWidth) {
        this.canvas.width = this.maxPos + this.offsetX;
        this.$refs.flows.style.overflowX = 'auto';
      } else {
        this.canvas.width = this.$refs.flows.offsetWidth - 2;
        this.$refs.flows.style.overflowX = 'hidden';
      }
    },
    setCanvasHeight() {
      if (!this.$refs.flows) return;
      const lastNode = this.data[this.data.length - 1].find(d => !d.pos);
      const lastY = lastNode.y + lastNode.height / 2;
      if (lastY > this.height) {
        this.canvas.height = lastY + this.offsetY / 2;
        this.$refs.flows.style.overflowY = 'auto';
      } else {
        this.canvas.height = this.height - 2;
        this.$refs.flows.style.overflowY = 'hidden';
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.redraw();
      on(window, "resize", this.redraw);
    });
  },
  destroyed() {
    off(window, "resize", this.redraw);
  }
};
</script>

<style lang="scss" scoped>
.flows-group {
  position: relative;
  * {
    box-sizing: border-box;
  }
}
.flows {
  position: relative;
  border: 1px solid #aaa;
  z-index: 99;
  width: 100%;
  i {
    font-family: "Microsoft YaHei", "\5FAE\8F6F\96C5\9ED1", Arial, sans-serif;
  }
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
  width: 18px;
  height: 18px;
  color: #fff;
  border-radius: 50%;
  border: 1px solid #139bd4;
  background-color: #139bd4;
  cursor: pointer;
  user-select: none;
  &::before {
    content: "";
    display: block;
    width: 5px;
    height: 5px;
    border-left: 2px #fff solid;
    border-bottom: 2px #fff solid;
    position: absolute;
    top: 3px;
    left: 4px;
    transform: rotate(-45deg);
    transition: transform 0.3s ease-out, top 0.3s ease-out;
  }
}
.flows__handle-link {
  z-index: 100;
  position: absolute;
  top: 0;
  left: 0;
  padding: 0px;
  width: 18px;
  height: 18px;
  line-height: 11px;
  color: #fff;
  border-radius: 50%;
  font-size: 20px;
  font-weight: bold;
  border: 1px solid #139bd4;
  background-color: #139bd4;
  cursor: pointer;
  user-select: none;
  &::before{
    content: "";
    display: block;
    position: absolute;
    top: 6px;
    left: 3px;
    width: 5px;
    height: 1.6px;
    background-color: #fff;
  }
  &::after {
    content: "";
    display: block;
    width: 4px;
    height: 4px;
    border-right: 1.6px #fff solid;
    border-bottom: 1.6px #fff solid;
    position: absolute;
    top: 4px;
    right: 4px;
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
  padding: 1px;
  outline: none;
  word-wrap:break-word;
  line-height: var(--lineHeight + 'px');
  overflow: auto;
}
.flows__handle-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  z-index: 0;
  opacity: 0;
}
</style>
