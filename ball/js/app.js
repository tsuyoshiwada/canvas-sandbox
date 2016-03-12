"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
  "use strict";

  var World = {
    GRAVITY_X: 0,
    GRAVITY_Y: 1,
    FRICTION: 0.98,
    REBOUND: 0.78,
    TOUCH: "ontouchstart" in window
  };

  var Events = {
    MOUSE_DOWN: World.TOUCH ? "touchstart" : "mousedown",
    MOUSE_MOVE: World.TOUCH ? "touchmove" : "mousemove",
    MOUSE_UP: World.TOUCH ? "touchend" : "mouseup"
  };

  var raf = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;

  var Point = function () {
    _createClass(Point, [{
      key: "length",
      get: function get() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
      }
    }], [{
      key: "distance",
      value: function distance(point1, point2) {
        var dx = point2.x - point1.x;
        var dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
      }
    }]);

    function Point() {
      var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
      var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

      _classCallCheck(this, Point);

      this.x = x;
      this.y = y;
    }

    _createClass(Point, [{
      key: "distance",
      value: function distance(point) {
        return Point.distance(this, point);
      }
    }]);

    return Point;
  }();

  var Ball = function () {
    function Ball(ctx, size, color) {
      _classCallCheck(this, Ball);

      this.ctx = ctx;
      this.x = 0;
      this.y = 0;
      this.size = size;
      this.radius = size / 2;
      this.color = color;
    }

    _createClass(Ball, [{
      key: "render",
      value: function render() {
        var ctx = this.ctx;
        var radius = this.radius;

        ctx.beginPath();
        ctx.arc(this.x + radius, this.y + radius, radius, 0, 2 * Math.PI, false);
        ctx.fill();
      }
    }, {
      key: "hitTest",
      value: function hitTest(x, y) {
        var radius = this.radius;

        var point1 = new Point(this.x + radius, this.y + radius);
        var point2 = new Point(x, y);
        return point1.distance(point2) <= radius;
      }
    }]);

    return Ball;
  }();

  var Stage = function () {
    function Stage(id) {
      _classCallCheck(this, Stage);

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

    _createClass(Stage, [{
      key: "tick",
      value: function tick() {
        var ctx = this.ctx;
        var ball = this.ball;
        var inertiaForce = this.inertiaForce;

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

          var length = inertiaForce.length;
          var thickness = length * World.FRICTION;
          if (length === 0 || thickness === 0) {
            inertiaForce.x = 0;
            inertiaForce.y = 0;
          } else {
            var scale = thickness / length;
            inertiaForce.x *= scale;
            inertiaForce.y *= scale;
          }
        }

        inertiaForce.x += World.GRAVITY_X;
        inertiaForce.y += World.GRAVITY_Y;

        ball.render();
        raf(this.tick.bind(this));
      }
    }, {
      key: "updateSize",
      value: function updateSize() {
        this.width = document.documentElement.clientWidth;
        this.height = document.documentElement.clientHeight;
        this.el.width = this.width;
        this.el.height = this.height;
      }
    }, {
      key: "handleResize",
      value: function handleResize() {
        this.updateSize();
      }
    }, {
      key: "handleMouseDown",
      value: function handleMouseDown(e) {
        this.cancelEvent(e);

        var ball = this.ball;

        if (ball.hitTest(e.pageX, e.pageY)) {
          this.isDrag = true;
          this.lastPoint = new Point(ball.x, ball.y);
          this.offset = new Point(ball.x - e.pageX, ball.y - e.pageY);
          this.el.addEventListener(Events.MOUSE_MOVE, this.mouseMoveListener, false);
          this.el.addEventListener(Events.MOUSE_UP, this.mouseUpListener, false);
        }
      }
    }, {
      key: "handleMouseMove",
      value: function handleMouseMove(e) {
        this.cancelEvent(e);

        var ball = this.ball;
        var offset = this.offset;

        this.lastPoint = new Point(ball.x, ball.y);
        ball.x = Math.min(this.width - ball.size, Math.max(0, e.pageX + offset.x));
        ball.y = Math.min(this.height - ball.size, Math.max(0, e.pageY + offset.y));
      }
    }, {
      key: "handleMouseUp",
      value: function handleMouseUp(e) {
        this.cancelEvent(e);

        var el = this.el;
        var inertiaForce = this.inertiaForce;
        var lastPoint = this.lastPoint;
        var ball = this.ball;

        this.isDrag = false;
        this.lastPoint = null;
        inertiaForce.x = ball.x - lastPoint.x;
        inertiaForce.y = ball.y - lastPoint.y;
        el.removeEventListener(Events.MOUSE_MOVE, this.mouseMoveListener, false);
        el.removeEventListener(Events.MOUSE_UP, this.mouseUpListener, false);
      }
    }, {
      key: "cancelEvent",
      value: function cancelEvent(e) {
        e.preventDefault();
        e.stopPropagation();
      }
    }]);

    return Stage;
  }();

  // Initialize Stage


  document.addEventListener("DOMContentLoaded", function () {
    new Stage("stage");
  }, false);

  // Change the World!!
  window.addEventListener("devicemotion", function (e) {
    var gravityX = e.accelerationIncludingGravity.x;
    var gravityY = e.accelerationIncludingGravity.y;
    if (gravityX && gravityY) {
      World.GRAVITY_X = Math.min(1, Math.max(-1, gravityX * 0.3));
      World.GRAVITY_Y = Math.min(1, Math.max(-1, gravityY * 0.3 * -1));
    }
  });
})();