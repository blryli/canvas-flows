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
 * @param {Number} flag选中状态
 */
export default class Arrow {
  constructor(ctx, id, fromId, toId, fromX, fromY, toX, toY, color = '#666', width = 2, theta = 20, headlen = 8) {
    this.ctx = ctx;
    this.id = id;
    this.fromId = fromId;
    this.toId = toId;
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
    this.theta = theta;
    this.headlen = headlen;
    this.width = width;
    this.color = color;
  }

  drawArrow() {
    // 计算各角度和对应的P2,P3坐标
    let angle = Math.atan2(this.fromY - this.toY, this.fromX - this.toX) * 180 / Math.PI;
    let angle1 = (angle + this.theta) * Math.PI / 180;
    let angle2 = (angle - this.theta) * Math.PI / 180;
    let topX = this.headlen * Math.cos(angle1);
    let topY = this.headlen * Math.sin(angle1);
    let botX = this.headlen * Math.cos(angle2);
    let botY = this.headlen * Math.sin(angle2);

    this.ctx.save();
    this.ctx.beginPath();

    let arrowX = this.fromX - topX;
    let arrowY = this.fromY - topY;

    this.ctx.moveTo(arrowX, arrowY);
    this.ctx.moveTo(this.fromX, this.fromY);
    this.ctx.lineTo(this.toX, this.toY);
    if (this.id) {
      arrowX = this.toX + topX;
      arrowY = this.toY + topY;
      this.ctx.moveTo(arrowX, arrowY);
      this.ctx.lineTo(this.toX, this.toY);
      arrowX = this.toX + botX;
      arrowY = this.toY + botY;
      this.ctx.lineTo(arrowX, arrowY);
    }
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = this.width;
    this.ctx.stroke();
    this.ctx.restore();
    return this;
  }
}
