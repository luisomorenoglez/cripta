# CRIPTA

Un roguelike clásico en el navegador. Sin dependencias, sin build: JavaScript vanilla y un `<canvas>`.

**desciende. sobrevive. repite.**

🎮 **[Jugar ahora](https://luisomorenoglez.github.io/cripta/)**

## Características

- **Mazmorras procedurales** — salas y pasillos generados con un RNG con semilla (mulberry32), distintas en cada partida.
- **Campo de visión real** — shadowcasting recursivo en 8 octantes, con niebla de guerra que recuerda lo explorado.
- **Combate por turnos** — ataca chocando contra los enemigos; ellos te persiguen cuando te ven.
- **5 tipos de monstruo** — de la humilde rata al troll, con estadísticas que escalan con la profundidad.
- **Progresión** — XP, subidas de nivel, pociones de vida y oro.
- **Profundidad infinita** — cada nivel es más peligroso. ¿Hasta dónde llegarás?

## Jugar

Abre el juego con cualquier servidor estático (usa módulos ES, así que `file://` no sirve):

```bash
npx serve .
# o
python -m http.server
```

## Controles

| Tecla | Acción |
|---|---|
| `←↑↓→` / `WASD` | Moverse / atacar |
| `Q` | Beber poción |
| `Espacio` | Esperar un turno |
| `R` | Reiniciar |

## Estructura

```
js/
├── rng.js      # RNG con semilla
├── dungeon.js  # generación procedural (salas + pasillos en L)
├── fov.js      # shadowcasting recursivo
├── game.js     # estado, turnos, combate, IA, progresión
├── render.js   # dibujado en canvas + UI
└── main.js     # entrada de teclado y arranque
```

## Ideas futuras

- [ ] Más objetos: armas, armaduras, pergaminos
- [ ] Jefes cada 5 niveles
- [ ] Pathfinding A* para los monstruos
- [ ] Sonido
- [ ] Puntuaciones guardadas en localStorage

---

Hecho con [Claude Code](https://claude.com/claude-code).
