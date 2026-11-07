/* ==========================================================================
   main.js — punto de entrada
   Conecta los módulos, maneja eventos y ejecuta el loop de animación.
   ========================================================================== */
(function (Love) {
  'use strict';

  var U = Love.utils;

  var CONFIG = {
    phrases: [
      'Cada latido lleva tu nombre',
      'Eres mi lugar favorito en el mundo',
      'Contigo, hasta las estrellas brillan más',
      'Mi pensamiento más bonito siempre eres tú',
      'Eres la casualidad más bonita de mi vida',
      'Te elegiría una y mil veces',
      'Hoy, mañana y todos los días'
    ],
    phraseDelay: 4800,     // ms: cuándo aparece la primera frase
    phraseInterval: 5200,  // ms: cada cuánto cambia
    phraseFade: 900,       // ms: duración de la salida
    butterfliesAt: 1800,   // ms: cuándo entran las mariposas
    celebrateAt: 4500,     // ms: explosión automática al terminar la intro
    fontTimeout: 1800,     // ms: máximo a esperar por las fuentes
    maxDpr: 1.5            // límite de resolución del canvas (rendimiento)
  };

  var reducedMotion = U.prefersReducedMotion();

  var body = document.body;
  var heartButton = document.getElementById('heartButton');
  var heartPop = heartButton.querySelector('.heart-pop');
  var phraseEl = document.getElementById('phrase');

  var sky = new Love.Sky(document.getElementById('sky'));
  var fx = new Love.Particles(document.getElementById('fx'));
  var butterflies = new Love.Butterflies(document.getElementById('butterflies'));

  // Preparar textos animados antes de que empiece la coreografía.
  document.querySelectorAll('[data-split]').forEach(Love.intro.split);

  /* ---------- Tamaño ---------- */

  function resize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
    sky.resize(w, h, dpr);
    fx.resize(w, h, dpr);
    butterflies.resize(w, h);
    if (reducedMotion) sky.draw(); // cielo estático
  }
  resize();
  window.addEventListener('resize', U.debounce(resize, 150));

  /* ---------- Loop de animación ---------- */

  var rafId = 0;
  var lastTime = 0;

  function frame(now) {
    // Limitar dt evita saltos si el navegador se congela un momento.
    var dt = Math.min((now - lastTime) / 1000, 1 / 20);
    lastTime = now;

    sky.update(dt);
    sky.draw();
    fx.update(dt);
    fx.draw();
    butterflies.update(dt);

    rafId = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (rafId || reducedMotion) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // No gastar batería cuando la pestaña no está visible.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopLoop();
    else if (body.classList.contains('is-ready')) startLoop();
  });

  /* ---------- Interacción ---------- */

  function heartCenter() {
    var r = heartButton.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.45 };
  }

  function popHeart() {
    heartPop.classList.remove('is-pop');
    void heartPop.offsetWidth; // reinicia la animación
    heartPop.classList.add('is-pop');
  }

  function celebrate(x, y, power) {
    fx.burst(x, y, power);
    butterflies.scatter(x, y);
  }

  heartButton.addEventListener('click', function () {
    popHeart();
    if (!reducedMotion) {
      var c = heartCenter();
      celebrate(c.x, c.y, 1.6);
    }
  });

  if (!reducedMotion) {
    window.addEventListener('pointerdown', function (e) {
      if (e.target.closest('#heartButton')) return; // el botón tiene su propia explosión
      celebrate(e.clientX, e.clientY, 1);
    });
  }

  /* ---------- Arranque ---------- */

  var fontsReady = document.fonts && document.fonts.ready
    ? document.fonts.ready
    : Promise.resolve();

  Promise.race([fontsReady, U.wait(CONFIG.fontTimeout)]).then(function () {
    body.classList.add('is-ready');
    startLoop();

    Love.intro.rotatePhrases(phraseEl, CONFIG.phrases, {
      delay: reducedMotion ? 0 : CONFIG.phraseDelay,
      interval: CONFIG.phraseInterval,
      fade: CONFIG.phraseFade
    });

    if (reducedMotion) return;

    setTimeout(function () {
      butterflies.spawn(window.innerWidth < 600 ? 3 : 4);
    }, CONFIG.butterfliesAt);

    setTimeout(function () {
      var c = heartCenter();
      popHeart();
      fx.burst(c.x, c.y, 1.4);
    }, CONFIG.celebrateAt);
  });
})(window.Love = window.Love || {});
