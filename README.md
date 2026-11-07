# Para mi negro ❤️

Página animada e interactiva: corazón latiente con su nombre, mensaje de neón,
frases de amor que rotan y un cielo nocturno vivo.

## Cómo verla

Abre `index.html` con doble clic. No necesita servidor ni instalación.

## Interacción

- **Toca el corazón**: lanza una gran explosión de corazones.
- **Toca cualquier lugar**: explosión de corazones en ese punto; las
  mariposas cercanas se asustan y salen volando.

## Estructura

```
para-jacqueline/
├── index.html          Estructura y SVG del corazón
├── css/styles.css      Diseño, tipografía y coreografía de animaciones
└── js/
    ├── utils.js        Utilidades: matemática, canvas y formas
    ├── sky.js          Cielo: estrellas, estrellas fugaces, corazones y destellos
    ├── particles.js    Explosiones de corazones al tocar
    ├── butterflies.js  Mariposas con aleteo 3D y vuelo natural
    ├── intro.js        Texto letra por letra y rotación de frases
    └── main.js         Punto de entrada: eventos, loop y configuración
```

## Personalizar

Las frases, los tiempos y otros ajustes están en el objeto `CONFIG`,
al inicio de `js/main.js`. Los colores y fuentes están como variables en
la sección *Tokens* de `css/styles.css`.

## Detalles técnicos

- Un solo loop `requestAnimationFrame` para todo el canvas; se pausa cuando la
  pestaña no está visible para ahorrar batería.
- Brillos pre-renderizados en *sprites* (sin `shadowBlur` por frame) y estrellas
  fijas pintadas una sola vez: el canvas trabaja muy poco en cada frame.
- El canvas de partículas no se repinta cuando no hay nada que dibujar.
- Las mariposas solo animan `transform` (lo más barato para la GPU).
- Canvas limitado a 1.5x de densidad de píxeles.
- La animación de entrada espera a que carguen las fuentes, así no se ve un
  cambio brusco de tipografía.
- Respeta `prefers-reduced-motion`: sin animaciones para quien lo prefiera.
- Accesible: el corazón es un botón real (funciona con teclado) y los textos
  animados tienen una copia legible para lectores de pantalla.
