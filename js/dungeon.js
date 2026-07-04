import { randInt } from "./rng.js";

export const TILE = {
  WALL: "#",
  FLOOR: ".",
  STAIRS: ">",
};

export function generateDungeon(rng, width, height, depth) {
  const grid = Array.from({ length: height }, () => Array(width).fill(TILE.WALL));
  const rooms = [];
  const maxRooms = 12 + Math.min(depth, 6);

  for (let i = 0; i < maxRooms * 6 && rooms.length < maxRooms; i++) {
    const w = randInt(rng, 4, 10);
    const h = randInt(rng, 3, 7);
    const x = randInt(rng, 1, width - w - 2);
    const y = randInt(rng, 1, height - h - 2);
    const room = { x, y, w, h, cx: x + Math.floor(w / 2), cy: y + Math.floor(h / 2) };

    if (rooms.some((r) => intersects(r, room, 1))) continue;

    carveRoom(grid, room);
    if (rooms.length > 0) {
      const prev = rooms[rooms.length - 1];
      carveCorridor(grid, rng, prev.cx, prev.cy, room.cx, room.cy);
    }
    rooms.push(room);
  }

  const last = rooms[rooms.length - 1];
  grid[last.cy][last.cx] = TILE.STAIRS;

  return { grid, rooms, width, height };
}

function intersects(a, b, pad) {
  return (
    a.x - pad < b.x + b.w &&
    a.x + a.w + pad > b.x &&
    a.y - pad < b.y + b.h &&
    a.y + a.h + pad > b.y
  );
}

function carveRoom(grid, room) {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      grid[y][x] = TILE.FLOOR;
    }
  }
}

function carveCorridor(grid, rng, x1, y1, x2, y2) {
  // Pasillo en L; el orden horizontal/vertical se elige al azar.
  if (rng() < 0.5) {
    carveH(grid, x1, x2, y1);
    carveV(grid, y1, y2, x2);
  } else {
    carveV(grid, y1, y2, x1);
    carveH(grid, x1, x2, y2);
  }
}

function carveH(grid, x1, x2, y) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) grid[y][x] = TILE.FLOOR;
}

function carveV(grid, y1, y2, x) {
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) grid[y][x] = TILE.FLOOR;
}

export function isWalkable(map, x, y) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
  return map.grid[y][x] !== TILE.WALL;
}
