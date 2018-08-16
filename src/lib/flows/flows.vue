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
import Step from "./step.js";
import Arrow from "./arrow.js";
export default {
  name: "flows",
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

      form: this.nodeData ? this.nodeData : { id: 0, name: "NEW 0" },
      id: 0,
      layer: "",
      isMousedown: false,
      saveData: {id: ''},
      moveData: {id: ''},
      activeData: {id: ''},
      isEdit: false,
      editInputStyle: {}
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
      style.top = this.moveData.y + 8 + "px";
      style.left = this.moveData.x - 20 + "px";
      return style;
    },
    linkHandleStyle() {
      // if (!this.moveData.flag) return "";
      let style = {};
      style.top = this.moveData.y + 8 + "px";
      style.left = this.moveData.x + 5 + "px";
      return style;
    },
    // 编辑的索引
    editIndex() {
      return this.dataArr.nodes.findIndex(d => parseInt(d.id) === this.activeData.id);
    }
  },
  watch: {
    'form.name'(val) {
      this.setEditInputStyle();
    },
    // 操作按钮定位
    isEdit(val) {
      if (val) {
        this.setEditInputStyle();
        this.form = this.dataUnBind(
          this.dataArr.nodes.find(d => parseInt(d.id) === this.moveData.id)
        );
        
        // this.$refs.editInput.focus();
        this.$nextTick(() => {
          this.$refs.editInput.select();
        });
      } else {
        if (this.dataArr.nodes[this.editIndex].name === this.form.name) return;
        this.save();
      }
    },
    // 连接线条
    layer(val) {
      if (this.isMousedown) {
        val = val.split("-");
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let l = new Arrow(
          this.ctx,
          null,
          null,
          null,
          this.saveData.x,
          this.saveData.y,
          val[0],
          val[1],
          "#3a8dff"
        );
        // this.draw();// 线在上层
        l.drawArrow();
        this.draw();// 点在上层
      }
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
    // 设置文本框宽度
    setEditInputStyle() {
      let style = {};
      let width;
      let actWidth = this.ctx.measureText(this.activeData.name).width;
      let formWidth = this.ctx.measureText(this.form.name).width;
      if (actWidth > this.nodeWidth - 20) {
        width = formWidth > actWidth ? formWidth : actWidth;
      } else {
        width = formWidth > this.nodeWidth - 20 ? formWidth : this.nodeWidth - 20;
      }
      style.width = width + "px";
      style.top = this.activeData.y - 12 + "px";
      style.left = this.activeData.x - width / 2 + "px";
      this.editInputStyle = style;
      this.draw(this.activeData.id, width + 20);
    },
    // 连接点鼠标按下
    mousedown(ev) {
      if (this.onlyLook) return;
      if (ev.button === 0) {
        this.isMousedown = true;
        this.saveData = JSON.parse(JSON.stringify(this.moveData));
      }
    },
    // 画布鼠标抬起
    mouseup() {
      if (this.onlyLook) return;
      this.isMousedown = false;
      if (
        this.moveData.id &&
        this.saveData.id &&
        this.moveData.id < 1000 &&
        this.saveData.id !== this.moveData.id
      ) {
        if (
          !this.dataArr.sequenceFlows.find(
            d =>
              d.sourceRef === this.saveData.id &&
              d.targetRef === this.moveData.id
          ) &&
          !this.dataArr.sequenceFlows.find(
            d =>
              d.sourceRef === this.moveData.id &&
              d.targetRef === this.saveData.id
          )
        ) {
          this.dataArr.sequenceFlows.push({
            sourceRef: this.saveData.id,
            targetRef: this.moveData.id
          });
          let index = this.dataArr.sequenceFlows.findIndex(d => d.sourceRef === 3 && d.targetRef === this.moveData.id);
          index !== -1 && this.dataArr.sequenceFlows.splice(index, 1);
          this.init();
        }
        this.saveData = {id: ''};
        this.draw();
      } else {
        this.saveData = {id: ''};
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw();
      }
    },
    // 连接点鼠标抬起
    iconMouseup() {
      if (this.onlyLook) return;
      this.isMousedown = false;
      this.saveData = {id: ''};
    },
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
      if (!this.moveData.id || this.onlyLook || !this.useInputaEdit) return;
      this.isEdit = true;
    },
    editInpuFocus(e) {
      e.currentTarget.select();
    },
    editInpuBlur() {
      this.isEdit = false;
    },
    // 删除线
    deleteLine(id) {
      this.dataArr.sequenceFlows.forEach((d, i) => {
        if (
          parseInt(d.sourceRef) === this.activeData.fromId &&
          parseInt(d.targetRef) === this.activeData.toId
        ) {
          this.dataArr.sequenceFlows.splice(i, 1);
          // 如果连接点是孤立的 添加到跟节点
          !this.dataArr.sequenceFlows.find(da => parseInt(da.targetRef) === id)
           && this.dataArr.sequenceFlows.push({
            sourceRef: 3,
            targetRef: parseInt(d.targetRef)
          });
        }
      });
    },
    // 删除点操作
    deleteDot(id) {
      // 删除点
      this.dataArr.nodes.splice(this.dataArr.nodes.findIndex(d => d.id === id), 1);

      // 删除把当前点当目标的线
      for (let i = 0; i < this.dataArr.sequenceFlows.length; i++) {
        if (parseInt(this.dataArr.sequenceFlows[i].targetRef) === id) {
          this.dataArr.sequenceFlows.splice(i, 1);
          i = i - 1;
        }
      }

      // 删除把当前点当来源的线
      let targetArr = [];
      for (let i = 0; i < this.dataArr.sequenceFlows.length; i++) {
        if (this.dataArr.sequenceFlows[i].sourceRef === id) {
          targetArr.push(parseInt(this.dataArr.sequenceFlows[i].targetRef));
          this.dataArr.sequenceFlows.splice(i, 1);
          i = i - 1;
        }
      }

      // 如果连接点是孤立的 添加到跟节点
      targetArr.forEach(target => {
        !this.dataArr.sequenceFlows.find(da => parseInt(da.targetRef) === target)
          && this.dataArr.sequenceFlows.push({
            sourceRef: 3,
            targetRef: parseInt(target)
          });
      })
    },
    // 删除
    deleted() {
      if (this.isEdit) return;
      if (!this.activeData.flag) {
        // 删除线
        this.deleteLine(this.activeData.toId);
      } else {
        // 删除点
        this.deleteDot(this.activeData.id);
      }

      this.$emit("input", this.dataArr);
      this.init();
      this.draw();
    },
    // 保存
    save() {
      this.form.name = this.form.name.replace(/\n/g, "");
      this.dataArr.nodes[this.editIndex] = JSON.parse(
        JSON.stringify(this.form)
      );
      this.$emit("input", this.dataArr);
      this.init();
      this.draw();
      this.isEdit = false;
    },
    // 获取事件所在节点
    clickCanvas() {
      if (this.isEdit || this.onlyLook) return;
      this.activeData = this.moveData;
      this.activeData.id && this.$refs.input.focus();
      this.$emit("update:currentNode", this.activeData);
      this.draw(this.moveData.id);
    },
    mousemoveCanvas(e) {
      if (this.isEdit || this.onlyLook) return;
      var px = e.layerX;
      var py = e.layerY;
      this.layer = `${px}-${py}`;
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
      var offsetW = node.width / 2;
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
