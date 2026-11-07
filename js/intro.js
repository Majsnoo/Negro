/* ==========================================================================
   intro.js — tipografía animada
   Divide textos en letras (para animarlas una a una) y rota las frases.
   ========================================================================== */
(function (Love) {
  'use strict';

  /**
   * Convierte el texto de `el` en <span class="char"> con la variable CSS --i
   * (su índice), que el CSS usa para escalonar la animación.
   * Mantiene una copia oculta del texto para lectores de pantalla.
   */
  function split(el) {
    var text = el.textContent.trim();
    var fragment = document.createDocumentFragment();

    Array.from(text).forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'char';
      span.setAttribute('aria-hidden', 'true');
      span.style.setProperty('--i', i);
      span.textContent = ch === ' ' ? ' ' : ch;
      fragment.appendChild(span);
    });

    var readable = document.createElement('span');
    readable.className = 'visually-hidden';
    readable.textContent = text;
    fragment.appendChild(readable);

    el.textContent = '';
    el.appendChild(fragment);
    el.classList.add('is-split');
  }

  /** Muestra las frases una tras otra con transición de entrada y salida. */
  function rotatePhrases(el, phrases, options) {
    var index = 0;

    function show() {
      el.textContent = phrases[index];
      el.classList.add('is-visible');
    }

    function next() {
      el.classList.remove('is-visible');
      setTimeout(function () {
        index = (index + 1) % phrases.length;
        show();
      }, options.fade);
    }

    setTimeout(function () {
      show();
      setInterval(next, options.interval);
    }, options.delay);
  }

  Love.intro = { split: split, rotatePhrases: rotatePhrases };
})(window.Love = window.Love || {});
