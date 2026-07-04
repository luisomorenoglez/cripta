import { TILE } from "./dungeon.js";

// Shadowcasting recursivo en 8 octantes.
const OCTANTS = [
  [1, 0, 0, 1],
  [0, 1, 1, 0],
  [0, -1, 1, 0],
  [-1, 0, 0, 1],
  [-1, 0, 0, -1],
  [0, -1, -1, 0],
  [0, 1, -1, 0],
  [1, 0, 0, -1],
];

export function computeFov(map, ox, oy, radius) {
  const visible = new Set();
  visible.add(key(ox, oy));
  for (const [xx, xy, yx, yy] of OCTANTS) {
    castLight(map, visible, ox, oy, radius, 1, 1.0, 0.0, xx, xy, yx, yy);
  }
  return visible;
}

export function key(x, y) {
  return y * 1000 + x;
}

function blocksLight(map, x, y) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return true;
  return map.grid[y][x] === TILE.WALL;
}

function castLight(map, visible, ox, oy, radius, row, start, end, xx, xy, yx, yy) {
  if (start < end) return;
  const radius2 = radius * radius;
  let newStart = 0;

  for (let i = row; i <= radius; i++) {
    let blocked = false;
    for (let dx = -i, dy = -i; dx <= 0; dx++) {
      const lSlope = (dx - 0.5) / (dy + 0.5);
      const rSlope = (dx + 0.5) / (dy - 0.5);
      if (start < rSlope) continue;
      if (end > lSlope) break;

      const x = ox + dx * xx + dy * xy;
      const y = oy + dx * yx + dy * yy;

      if (dx * dx + dy * dy <= radius2) {
        visible.add(key(x, y));
      }

      if (blocked) {
        if (blocksLight(map, x, y)) {
          newStart = rSlope;
        } else {
          blocked = false;
          start = newStart;
        }
      } else if (blocksLight(map, x, y) && i < radius) {
        blocked = true;
        castLight(map, visible, ox, oy, radius, i + 1, start, lSlope, xx, xy, yx, yy);
        newStart = rSlope;
      }
    }
    if (blocked) break;
  }
}
