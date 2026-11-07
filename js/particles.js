/* ==========================================================================
   particles.js — explosiones de corazones al tocar (optimizado)
   Usa sprites pre-renderizados y no repinta el canvas cuando no hay nada.
   ========================================================================== */
(function (Love) {
  'use strict';

  var U = Love.utils;
  var TAU = U.TAU;

  var COLORS = ['#ff4fd8', '#ff8ac2', '#ff2e88', '#ffb6d5', '#ffffff', '#ffd27a'];
  var MAX_PARTICLES = 220;
  var DRAG_PER_SECOND = 0.28; // fracción de velocidad que queda tras 1 s

  function Particles(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.items = [];
    this.w = 0;
    this.h = 0;
    this.dirty = false;
    this.sprites = {
      heart: COLORS.map(function (c) { return U.makeSprite('heart', c, 36, 8); }),
      spark: COLORS.map(function (c) { return U.makeSprite('sparkle', c, 16, 6); })
    };
  }

  Particles.prototype.resize = function (w, h, dpr) {
    U.fitCanvas(this.canvas, this.ctx, w, h, dpr);
    this.w = w;
    this.h = h;
  };

  Particles.prototype.add = function (p) {
    if (this.items.length >= MAX_PARTICLES) this.items.shift();
    this.items.push(p);
  };

  /** Explosión de corazones y destellos. power escala cantidad y fuerza. */
  Particles.prototype.burst = function (x, y, power) {
    power = power || 1;

    this.add({ type: 'ring', x: x, y: y, life: 0, ttl: 0.7, radius: 90 * power });

    var count = Math.round(20 * power);
    for (var i = 0; i < count; i++) {
      var angle = U.rand(0, TAU);
      var speed = U.rand(90, 360) * power;
      var isHeart = Math.random() < 0.65;
      this.add({
        type: 'shape',
        sprite: U.pick(isHeart ? this.sprites.heart : this.sprites.spark),
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - U.rand(40, 140) * power,
        gravity: isHeart ? 260 : 180,
        size: isHeart ? U.rand(10, 20) * Math.min(power, 1.4) : U.rand(7, 13),
        rot: U.rand(-0.5, 0.5),
        spin: U.rand(-3, 3),
        life: 0,
        ttl: U.rand(1.2, 2)
      });
    }
  };

  Particles.prototype.update = function (dt) {
    var drag = Math.pow(DRAG_PER_SECOND, dt);
    var items = this.items;

    for (var i = items.length - 1; i >= 0; i--) {
      var p = items[i];
      p.life += dt;

      if (p.life >= p.ttl) {
        // Eliminación O(1): reemplazar por el último y recortar.
        items[i] = items[items.length - 1];
        items.pop();
        continue;
      }
      if (p.type === 'ring') continue;

      p.vx *= drag;
      p.vy = p.vy * drag + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
  };

  Particles.prototype.draw = function () {
    var ctx = this.ctx;

    // Sin partículas: limpiar una vez y no volver a tocar el canvas.
    if (!this.items.length) {
      if (this.dirty) {
        ctx.clearRect(0, 0, this.w, this.h);
        this.dirty = false;
      }
      return;
    }

    ctx.clearRect(0, 0, this.w, this.h);
    this.dirty = true;

    for (var i = 0; i < this.items.length; i++) {
      var p = this.items[i];
      var k = p.life / p.ttl;

      if (p.type === 'ring') {
        var eased = 1 - Math.pow(1 - k, 3);
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.strokeStyle = '#ffb6d5';
        ctx.lineWidth = 2.5 * (1 - k) + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 + p.radius * eased, 0, TAU);
        ctx.stroke();
        continue;
      }

      var grow = k < 0.12 ? k / 0.12 : 1;
      U.drawSprite(ctx, p.sprite, p.x, p.y, p.size * grow, p.rot, 1 - k * k);
    }
    ctx.globalAlpha = 1;
  };

  Love.Particles = Particles;
})(window.Love = window.Love || {});
