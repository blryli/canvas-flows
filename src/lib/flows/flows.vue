<template>
  <div class="flows-group">
    <div ref="flows" class="flows" :style="{height: height + 'px'}">
      <canvas ref="flowsCanvas" class="flows__canvas" :width="width" :height="height" @mousemove="mousemoveCanvas($event)" @click="clickCanvas" @dblclick="edit" @mouseup="mouseup($event)"></canvas>
      <input class="flows__handle-input" type="text" ref="input" :style="handleStyle" @keyup.delete="deleted">
      <input class="flows__handle-edit-input" v-show="isEdit" v-model="form.name" :style="editInputStyle" @keyup.enter="editInpuBlur($event)" @blur="editInpuBlur($event)" @focus="editInpuFocus($event)" ref="editInput" />
      <i class="flows__handle-next" v-show="moveData.flag && !isEdit && !isMousedown" :style="handleStyle" type="text" @click="next(moveData.id)"></i>
      <i class="flows__handle-link" v-show="moveData.flag && !isEdit && !isMousedown" :style="linkHandleStyle" type="text" @mousedown="mousedown($event)" @mouseup="iconMouseup">-</i>
    </div>
  </div>
</template>

<script>
import Component from './component';
import Step from "./step";
import Arrow from "./arrow";
export default {
  name: "flows",
  mixins: [Component],
  props: {
    value: Object,
    nodeData: Object,
    currentNode: Object,
    onlyLook: {
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
      ctx: "",
      width: 600,
      height: 500,
      minPosArr: [], // 每列最小坐标
      maxPosArr: [], // 每列最大坐标
      isInit: true,
    };
  },
  created() {
    // this.initDataArr();
    this.$nextTick(() => {
      this.canvas = this.$refs.flowsCanvas;
      this.ctx = this.canvas.getContext("2d");
      this.init();
      this.draw();
    });
  },
  computed: {
    minPos() {
      return Math.min(...this.minPosArr);
    },
    maxPos() {
      return Math.max(...this.maxPosArr);
    }
  },
  methods: {
    // 初始化数据
    initDataArr() {
      let noHeadNodes = [];
      this.dataArr.sequenceFlows.forEach(flow => {
        !this.dataArr.sequenceFlows.find(d => d.targetRef === flow.sourceRef) && noHeadNodes.push(flow.sourceRef);
      })
      this.dataArr.nodes.forEach(node => {
        !this.dataArr.sequenceFlows.find(flow => flow.sourceRef === node.id)
          && !this.dataArr.sequenceFlows.find(flow => flow.targetRef === node.id)
          && noHeadNodes.push(node.id)
      })
      noHeadNodes.forEach(d => {
        this.dataArr.sequenceFlows.push({ sourceRef: 3, targetRef: d })
      })
    },
    // 初始化点
    initData(opts, flows, firstNode, row) {
      if (firstNode) {
        let arr = [];
        let targetRef;
        let index;
        row = row || 0;
        row ++;
        firstNode.forEach(node => {
          flows.length &&
            flows.forEach((flow, i) => {
              if (parseInt(flow.sourceRef) === parseInt(node.id)) {
                let isRebel = false;
                // 多级共有连接的点 只保留最后一行的点
                this.data.forEach((da, idx) => {
                  if (idx !== this.data.length - 1 && da.find(d => d.id === flow.targetRef)) {
                    isRebel = true;
                  };
                })
                // 来源相同
                if (!isRebel) {
                  if (targetRef !== parseInt(flow.targetRef)) {
                    if (!arr.find(d => parseInt(d.id) === parseInt(flow.targetRef))) {
                      const id = parseInt(flow.targetRef);
                      const name = node.id === 3 ? 3 : this.dataArr.nodes.find(node => node.id === parseInt(flow.targetRef)).name;
                      const nameWidth = Math.ceil(this.ctx.measureText(name).width);
                      const width = nameWidth + 20 > this.nodeWidth ? nameWidth + 20 : this.nodeWidth;
                      arr.push({
                        id: parseInt(flow.targetRef),
                        name: name,
                        width: width,
                        from: parseInt(flow.sourceRef),
                        row: row
                      });
                      targetRef = parseInt(flow.targetRef);
                      index = i;
                    }
                  } else {
                    // 目标相同
                    !arr[arr.length - 1].froms &&
                      (arr[arr.length - 1].froms = [flows[index].sourceRef]);
                    arr[arr.length - 1].froms.push(parseInt(flow.sourceRef));
                    arr[arr.length - 1].from !== null &&
                      (arr[arr.length - 1].from = null);
                  }
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
        firstNode = [{ id: 3 , name: 3}];
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
      this.getNodeTos();
      this.addPosNodes();
      this.setNodeX();
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
                // d.froms.indexOf(da.id) !== -1 && tos.push(d.id);
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
          // console.log(
          //   `当前 ${lastRowIndex} 行按来源进行分组rowGArr：` +
          //     JSON.stringify(rowGArr)
          // );
          // 当前行节点来源
          let fromArr = [];
          this.data[lastRowIndex].forEach(d => {
            d.froms ? fromArr.push(d.froms) : fromArr.push(d.from);
          });
          fromArr = Array.from(new Set(fromArr));
          // console.log(
          //   `当前 ${lastRowIndex} 行节点来源fromArr：` + JSON.stringify(fromArr)
          // );

          // 来源在上一行的位置
          let fromIndexArr = [];
          let fromatArr = [].concat.apply([], fromArr);
          this.data[lastRowIndex - 1].forEach((da, idx) => {
            fromatArr.forEach(d => {
              da.id === d && fromIndexArr.push(idx);
            });
          });
          fromIndexArr = Array.from(new Set(fromIndexArr));
          // console.log(
          //   `${lastRowIndex} 行来源在上一行的位置fromIndexArr` +
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
                      let prevNode = this.data[lastRowIndex][i - 1]; // 上一个节点
                      if (!prevNode) return;
                      // console.log("prevNode: " + JSON.stringify(prevNode));
                      let prevNodeX = prevNode.x; // 上一个节点坐标
                      // if (prevNode.froms) {
                      //   let len = prevNode.froms.length - 1;
                      //   prevNodeX += (this.nodeWidth + this.offsetX) * len;
                      // }
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
          // console.log(
          //   `当前 ${lastRowIndex} 行分组 的值x：` + JSON.stringify(nodeArr)
          // );
          // console.log(
          //   `当前 ${lastRowIndex} 节点数组rowGArr：` + JSON.stringify(rowGArr：)
          // );
          let MinArr = []; // 最小点数组
          rowGArr.forEach(d => {
            MinArr.push(d[0]);
          });
          let MaxArr = []; // 最大点数组
          rowGArr.forEach((d, i) => {
            let max = d[d.length - 1];
            // fromArr[i].length > 1 &&
            //   (max += this.nodeWidth + this.offsetX) * (fromArr[i].length - 1);
            MaxArr.push(max);
          });
          // console.log(`当前 ${lastRowIndex} 行最大点数组MaxArr: ` + MaxArr);

          // 计算上一行的节点x
          let moreArr = [];
          let moreStart = 0;
          let morelength = 0;
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
              d.x = Math.ceil(d.x);

              let name;
              this.dataArr.nodes.forEach(node => {
                parseInt(node.id) === d.id && (name = node.name);
              });

              // 生成点渲染数据
              if (d.id !== 3) {
                d.pos && (name = d.name);
                !d.pos &&
                this.dot.push({
                  flag: "step",
                  id: d.id,
                  name: name,
                  x: d.x,
                  y: d.y,
                  width: d.width,
                  bgColor: "#add8e6"
                });
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
        if (flow.sourceRef === 3) return;
        let from = this.dot.find(d => d.id === parseInt(flow.sourceRef));
        let to = this.dot.find(d => d.id === parseInt(flow.targetRef));
        let fromY = from.y + this.nodeHeight / 2 + 4;
        let toY = to.y - this.nodeHeight / 2 - 4;
        let line = {
          id: Math.abs(from.id) + 1000 + "-" + Math.abs(to.id),
          fromId: from.id,
          toId: to.id,
          fromX: from.x,
          fromY: fromY,
          toX: to.x,
          toY: toY,
          color: "#666"
        };
        this.line.push(line);
      })
    },
    // 画点
    drawdot(ctx, dot, id, editInputWidth) {
      // 画出结构
      // console.log("开始画点");
      for (let i = 0; i < dot.length; i++) {
        dot[i].bgColor = "#fec500";
        dot[i].borderColor = "transparent";
        dot[i].textColor = "#333";
      }
      for (let i = 0; i < dot.length; i++) {
        if (dot[i].pos) break;
        id && id === dot[i].id && (dot[i].borderColor = "#139bd4");
        dot[i].id === this.saveData.id && (dot[i].borderColor = "#fc06fc");
        this.isMousedown &&
          dot[i].id === this.moveData.id &&
          (dot[i].borderColor = "#fc06fc");
        this.onlyLook && this.finishNodes.length &&
          this.finishNodes.forEach(d => {
            parseInt(d) === dot[i].id && (dot[i].bgColor = "#67c23a");
          });
        editInputWidth > this.nodeWidth && dot[i].id === this.activeData.id && (dot[i].width = editInputWidth);
        let d = new Step(
          ctx,
          dot[i].flag,
          dot[i].id,
          dot[i].name,
          dot[i].x,
          dot[i].y,
          dot[i].width,
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
      this.setCanvasWidth();
      this.canvas.height =
        this.data.length && this.data.length * 100 > this.height
          ? this.data.length * 100
          : this.height - 2;
    },
    draw(id, editInputWidth) {
        !this.isMousedown &&
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawdot(this.ctx, this.dot, id, editInputWidth);
        this.line.length && this.drawLine(this.ctx, this.line, id);
    },
    setCanvasWidth() {
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
      }
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
  width: 18px;
  height: 18px;
  color: #fff;
  border-radius: 50%;
  border: 1px solid #139bd4;
  background-color: #139bd4;
  cursor: pointer;
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
.flows__handle-edit-input {
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
