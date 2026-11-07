/* ==========================================================================
   utils.js — utilidades compartidas (matemática, canvas y formas)
   ========================================================================== */
(function (Love) {
  'use strict';

  var TAU = Math.PI * 2;

  Love.utils = {
    TAU: TAU,

    rand: function (min, max) {
      return min + Math.random() * (max - min);
    },

    pick: function (list) {
      return list[Math.floor(Math.random() * list.length)];
    },

    clamp: function (value, min, max) {
      return Math.max(min, Math.min(max, value));
    },

    /** Crea un arreglo de n elementos llamando a fn(i) con el contexto dado. */
    times: function (n, fn, context) {
      var out = new Array(n);
      for (var i = 0; i < n; i++) out[i] = fn.call(context, i);
      return out;
    },

    debounce: function (fn, ms) {
      var id;
      return function () {
        var args = arguments, self = this;
        clearTimeout(id);
        id = setTimeout(function () { fn.apply(self, args); }, ms);
      };
    },

    wait: function (ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    },

    prefersReducedMotion: function () {
      return !!(window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    },

    /** Ajusta un canvas a la pantalla respetando la densidad de píxeles. */
    fitCanvas: function (canvas, ctx, width, height, dpr) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },

    /** Traza un corazón centrado en (0, 0); size ≈ ancho en píxeles. */
    heartPath: function (ctx, size) {
      var k = size / 88;
      ctx.beginPath();
      ctx.moveTo(0, 38 * k);
      ctx.bezierCurveTo(0, 38 * k, -44 * k, 11 * k, -44 * k, -17 * k);
      ctx.bezierCurveTo(-44 * k, -33 * k, -31 * k, -42 * k, -19 * k, -42 * k);
      ctx.bezierCurveTo(-10 * k, -42 * k, -3 * k, -37 * k, 0, -30 * k);
      ctx.bezierCurveTo(3 * k, -37 * k, 10 * k, -42 * k, 19 * k, -42 * k);
      ctx.bezierCurveTo(31 * k, -42 * k, 44 * k, -33 * k, 44 * k, -17 * k);
      ctx.bezierCurveTo(44 * k, 11 * k, 0, 38 * k, 0, 38 * k);
      ctx.closePath();
    },

    /**
     * Pre-renderiza una forma con brillo en un canvas pequeño, una sola vez.
     * Dibujar este sprite es mucho más barato que usar shadowBlur cada frame.
     */
    makeSprite: function (shape, color, size, glow) {
      var scale = 2; // resolución extra para que se vea nítido
      var box = size + glow * 4;
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = Math.ceil(box * scale);
      var ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      ctx.translate(box / 2, box / 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
      if (shape === 'heart') this.heartPath(ctx, size);
      else this.sparklePath(ctx, size / 2);
      ctx.fill();
      return { canvas: canvas, box: box, size: size };
    },

    /** Dibuja un sprite centrado en (x, y) con el tamaño, giro y opacidad dados. */
    drawSprite: function (ctx, sprite, x, y, size, rotation, alpha) {
      var b = sprite.box * (size / sprite.size);
      ctx.globalAlpha = alpha;
      if (rotation) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.drawImage(sprite.canvas, -b / 2, -b / 2, b, b);
        ctx.restore();
      } else {
        ctx.drawImage(sprite.canvas, x - b / 2, y - b / 2, b, b);
      }
    },

    /** Traza un destello de cuatro puntas centrado en (0, 0). */
    sparklePath: function (ctx, radius) {
      ctx.beginPath();
      ctx.moveTo(0, -radius);
      ctx.quadraticCurveTo(0, 0, radius, 0);
      ctx.quadraticCurveTo(0, 0, 0, radius);
      ctx.quadraticCurveTo(0, 0, -radius, 0);
      ctx.quadraticCurveTo(0, 0, 0, -radius);
      ctx.closePath();
    }
  };
})(window.Love = window.Love || {});
