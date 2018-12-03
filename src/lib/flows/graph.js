CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, maxWidth, lineHeight) {
  if (typeof text != 'string' || typeof x != 'number' || typeof y != 'number') {
    return;
  }

  var context = this;
  var canvas = context.canvas;

  if (typeof maxWidth == 'undefined') {
    maxWidth = (canvas && canvas.width) || 300;
  }
  if (typeof lineHeight == 'undefined') {
    lineHeight = (canvas && parseInt(window.getComputedStyle(canvas).lineHeight)) || parseInt(window.getComputedStyle(document.body).lineHeight);
  }

  // 字符分隔为数组
  var arrText = text.split('');
  var line = '';

  var positions = [];
  var pos = text.indexOf("\n");
  while (pos > -1) {
    positions.push(pos);
    pos = text.indexOf("\n", pos + 1);
  }

  for (var n = 0; n < arrText.length; n++) {
    var testLine = line + arrText[n];
    var metrics = context.measureText(testLine);
    var testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0 || positions.indexOf(n) > -1) {
      context.fillText(line, x, y);
      line = arrText[n];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
};

export default {
  data() {
    return {
      graphFont: '14px Helvetica bold',
      textAlign: 'center',
      textBaseline: 'middle',
      lineWidth: 2.6
    }
  },
  methods: {
    Rect(x, y, width = 100, name, bgColor = "#add8e6", borderColor = "transparent", textColor = "#000", height = 30) {
      this.ctx.fillStyle = bgColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeStyle = borderColor;
      this.ctx.font = this.graphFont;
      this.ctx.textAlign = this.textAlign;
      this.ctx.textBaseline = this.textBaseline;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(x - width / 2, y - height / 2, width, height);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = textColor;
      this.ctx.fillText(name, x, y);
      this.ctx.restore();
    },
    Round(x, y, r = 50, name, bgColor = "#add8e6", borderColor = "transparent", textColor = "#000") {
      this.ctx.fillStyle = bgColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeStyle = borderColor;
      this.ctx.font = this.graphFont;
      this.ctx.textAlign = this.textAlign;
      this.ctx.textBaseline = this.textBaseline;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, 2 * Math.PI);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = textColor;
      this.ctx.fillText(name, x, y);
      this.ctx.restore();
    },
    RoundRect(x, y, width, height = 30, name, radius, bgColor = "#add8e6", borderColor = "transparent", textColor = "#000", lineHeight) {
      const halfX = x - width / 2;
      const halfY = y - height / 2;
      this.ctx.fillStyle = bgColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.strokeStyle = borderColor;
      this.ctx.font = this.graphFont;
      this.ctx.textAlign = this.textAlign;
      this.ctx.textBaseline = this.textBaseline;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(halfX + radius, halfY + radius, radius, Math.PI, Math.PI * 3 / 2);
      this.ctx.lineTo(width - radius + halfX, halfY);
      this.ctx.arc(width - radius + halfX, radius + halfY, radius, Math.PI * 3 / 2, Math.PI * 2);
      this.ctx.lineTo(width + halfX, height + halfY - radius);
      this.ctx.arc(width - radius + halfX, height - radius + halfY, radius, 0, Math.PI * 1 / 2);
      this.ctx.lineTo(radius + halfX, height + halfY);
      this.ctx.arc(radius + halfX, height - radius + halfY, radius, Math.PI * 1 / 2, Math.PI);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.fillStyle = textColor;
      this.ctx.wrapText(name, x, halfY + this.nodeHeight / 2 , width - 20, lineHeight);
      this.ctx.restore();
      return this;
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
    Arrow(fromX, fromY, toX, toY, tos, color = '#666', activeColor = 'transparent', width = 1.6, theta = 60, headlen = 3) {
      // 把当做动作矩形画
      const angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI;
      const lineAngle = (angle - 90) * Math.PI / 180;
      const lineOffsetX = width * Math.cos(lineAngle);
      const lineOffsetY = width * Math.sin(lineAngle);
      const topRightX = fromX - lineOffsetX;
      const topRightY = fromY - lineOffsetY;
      const nookAngle = angle * Math.PI / 180;
      const nookX = 8 * Math.cos(nookAngle);
      const nookY = 8 * Math.sin(nookAngle);
      const botLeftX = toX + nookX;
      const botLeftY = toY + nookY;
      const botRightX = botLeftX - lineOffsetX;
      const botRightY = botLeftY - lineOffsetY;

      // 画完矩形，链接箭头
      const arrowRightAngle = (angle + theta) * Math.PI / 180;
      const arrowLeftAngle = (angle - theta) * Math.PI / 180;
      const arrowRightX = botRightX + headlen * Math.cos(arrowRightAngle);
      const arrowRightY = botRightY + headlen * Math.sin(arrowRightAngle);
      const arrowLeftX = botLeftX + headlen * Math.cos(arrowLeftAngle);
      const arrowLeftY = botLeftY + headlen * Math.sin(arrowLeftAngle);

      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.lineTo(botLeftX, botLeftY);
      this.ctx.lineTo(fromX, fromY);
      this.ctx.lineTo(topRightX, topRightY);
      this.ctx.lineTo(botRightX, botRightY);
      this.ctx.lineTo(arrowRightX, arrowRightY);
      this.ctx.lineTo(toX - 1 * Math.cos(lineAngle), toY - 1 * Math.cos(lineAngle));
      this.ctx.lineTo(arrowLeftX, arrowLeftY);
      this.ctx.closePath();
      this.ctx.fillStyle = color;
      this.ctx.fill();
      this.ctx.lineWidth = 1.6;
      this.ctx.strokeStyle = activeColor;
      this.ctx.stroke();
      this.ctx.restore();
    },
    Line(fromX, fromY, toX, toY, color = '#666', width = 1.2) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.moveTo(fromX, fromY);
      this.ctx.lineTo(toX, toY);
      this.ctx.closePath();
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = width;
      this.ctx.stroke();
      this.ctx.restore();
    },
    drawText(width, t, x, y) {
      const text = t.split("\n");
      const row = [];

      for (let i = 0; i < text.length; i++) {
        row.push(text[i]);
      }

      for (let i = 0; i < row.length; i++) {
        this.ctx.fillText(row[i], x, y + i * 20);
      }
    }
  }
}
