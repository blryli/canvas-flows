export default {
  methods: {
    Step(x, y, w = 100, name, bgColor = "#add8e6", borderColor = "transparent", textColor = "#000", h = 30) {
      this.ctx.fillStyle = bgColor;
      this.ctx.lineWidth = 2.2;
      this.ctx.strokeStyle = borderColor;
      this.ctx.font = "14px Helvetica bold";
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(x - w / 2, y - h / 2, w, h);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = textColor;
      this.ctx.fillText(name, x, y);
    },
    Round(x, y, r = 50, name, bgColor = "#add8e6", borderColor = "transparent", textColor = "#000") {
      this.ctx.fillStyle = bgColor;
      this.ctx.lineWidth = 2.2;
      this.ctx.strokeStyle = borderColor;
      this.ctx.font = "14px Helvetica bold";
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, 2 * Math.PI);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.fillStyle = textColor;
      this.ctx.fillText(name, x, y);
    },
    /**
     * 箭头对象
     * @param {Object} ctxCanvas绘图环境
     * @param {Number} fromId起始点id
     * @param {Number} fromId结束点id
     * @param {Number} fromX起始点横坐标
     * @param {Number} fromY起始点纵坐标
     * @param {Number} toX结束点横坐标
     * @param {Number} toY结束点纵坐标
     * @param {String} color箭头颜色
     * @param {Number} width箭头线宽度
     * @param {Number} theta三角斜边一直线夹角
     * @param {Number} headlen三角斜边长度
     */
    Arrow(fromX, fromY, toX, toY, color = '#666', isTheta, width = 2, theta = 20, headlen = 8) {
      // 计算各角度和对应的P2,P3坐标
      let angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI;
      let angle1 = (angle + theta) * Math.PI / 180;
      let angle2 = (angle - theta) * Math.PI / 180;
      let topX = headlen * Math.cos(angle1);
      let topY = headlen * Math.sin(angle1);
      let botX = headlen * Math.cos(angle2);
      let botY = headlen * Math.sin(angle2);
      this.ctx.save();
      this.ctx.beginPath();
      let arrowX = fromX - topX;
      let arrowY = fromY - topY;
      this.ctx.moveTo(arrowX, arrowY);
      this.ctx.moveTo(fromX, fromY);
      this.ctx.lineTo(toX, toY);
      if (isTheta === undefined || isTheta === true) {
          arrowX = toX + topX;
          arrowY = toY + topY;
          this.ctx.moveTo(arrowX, arrowY);
          this.ctx.lineTo(toX, toY);
          arrowX = toX + botX;
          arrowY = toY + botY;
          this.ctx.lineTo(arrowX, arrowY);
      }
      this.ctx.closePath();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;
      this.ctx.stroke();
      this.ctx.restore();
    }
  }
}
