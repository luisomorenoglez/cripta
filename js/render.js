import { MAP_W, MAP_H } from "./game.js";
import { TILE } from "./dungeon.js";
import { key } from "./fov.js";

export const CELL = 20;

const COLORS = {
  wallVisible: "#8888a8",
  wallExplored: "#333342",
  floorVisible: "#55556a",
  floorExplored: "#20202c",
  stairs: "#e0a020",
  player: "#f0e8d0",
  gold: "#e0c040",
  potion: "#d05070",
};

export function render(ctx, game) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, MAP_W * CELL, MAP_H * CELL);
  ctx.font = `${CELL - 2}px "Courier New", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const k = key(x, y);
      const visible = game.visible.has(k);
      const explored = game.explored.has(k);
      if (!visible && !explored) continue;

      const tile = game.map.grid[y][x];
      let char = tile;
      let color;
      if (tile === TILE.WALL) {
        color = visible ? COLORS.wallVisible : COLORS.wallExplored;
      } else if (tile === TILE.STAIRS) {
        color = visible ? COLORS.stairs : COLORS.wallExplored;
      } else {
        char = "·";
        color = visible ? COLORS.floorVisible : COLORS.floorExplored;
      }
      drawChar(ctx, char, x, y, color);
    }
  }

  for (const it of game.items) {
    if (!game.visible.has(key(it.x, it.y))) continue;
    if (it.kind === "gold") drawChar(ctx, "$", it.x, it.y, COLORS.gold);
    else drawChar(ctx, "!", it.x, it.y, COLORS.potion);
  }

  for (const m of game.monsters) {
    if (!game.visible.has(key(m.x, m.y))) continue;
    drawChar(ctx, m.char, m.x, m.y, m.color);
  }

  drawChar(ctx, "@", game.player.x, game.player.y, COLORS.player);

  if (game.over) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, MAP_W * CELL, MAP_H * CELL);
    ctx.fillStyle = "#c03030";
    ctx.font = `bold 42px "Courier New", monospace`;
    ctx.fillText("HAS MUERTO", (MAP_W * CELL) / 2, (MAP_H * CELL) / 2 - 20);
    ctx.fillStyle = "#c8c8d4";
    ctx.font = `16px "Courier New", monospace`;
    ctx.fillText(
      `Profundidad ${game.depth} · ${game.player.gold} de oro · Pulsa R para reintentar`,
      (MAP_W * CELL) / 2,
      (MAP_H * CELL) / 2 + 24
    );
  }
}

function drawChar(ctx, char, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillText(char, x * CELL + CELL / 2, y * CELL + CELL / 2 + 1);
}

export function renderUi(game) {
  const p = game.player;
  document.getElementById("hp").textContent = `${p.hp}/${p.maxHp}`;
  document.getElementById("hpfill").style.width = `${Math.max(0, (p.hp / p.maxHp) * 100)}%`;
  document.getElementById("plevel").textContent = p.level;
  document.getElementById("xp").textContent = `${p.xp}/${p.nextXp}`;
  document.getElementById("atk").textContent = p.atk;
  document.getElementById("def").textContent = p.def;
  document.getElementById("depth").textContent = game.depth;
  document.getElementById("gold").textContent = p.gold;
  document.getElementById("potions").textContent = p.potions;

  const logEl = document.getElementById("log");
  logEl.innerHTML = game.log
    .slice(-14)
    .map((e) => `<div class="entry ${e.cls}">${e.text}</div>`)
    .join("");
  logEl.scrollTop = logEl.scrollHeight;
}
