export default {
  data() {
    return {
      form: this.nodeData ? this.nodeData : {
        id: 0,
        name: "NEW 0"
      },
      id: 0,
      layer: "",
      isMousedown: false,
      saveData: {
        id: ''
      },
      moveData: {
        id: ''
      },
      activeData: {
        id: ''
      },
      isEdit: false,
      editInputStyle: {}
    }
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
    'form.name' () {
      this.setEditInputStyle();
    },
    // 操作按钮定位
    isEdit(val) {
      if (!this.useInputaEdit) return;
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
    // 拖动时显示线条
    layer(val) {
      if (this.isMousedown) {
        val = val.split("-");
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.Arrow(
          this.saveData.x,
          this.saveData.y,
          val[0],
          val[1],
          "#3a8dff",
          false
        );
        this.draw(); // 画线时点在上层
      }
    }
  },
  methods: {
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
        if (!this.dataArr.sequenceFlows.find(
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
          if (parseInt(this.moveData.id) === -1) {
            this.errorShow = true;
            setTimeout(() => {
              this.errorShow = false;
            }, 1000)
          } else {
            this.dataArr.sequenceFlows.push({
              sourceRef: this.saveData.id,
              targetRef: this.moveData.id
            });
            let index = this.dataArr.sequenceFlows.findIndex(d => d.sourceRef === 3 && d.targetRef === this.moveData.id);
            index !== -1 && this.dataArr.sequenceFlows.splice(index, 1);
            this.init();
          }
        }
        this.saveData = {
          id: ''
        };
        this.draw();
      } else {
        this.saveData = {
          id: ''
        };
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw();
      }
    },
    // 连接点鼠标抬起
    iconMouseup() {
      if (this.onlyLook) return;
      this.isMousedown = false;
      this.saveData = {
        id: ''
      };
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
      if (!this.moveData.id || this.onlyLook) return;
      this.$emit('edit', this.moveData.id)
      this.useInputaEdit && (this.isEdit = true);
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
          !this.dataArr.sequenceFlows.find(da => parseInt(da.targetRef) === id) &&
            this.dataArr.sequenceFlows.push({
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
        !this.dataArr.sequenceFlows.find(da => parseInt(da.targetRef) === target) &&
          this.dataArr.sequenceFlows.push({
            sourceRef: 3,
            targetRef: parseInt(target)
          });
      })
    },
    // 删除
    deleted() {
      if (this.isEdit) return;
      if (this.activeData.flag === 'arrow') {
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
    clickCanvas(e) {
      if (this.isEdit || this.onlyLook) return;
      this.activeData = this.moveData;
      this.activeData.id && this.$refs.input.focus();
      this.$emit("update:currentNode", this.activeData);
      this.drawLine(e);
      this.draw(e);
    },
    mousemoveCanvas(e) {
      if (this.isEdit || this.onlyLook) return;
      var px = e.layerX;
      var py = e.layerY;
      this.layer = `${px}-${py}`;
      this.moveData = {
        id: ""
      };
      // 逐条线确定是否有点中
      var offset = 5; // 可接受（偏移）范围
      this.dot.forEach(d => {
        this.inStep(px, py, d) && this.moveData !== d && (this.moveData = d);
      });
      for (var i = 0; i < this.line.length; i++) {
        var p1 = {
          x: this.line[i].fromX,
          y: this.line[i].fromY
        }; // 直线起点
        var p2 = {
          x: this.line[i].toX,
          y: this.line[i].toY
        }; // 直线终点
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

            var p = {
              x: px,
              y: p1.y + y
            }; // 直线上的交叉点
            if (Math.abs(px - p.x) <= offset && Math.abs(py - p.y) <= offset) {
              this.moveData = this.line[i]; // 1 - 点中
            }
          }
        }
      }
    },
    getEventPosition(ev){
      var x, y;
      if (ev.layerX || ev.layerX == 0) {
        x = ev.layerX;
        y = ev.layerY;
      } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        x = ev.offsetX;
        y = ev.offsetY;
      }
      return {x: x, y: y};
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
    }
  }
}
