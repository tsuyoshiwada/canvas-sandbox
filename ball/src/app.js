(() => {
  "use strict";

  const World = {
    GRAVITY_X: 0,
    GRAVITY_Y: 1,
    FRICTION: 0.98,
    REBOUND: 0.78,
    TOUCH: ("ontouchstart" in window)
  };

  const Events = {
    MOUSE_DOWN: World.TOUCH ? "touchstart" : "mousedown",
    MOUSE_MOVE: World.TOUCH ? "touchmove" : "mousemove",
    MOUSE_UP: World.TOUCH ? "touchend" : "mouseup"
  };

  const raf =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame;

  class Point {
    static distance(point1, point2) {
      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    get length() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    distance(point) {
      return Point.distance(this, point);
    }
  }

  class Ball {
    constructor(ctx, size, color) {
      this.ctx = ctx;
      this.x = 0;
      this.y = 0;
      this.size = size;
      this.radius = size / 2;
      this.color = color;
    }

    render() {
      const {ctx, radius} = this;
      ctx.beginPath();
      ctx.arc(this.x + radius, this.y + radius, radius, 0, 2 * Math.PI, false);
      ctx.fill();
    }

    hitTest(x, y) {
      const {radius} = this;
      const point1 = new Point(this.x + radius, this.y + radius);
      const point2 = new Point(x, y);
      return point1.distance(point2) <= radius;
    }
  }

  class Stage {
    constructor(id) {
      this.id = id;
      this.el = document.getElementById(id);
      this.ctx = this.el.getContext("2d");
      this.ball = new Ball(this.ctx, 120, "#222");
      this.isDrag = false;
      this.inertiaForce = new Point();
      this.lastPoint = null;
      this.offset = null;

      this.resizeListener = this.handleResize.bind(this);
      this.mouseDownListener = this.handleMouseDown.bind(this);
      this.mouseMoveListener = this.handleMouseMove.bind(this);
      this.mouseUpListener = this.handleMouseUp.bind(this);
      window.addEventListener("resize", this.resizeListener, false);
      this.el.addEventListener(Events.MOUSE_DOWN, this.mouseDownListener, false);

      this.updateSize();
      this.tick();
    }

    tick() {
      const {ctx, ball, inertiaForce} = this;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      if (!this.isDrag) {
        ball.x += inertiaForce.x;
        ball.y += inertiaForce.y;

        if (ball.x <= 0) {
          ball.x = 0;
          inertiaForce.x = -inertiaForce.x * World.REBOUND;

        } else if (ball.x >= this.width - ball.size) {
          ball.x = this.width - ball.size;
          inertiaForce.x = -inertiaForce.x * World.REBOUND;
        }

        if (ball.y <= 0) {
          ball.y = 0;
          inertiaForce.y = -inertiaForce.y * World.REBOUND;
          inertiaForce.x *= World.FRICTION;

        } else if (ball.y >= this.height - ball.size) {
          ball.y = this.height - ball.size;
          inertiaForce.y = -inertiaForce.y * World.REBOUND;
          inertiaForce.x *= World.FRICTION;
        }

        const length = inertiaForce.length;
        const thickness = length * World.FRICTION;
        if (length === 0 || thickness === 0) {
          inertiaForce.x = 0;
          inertiaForce.y = 0;
        } else {
          const scale = thickness / length;
          inertiaForce.x *= scale;
          inertiaForce.y *= scale;
        }
      }

      inertiaForce.x += World.GRAVITY_X;
      inertiaForce.y += World.GRAVITY_Y;

      ball.render();
      raf(this.tick.bind(this));
    }

    updateSize() {
      this.width = document.documentElement.clientWidth;
      this.height = document.documentElement.clientHeight;
      this.el.width = this.width;
      this.el.height = this.height;
    }

    handleResize() {
      this.updateSize();
    }

    handleMouseDown(e) {
      this.cancelEvent(e);

      const {ball} = this;
      if (ball.hitTest(e.pageX, e.pageY)) {
        this.isDrag = true;
        this.lastPoint = new Point(ball.x, ball.y);
        this.offset = new Point(ball.x - e.pageX, ball.y - e.pageY);
        this.el.addEventListener(Events.MOUSE_MOVE, this.mouseMoveListener, false);
        this.el.addEventListener(Events.MOUSE_UP, this.mouseUpListener, false);
      }
    }

    handleMouseMove(e) {
      this.cancelEvent(e);

      const {ball, offset} = this;
      this.lastPoint = new Point(ball.x, ball.y);
      ball.x = Math.min(this.width - ball.size, Math.max(0, e.pageX + offset.x));
      ball.y = Math.min(this.height - ball.size, Math.max(0, e.pageY + offset.y));
    }

    handleMouseUp(e) {
      this.cancelEvent(e);

      const {el, inertiaForce, lastPoint, ball} = this;
      this.isDrag = false;
      this.lastPoint = null;
      inertiaForce.x = ball.x - lastPoint.x;
      inertiaForce.y = ball.y - lastPoint.y;
      el.removeEventListener(Events.MOUSE_MOVE, this.mouseMoveListener, false);
      el.removeEventListener(Events.MOUSE_UP, this.mouseUpListener, false);
    }

    cancelEvent(e) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // Initialize Stage
  document.addEventListener("DOMContentLoaded", () => {
    new Stage("stage");
  }, false);

  // Change the World!!
  window.addEventListener("devicemotion", (e) => {
    const gravityX = e.accelerationIncludingGravity.x;
    const gravityY = e.accelerationIncludingGravity.y;
    if (gravityX && gravityY) {
      World.GRAVITY_X = Math.min(1, Math.max(-1, gravityX * 0.3));
      World.GRAVITY_Y = Math.min(1, Math.max(-1, gravityY * 0.3 * -1));
    }
  });
})();
