export default {
  data() {
    return {
      form: {},
      id: 0,
      downPosition: {},
      movePosition: {},
      isLinkMousedown: false,
      isCvsMousedown: false,
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
      editInputStyle: {},
      moveDot: false,
      clickDot: false,
      moveLine: false,
      clickLine: false
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
    inputHandleStyle() {
      let style = {};
      if (!this.activeData.id) return;
      const x = this.activeData.x || this.activeData.fromX;
      const y = this.activeData.y || this.activeData.fromY;
      style.top = y + "px";
      style.left = x + "px";
      return style;
    },
    nextHandleStyle() {
      let style = {};
      if (!this.moveData.flag || this.moveData.flag === 'arrow') return;
      style.top = this.moveData.y + (this.moveData.height - this.nodeHeight) / 2 + 8 + "px";
      style.left = this.moveData.x - 20 + "px";
      return style;
    },
    linkHandleStyle() {
      let style = {};
      if (!this.moveData.flag || this.moveData.flag === 'arrow') return;
      style.top = this.moveData.y + (this.moveData.height - this.nodeHeight) / 2 + 8 + "px";
      style.left = this.moveData.x + 5 + "px";
      return style;
    },
    // 编辑的索引
    editIndex() {
      return this.dataArr.nodes.findIndex(d => parseInt(d.id) === this.activeData.id);
    },
    rows() {
      return this.textRows(this.form.name);
    }
  },
  watch: {
    // 编辑/保存
    isEdit(val) {
      if (val) {
        this.setEditInputStyle();
        this.$nextTick(() => {
          this.$refs.editInput.select();
        });
      } else {
        if (this.dataArr.nodes[this.editIndex].name === this.form.name) return;
        this.inputSave();
      }
    },
    activeData(val) {
      this.$emit("check", val.name);
      this.draw(null, 'click');
      this.$nextTick(() => {
       val.id && this.$refs.input.focus();
      })
    }
  },
  methods: {
    // 编辑时设置文本框位置宽度
    setEditInputStyle() {
      let style = {};
      let width = this.nodeWidth - 20;
      style.width = width + "px";
      style.top = this.activeData.y - this.activeData.height / 2 + 6 + "px";
      style.left = this.activeData.x - width / 2 + "px";
      this.editInputStyle = style;
      this.draw(this.activeData.id);
    },
    // 连接点鼠标按下
    mousedown(e) {
      if (this.readonly) return;
      if (e.button === 0) {
        this.isLinkMousedown = true;
        this.saveData = JSON.parse(JSON.stringify(this.moveData));
      }
    },
    // 画布鼠标按下
    cvsMousedown(e) {
      if (e.button === 0) {
        this.isCvsMousedown = true;
        this.draw(e, 'down');
        this.downPosition = this.getEventPosition(e);
      }
    },
    // 画布鼠标移动
    mousemoveCanvas(e) {
      if (this.isEdit || this.readonly) return;
      this.movePosition = this.getEventPosition(e);
      this.draw(e, 'move');
      !this.moveDot && !this.moveLine && (this.moveData = {
        id: ''
      });
    },
    // 画布鼠标抬起
    mouseup() {
      if (this.readonly) return;
      if (this.isCvsMousedown) {
        this.downPosition = {};
        this.isCvsMousedown = false;
      }
      this.isLinkMousedown = false;
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
          this.$emit('link', {from: this.saveData.name, to: this.moveData.name})
          if (parseInt(this.moveData.id) === -1 && this.fristNodeOnly) {
            this.$info('不能把 首节点 作为子节点!')
          } else {
            this.dataArr.sequenceFlows.push({
              sourceRef: this.saveData.id,
              targetRef: this.moveData.id
            });
            let index = this.dataArr.sequenceFlows.findIndex(d => d.sourceRef === 3 && d.targetRef === this.moveData.id);
            index !== -1 && this.dataArr.sequenceFlows.splice(index, 1);
            this.init();
          }
        } else {
          this.$info(`${this.saveData.name} 与 ${this.moveData.name} 已连接!`)
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
      if (this.readonly) return;
      this.isLinkMousedown = false;
      this.saveData = {
        id: ''
      };
    },
    // 添加/创建
    add(nodeId) {
      this.id = this.nowId;
      --this.id;
      !nodeId && !this.dataArr.firstNodeId &&
        (this.dataArr.firstNodeId = this.id);
      let form = this.copy(this.model);
      form.id = this.id;
      form.name = `NEW ${Math.abs(this.id)}`;
      this.dataArr.sequenceFlows.push({
        sourceRef: nodeId || 3,
        targetRef: this.id
      });
      this.dataArr.nodes.push(form);
      this.$emit("input", this.dataArr);
      this.redraw();
    },
    // 编辑
    edit() {
      if (!this.moveData.id || this.moveData.flag === 'arrow' || this.readonly) return;
      this.form = this.dataArr.nodes.find(d => parseInt(d.id) === this.moveData.id) && this.copy(
        this.dataArr.nodes.find(d => parseInt(d.id) === this.moveData.id)
      );
      this.useInputaEdit && (this.isEdit = true);
      this.$emit('edit', this.form);
    },
    // input 保存
    inputSave() {
      // this.form.name = this.form.name.replace(/\n/g, <br />);
      this.dataArr.nodes.splice(this.editIndex, 1, this.form);;
      this.$emit("input", this.dataArr);
      this.redraw();
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
        if (this.activeData.id === -1 && this.fristNodeOnly) {
          this.$info('首节点不能删除!');
          return;
        }
        this.deleteDot(this.activeData.id);
        this.$emit("delete", this.activeData.name);
      }
      this.activeData = {
        id: ''
      }
      this.moveData = {
        id: ''
      }
      this.$emit("input", this.dataArr);
      this.redraw();
    },
    clickCanvas(e) {
      if (this.isEdit || this.readonly) return;
      this.draw(e, 'click');
      !this.clickDot && !this.clickLine && (this.activeData = {
        id: ''
      });
    },
    getEventPosition(ev) {
      let x, y;
      if (ev.movePositionX || ev.movePositionX == 0) {
        x = ev.movePositionX;
        y = ev.movePositionY;
      } else if (ev.offsetX || ev.offsetX == 0) { // Opera
        x = ev.offsetX;
        y = ev.offsetY;
      }
      return {
        x: x,
        y: y
      };
    },
    copy(obj) {
      return JSON.parse(JSON.stringify(obj));
    },
    textRows(text) {
      let rows = 1;
      if (text) {
        const arrText = text.split('');
        let line = '';

        let positions = [];
        let pos = text.indexOf("\n");
        while (pos > -1) {
          positions.push(pos);
          pos = text.indexOf("\n", pos + 1);
        }

        for (let n = 0; n < arrText.length; n++) {
          const testLine = line + arrText[n];
          const testWidth = this.ctx.measureText(testLine).width + 20;
          if (testWidth > this.nodeWidth && n > 0 || positions.indexOf(n) > -1) {
            rows++;
            line = arrText[n];
          } else {
            line = testLine;
          }
        }
      }
      return rows;
    }
  }
}
