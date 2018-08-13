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
  constructor(ctx, flag, id, name, x, y, bgColor = "#add8e6", borderColor = "transparent", textColor = "#000", w = 100, h = 30) {
    this.flag = flag;
    this.id = id;
    this.name = name;
    this.h = h;
    this.w = w;
    this.x = x;
    this.y = y;
    this.ctx = ctx;
    this.bgColor = bgColor;
    this.borderColor = borderColor;
    this.textColor = textColor;
  }
  drawStep() {
    // this.ctx.strokeStyle = this.color;
    this.ctx.fillStyle = this.bgColor;
    this.ctx.lineWidth = 2.2;
    this.ctx.strokeStyle = this.borderColor;
    this.ctx.font = "14px Helvetica bold";
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    this.ctx.strokeRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    this.ctx.fillStyle = this.textColor;
    this.ctx.fillText(this.name, this.x, this.y);
  }
}
