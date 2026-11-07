/* ==========================================================================
   butterflies.js — mariposas volando
   - Cada mariposa es un SVG con dos alas que aletean en 3D (CSS).
   - El vuelo se calcula aquí: van hacia puntos al azar con giros suaves,
     un leve zigzag y un pequeño rebote, evitando tapar el corazón.
   - Solo se actualiza `transform`, lo más barato para el navegador.
   ========================================================================== */
(function (Love) {
  'use strict';

  var U = Love.utils;
  var TAU = U.TAU;
  var DEG = 180 / Math.PI;

  var PALETTES = [
    { fore: ['#ffe3f2', '#ff6fb5', '#a64dff'], hind: ['#ff9ad1', '#e0408f'] }, // rosa / violeta
    { fore: ['#e6ecff', '#8aa8ff', '#7b2ff7'], hind: ['#c3b5ff', '#6a4cff'] }, // morpho lila
    { fore: ['#fff3d1', '#ffc46b', '#ff6fb5'], hind: ['#ffd9a0', '#ff7fb8'] }  // dorado / rosa
  ];

  // Ala derecha; el eje del cuerpo está en x = 0. La izquierda es su espejo.
  var FORE_WING = 'M0 38 C6 20 26 2 50 3 C60 4 63 15 57 26 C51 36 31 41 0 41 Z';
  var HIND_WING = 'M0 43 C22 43 42 50 44 63 C46 75 34 81 22 77 C10 73 4 59 0 47 Z';
  var VEINS = 'M1 39 Q20 24 46 9 M1 40 Q25 33 53 21 M1 41 Q26 40 50 32 M1 45 Q20 55 34 74 M1 46 Q14 62 20 75';
  var SPOTS = [[50, 8, 1.6], [56, 15, 1.3], [55, 23, 1.1], [38, 73, 1.3], [29, 76, 1.1]];

  var uid = 0;

  function wingMarkup(palette, id, withDefs) {
    var defs = withDefs
      ? '<defs>' +
          '<linearGradient id="' + id + '-f" x1="0" y1="1" x2="1" y2="0">' +
            '<stop offset="0" stop-color="' + palette.fore[0] + '"/>' +
            '<stop offset=".5" stop-color="' + palette.fore[1] + '"/>' +
            '<stop offset="1" stop-color="' + palette.fore[2] + '"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + id + '-h" x1="0" y1="0" x2="1" y2="1">' +
            '<stop offset="0" stop-color="' + palette.hind[0] + '"/>' +
            '<stop offset="1" stop-color="' + palette.hind[1] + '"/>' +
          '</linearGradient>' +
        '</defs>'
      : '';

    var spots = SPOTS.map(function (s) {
      return '<circle cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '"/>';
    }).join('');

    return '<svg viewBox="0 0 62 82" aria-hidden="true" focusable="false">' + defs +
      '<path class="bf-hind" fill="url(#' + id + '-h)" d="' + HIND_WING + '"/>' +
      '<path class="bf-fore" fill="url(#' + id + '-f)" d="' + FORE_WING + '"/>' +
      '<path class="bf-veins" d="' + VEINS + '"/>' +
      '<g class="bf-spots">' + spots + '</g>' +
    '</svg>';
  }

  var BODY_MARKUP =
    '<svg class="bf-body" viewBox="0 0 10 82" aria-hidden="true" focusable="false">' +
      '<path class="bf-antenna" d="M4.4 28 Q2 18 .5 13 M5.6 28 Q8 18 9.5 13"/>' +
      '<circle cx=".5" cy="13" r=".9"/><circle cx="9.5" cy="13" r=".9"/>' +
      '<circle cx="5" cy="30" r="2.2"/>' +
      '<ellipse cx="5" cy="40" rx="2.4" ry="6"/>' +
      '<ellipse cx="5" cy="58" rx="1.8" ry="14"/>' +
    '</svg>';

  function wrapAngle(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }

  /* ---------- Una mariposa ---------- */

  function Butterfly(layer, palette, size, w, h) {
    var id = 'bf' + (uid++);
    this.size = size;
    this.w = w;
    this.h = h;

    this.el = document.createElement('div');
    this.el.className = 'bf';
    this.el.style.setProperty('--size', size + 'px');
    this.el.style.setProperty('--cycle', U.rand(1.3, 1.9).toFixed(2) + 's');
    this.el.style.setProperty('--delay', (-U.rand(0, 2)).toFixed(2) + 's');
    // Las más pequeñas parecen más lejanas: un poco más tenues.
    this.el.style.setProperty('--opacity', U.clamp(size / 60, 0.7, 1).toFixed(2));
    this.el.innerHTML =
      '<div class="bf-inner">' +
        '<div class="bf-wing bf-wing--left">' + wingMarkup(palette, id, false) + '</div>' +
        '<div class="bf-wing bf-wing--right">' + wingMarkup(palette, id, true) + '</div>' +
        BODY_MARKUP +
      '</div>';
    layer.appendChild(this.el);

    // Vuelo
    this.speed = U.rand(45, 70) * (size / 50);
    this.turnRate = U.rand(1.3, 1.9);       // rad/s
    this.wobbleFreq = U.rand(1.5, 2.5);
    this.bobFreq = U.rand(5, 7);
    this.phase = U.rand(0, TAU);
    this.boost = 0;

    this.enterFromEdge();
    this.pickTarget();
    this.heading = Math.atan2(this.ty - this.y, this.tx - this.x);
  }

  Butterfly.prototype.enterFromEdge = function () {
    var m = this.size;
    var side = Math.floor(Math.random() * 3);
    if (side === 0)      { this.x = -m;          this.y = U.rand(0.2, 0.8) * this.h; }
    else if (side === 1) { this.x = this.w + m;  this.y = U.rand(0.2, 0.8) * this.h; }
    else                 { this.x = U.rand(0.1, 0.9) * this.w; this.y = this.h + m; }
  };

  /** Elige un destino al azar, evitando la zona central del corazón. */
  Butterfly.prototype.pickTarget = function () {
    var m = this.size;
    var cx = this.w / 2, cy = this.h * 0.45;
    var rx = this.w * 0.22, ry = this.h * 0.3;
    for (var i = 0; i < 8; i++) {
      var x = U.rand(m, this.w - m);
      var y = U.rand(m, this.h - m);
      var dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) break;
    }
    this.tx = x;
    this.ty = y;
  };

  /** Huye de un punto (por ejemplo, donde se tocó la pantalla). */
  Butterfly.prototype.fleeFrom = function (px, py) {
    var dx = this.x - px, dy = this.y - py;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (d > 180) return;
    d = d || 1;
    this.tx = U.clamp(this.x + (dx / d) * 260, this.size, this.w - this.size);
    this.ty = U.clamp(this.y + (dy / d) * 260, this.size, this.h - this.size);
    this.boost = 0.9;
  };

  Butterfly.prototype.update = function (dt, t) {
    var dx = this.tx - this.x;
    var dy = this.ty - this.y;
    if (dx * dx + dy * dy < 50 * 50) this.pickTarget();

    // Giro suave y limitado hacia el destino.
    var diff = wrapAngle(Math.atan2(dy, dx) - this.heading);
    var maxTurn = this.turnRate * dt;
    this.heading += U.clamp(diff, -maxTurn, maxTurn);

    var wobble = Math.sin(t * this.wobbleFreq + this.phase) * 0.5;
    var dir = this.heading + wobble;
    var speed = this.speed * (this.boost > 0 ? 2.4 : 1);
    this.boost -= dt;

    this.x += Math.cos(dir) * speed * dt;
    this.y += Math.sin(dir) * speed * dt;

    var bob = Math.sin(t * this.bobFreq + this.phase) * this.size * 0.06;
    var angle = (this.heading + wobble * 0.4 + Math.PI / 2) * DEG; // la cabeza mira hacia donde vuela

    this.el.style.transform =
      'translate3d(' + (this.x - this.size / 2).toFixed(1) + 'px,' +
      (this.y + bob - this.size * 0.33).toFixed(1) + 'px,0) rotate(' + angle.toFixed(1) + 'deg)';
  };

  /* ---------- Bandada ---------- */

  function Butterflies(layer) {
    this.layer = layer;
    this.items = [];
    this.time = 0;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
  }

  Butterflies.prototype.resize = function (w, h) {
    this.w = w;
    this.h = h;
    this.items.forEach(function (b) { b.w = w; b.h = h; b.pickTarget(); });
  };

  Butterflies.prototype.spawn = function (count) {
    var sizes = [74, 60, 50, 42];
    var scale = U.clamp(this.w / 1000, 0.75, 1); // un poco más pequeñas en celular
    for (var i = 0; i < count; i++) {
      this.items.push(new Butterfly(
        this.layer,
        PALETTES[i % PALETTES.length],
        Math.round(sizes[i % sizes.length] * scale),
        this.w,
        this.h
      ));
    }
  };

  Butterflies.prototype.update = function (dt) {
    this.time += dt;
    for (var i = 0; i < this.items.length; i++) this.items[i].update(dt, this.time);
  };

  Butterflies.prototype.scatter = function (x, y) {
    for (var i = 0; i < this.items.length; i++) this.items[i].fleeFrom(x, y);
  };

  Love.Butterflies = Butterflies;
})(window.Love = window.Love || {});
