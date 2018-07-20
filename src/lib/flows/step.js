/**
 * 矩形步骤对象
 * @param {Object} ctx
 * @param {Object} x
 * @param {Object} x
 * @param {Object} t
 * @param {Object} w
 * @param {Object} h
 */
export default class step {
  constructor(ctx, flag, id, x, y, t, color = "red", textColor = "#666", w = 100, h = 36) {
    this.flag = flag;
    this.id = id;
    this.h = h;
    this.w = w;
    this.x = x;
    this.y = y;
    this.t = t;
    this.t = t;
    this.ctx = ctx;
    this.color = color;
    this.textColor = textColor;
  }
  drawStep() {
    this.ctx.strokeStyle = this.color;
    this.ctx.fillStyle = this.textColor;
    this.ctx.font = "16px Helvetica bold";
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.strokeRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    this.ctx.fillText(this.t, this.x, this.y);
  }
}
