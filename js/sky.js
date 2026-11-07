/* ==========================================================================
   sky.js — cielo nocturno en canvas (optimizado)
   - Estrellas fijas: se pintan UNA vez en un canvas aparte (solo al cambiar
     el tamaño) y cada frame se copian con un único drawImage.
   - Solo unas pocas estrellas titilan.
   - Estrellas fugaces ocasionales y corazones que suben, dibujados con
     sprites pre-renderizados (sin shadowBlur por frame).
   ========================================================================== */
(function (Love) {
  'use strict';

  var U = Love.utils;
  var TAU = U.TAU;

  var STAR_TINTS  = ['255,255,255', '255,214,236', '214,226,255', '255,240,214'];
  var HEART_TINTS = ['#ff4fd8', '#ff8ac2', '#ff2e88', '#ffb6d5'];

  function Sky(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.starLayer = document.createElement('canvas');
    this.w = 0;
    this.h = 0;
    this.time = 0;
    this.twinklers = [];
    this.hearts = [];
    this.meteors = [];
    this.nextMeteor = 3;
    this.heartSprites = HEART_TINTS.map(function (c) {
      return U.makeSprite('heart', c, 40, 10);
    });
  }

  Sky.prototype.resize = function (w, h, dpr) {
    U.fitCanvas(this.canvas, this.ctx, w, h, dpr);
    this.w = w;
    this.h = h;
    this.paintStaticStars(dpr);
    this.twinklers = U.times(Math.round(U.clamp((w * h) / 20000, 20, 55)), this.spawnTwinkler, this);
    this.hearts = U.times(Math.round(U.clamp(w / 150, 4, 9)), function () { return this.spawnHeart(true); }, this);
  };

  Sky.prototype.paintStaticStars = function (dpr) {
    var ctx = this.starLayer.getContext('2d');
    U.fitCanvas(this.starLayer, ctx, this.w, this.h, dpr);
    ctx.clearRect(0, 0, this.w, this.h);

    var count = Math.min(300, Math.round((this.w * this.h) / 4000));
    for (var i = 0; i < count; i++) {
      ctx.globalAlpha = U.rand(0.15, 0.65);
      ctx.fillStyle = 'rgb(' + U.pick(STAR_TINTS) + ')';
      ctx.beginPath();
      ctx.arc(U.rand(0, this.w), U.rand(0, this.h), U.rand(0.3, 0.9), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- Fábricas ---------- */

  Sky.prototype.spawnTwinkler = function () {
    return {
      x: U.rand(0, this.w),
      y: U.rand(0, this.h),
      r: U.rand(0.8, 1.6),
      alpha: U.rand(0.5, 1),
      speed: U.rand(0.6, 1.8),
      phase: U.rand(0, TAU),
      color: 'rgb(' + U.pick(STAR_TINTS) + ')'
    };
  };

  Sky.prototype.spawnHeart = function (initial) {
    return {
      x: U.rand(0, this.w),
      y: initial ? U.rand(0, this.h) : this.h + U.rand(20, 80),
      size: U.rand(10, 22),
      vy: U.rand(14, 30),
      amp: U.rand(8, 24),
      freq: U.rand(0.6, 1.4),
      phase: U.rand(0, TAU),
      alpha: U.rand(0.2, 0.5),
      sprite: U.pick(this.heartSprites)
    };
  };

  Sky.prototype.spawnMeteor = function () {
    var dir = Math.random() < 0.5 ? 1 : -1;
    var angle = U.rand(0.3, 0.55);
    var speed = U.rand(750, 1100);
    return {
      x: dir > 0 ? U.rand(-0.1, 0.55) * this.w : U.rand(0.45, 1.1) * this.w,
      y: U.rand(-0.05, 0.3) * this.h,
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed,
      len: U.rand(110, 200),
      life: 0,
      ttl: U.rand(0.7, 1.1)
    };
  };

  /* ---------- Simulación ---------- */

  Sky.prototype.update = function (dt) {
    var i, item;
    this.time += dt;

    for (i = 0; i < this.hearts.length; i++) {
      item = this.hearts[i];
      item.y -= item.vy * dt;
      if (item.y < -item.size * 2) this.hearts[i] = this.spawnHeart(false);
    }

    this.nextMeteor -= dt;
    if (this.nextMeteor <= 0) {
      this.meteors.push(this.spawnMeteor());
      this.nextMeteor = U.rand(4, 9);
    }
    for (i = this.meteors.length - 1; i >= 0; i--) {
      item = this.meteors[i];
      item.life += dt;
      item.x += item.vx * dt;
      item.y += item.vy * dt;
      if (item.life >= item.ttl) this.meteors.splice(i, 1);
    }
  };

  /* ---------- Render ---------- */

  Sky.prototype.draw = function () {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.drawImage(this.starLayer, 0, 0, this.w, this.h);
    this.drawTwinklers(ctx);
    this.drawMeteors(ctx);
    this.drawHearts(ctx);
    ctx.globalAlpha = 1;
  };

  Sky.prototype.drawTwinklers = function (ctx) {
    var t = this.time;
    ctx.lineWidth = 0.6;
    for (var i = 0; i < this.twinklers.length; i++) {
      var s = this.twinklers[i];
      var a = s.alpha * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase)));

      ctx.globalAlpha = a;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();

      // Destello en cruz para las más grandes.
      if (s.r > 1.2) {
        ctx.globalAlpha = a * 0.45;
        ctx.strokeStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(s.x - s.r * 5, s.y); ctx.lineTo(s.x + s.r * 5, s.y);
        ctx.moveTo(s.x, s.y - s.r * 5); ctx.lineTo(s.x, s.y + s.r * 5);
        ctx.stroke();
      }
    }
  };

  Sky.prototype.drawMeteors = function (ctx) {
    ctx.globalAlpha = 1;
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.6;
    for (var i = 0; i < this.meteors.length; i++) {
      var m = this.meteors[i];
      var p = m.life / m.ttl;
      var fade = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
      var speed = Math.sqrt(m.vx * m.vx + m.vy * m.vy);
      var tx = m.x - (m.vx / speed) * m.len;
      var ty = m.y - (m.vy / speed) * m.len;

      var grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
      grad.addColorStop(0, 'rgba(255,255,255,' + fade + ')');
      grad.addColorStop(0.3, 'rgba(255,170,220,' + fade * 0.5 + ')');
      grad.addColorStop(1, 'rgba(255,170,220,0)');

      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  };

  Sky.prototype.drawHearts = function (ctx) {
    var t = this.time;
    for (var i = 0; i < this.hearts.length; i++) {
      var ht = this.hearts[i];
      var sway = Math.sin(t * ht.freq + ht.phase);
      // Aparecen suavemente abajo y se desvanecen al subir.
      var fade = U.clamp(ht.y / (this.h * 0.7), 0, 1) *
                 U.clamp((this.h + ht.size - ht.y) / 60, 0, 1);
      if (fade <= 0) continue;
      U.drawSprite(ctx, ht.sprite, ht.x + sway * ht.amp, ht.y, ht.size, sway * 0.22, ht.alpha * fade);
    }
  };

  Love.Sky = Sky;
})(window.Love = window.Love || {});
