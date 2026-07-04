import { createRng, randInt, pick } from "./rng.js";
import { generateDungeon, isWalkable, TILE } from "./dungeon.js";
import { computeFov, key } from "./fov.js";

export const MAP_W = 60;
export const MAP_H = 33;
const FOV_RADIUS = 8;

const MONSTER_TYPES = [
  { name: "rata", char: "r", color: "#9a8866", hp: 4, atk: 2, def: 0, xp: 2, minDepth: 1 },
  { name: "murciélago", char: "m", color: "#8877aa", hp: 5, atk: 2, def: 0, xp: 3, minDepth: 1 },
  { name: "esqueleto", char: "e", color: "#d8d8c8", hp: 8, atk: 3, def: 1, xp: 6, minDepth: 2 },
  { name: "orco", char: "o", color: "#70a050", hp: 12, atk: 4, def: 1, xp: 10, minDepth: 3 },
  { name: "troll", char: "T", color: "#508070", hp: 20, atk: 6, def: 2, xp: 20, minDepth: 5 },
];

export function newGame(seed = Date.now()) {
  const game = {
    rng: createRng(seed),
    seed,
    depth: 0,
    player: {
      x: 0, y: 0,
      hp: 20, maxHp: 20,
      atk: 3, def: 1,
      level: 1, xp: 0, nextXp: 10,
      gold: 0, potions: 1,
    },
    map: null,
    monsters: [],
    items: [],
    visible: new Set(),
    explored: new Set(),
    log: [],
    over: false,
    won: false,
  };
  addLog(game, "Desciendes a la cripta. La luz de tu antorcha apenas alcanza.");
  descend(game);
  return game;
}

export function descend(game) {
  game.depth++;
  game.map = generateDungeon(game.rng, MAP_W, MAP_H, game.depth);
  game.explored = new Set();
  game.monsters = [];
  game.items = [];

  const rooms = game.map.rooms;
  game.player.x = rooms[0].cx;
  game.player.y = rooms[0].cy;

  // Poblar salas (menos la primera) con monstruos e ítems.
  const pool = MONSTER_TYPES.filter((m) => m.minDepth <= game.depth);
  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i];
    const nMonsters = randInt(game.rng, 0, 1 + Math.min(2, Math.floor(game.depth / 2)));
    for (let j = 0; j < nMonsters; j++) {
      const type = pick(game.rng, pool);
      const spot = freeSpot(game, room);
      if (!spot) continue;
      const scale = 1 + (game.depth - type.minDepth) * 0.15;
      game.monsters.push({
        ...type,
        x: spot.x, y: spot.y,
        hp: Math.round(type.hp * scale),
        maxHp: Math.round(type.hp * scale),
        atk: Math.round(type.atk * scale),
        awake: false,
      });
    }
    if (game.rng() < 0.45) {
      const spot = freeSpot(game, room);
      if (spot) {
        const kind = game.rng() < 0.55 ? "gold" : "potion";
        game.items.push({ kind, x: spot.x, y: spot.y });
      }
    }
  }

  if (game.depth > 1) addLog(game, `Bajas a la profundidad ${game.depth}.`, "good");
  refreshFov(game);
}

function freeSpot(game, room) {
  for (let tries = 0; tries < 20; tries++) {
    const x = randInt(game.rng, room.x, room.x + room.w - 1);
    const y = randInt(game.rng, room.y, room.y + room.h - 1);
    if (x === game.player.x && y === game.player.y) continue;
    if (game.map.grid[y][x] !== TILE.FLOOR) continue;
    if (game.monsters.some((m) => m.x === x && m.y === y)) continue;
    if (game.items.some((it) => it.x === x && it.y === y)) continue;
    return { x, y };
  }
  return null;
}

export function addLog(game, text, cls = "") {
  game.log.push({ text, cls });
  if (game.log.length > 60) game.log.shift();
}

function refreshFov(game) {
  game.visible = computeFov(game.map, game.player.x, game.player.y, FOV_RADIUS);
  for (const k of game.visible) game.explored.add(k);
}

export function movePlayer(game, dx, dy) {
  if (game.over) return;
  const nx = game.player.x + dx;
  const ny = game.player.y + dy;

  const target = game.monsters.find((m) => m.x === nx && m.y === ny);
  if (target) {
    attack(game, game.player, target, true);
  } else if (isWalkable(game.map, nx, ny)) {
    game.player.x = nx;
    game.player.y = ny;
    pickupItems(game);
    if (game.map.grid[ny][nx] === TILE.STAIRS) {
      descend(game);
      return; // descend ya refresca FOV y los monstruos son nuevos
    }
  } else {
    return; // chocar con un muro no consume turno
  }

  endTurn(game);
}

export function wait(game) {
  if (game.over) return;
  endTurn(game);
}

export function drinkPotion(game) {
  if (game.over) return;
  const p = game.player;
  if (p.potions <= 0) {
    addLog(game, "No te quedan pociones.");
    return;
  }
  if (p.hp >= p.maxHp) {
    addLog(game, "Ya estás al máximo de vida.");
    return;
  }
  p.potions--;
  const heal = randInt(game.rng, 6, 12);
  p.hp = Math.min(p.maxHp, p.hp + heal);
  addLog(game, `Bebes una poción y recuperas ${heal} PV.`, "good");
  endTurn(game);
}

function pickupItems(game) {
  const p = game.player;
  game.items = game.items.filter((it) => {
    if (it.x !== p.x || it.y !== p.y) return true;
    if (it.kind === "gold") {
      const amount = randInt(game.rng, 5, 15) * game.depth;
      p.gold += amount;
      addLog(game, `Recoges ${amount} de oro.`, "good");
    } else {
      p.potions++;
      addLog(game, "Encuentras una poción de vida.", "good");
    }
    return false;
  });
}

function attack(game, attacker, defender, byPlayer) {
  const dmg = Math.max(1, attacker.atk + randInt(game.rng, -1, 1) - defender.def);
  defender.hp -= dmg;
  if (byPlayer) {
    if (defender.hp <= 0) {
      addLog(game, `Matas a ${article(defender.name)} (+${defender.xp} XP).`, "combat");
      game.monsters = game.monsters.filter((m) => m !== defender);
      gainXp(game, defender.xp);
    } else {
      addLog(game, `Golpeas a ${article(defender.name)}: ${dmg} de daño.`, "combat");
    }
  } else {
    addLog(game, `${capitalize(article(attacker.name))} te golpea: ${dmg} de daño.`, "combat");
    if (defender.hp <= 0) {
      game.over = true;
      addLog(game, `Mueres en la profundidad ${game.depth} con ${game.player.gold} de oro. Pulsa R.`, "combat");
    }
  }
}

function gainXp(game, amount) {
  const p = game.player;
  p.xp += amount;
  while (p.xp >= p.nextXp) {
    p.xp -= p.nextXp;
    p.level++;
    p.nextXp = Math.round(p.nextXp * 1.6);
    p.maxHp += 4;
    p.hp = p.maxHp;
    if (p.level % 2 === 0) p.atk++;
    else p.def++;
    addLog(game, `¡Subes al nivel ${p.level}! Te sientes más fuerte.`, "good");
  }
}

function article(name) {
  return (name[0] === "o" ? "un " : name.endsWith("a") ? "una " : "un ") + name;
}

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);
}

function endTurn(game) {
  refreshFov(game);
  for (const m of game.monsters) {
    if (game.over) break;
    monsterTurn(game, m);
  }
  refreshFov(game);
}

function monsterTurn(game, m) {
  const p = game.player;
  const seen = game.visible.has(key(m.x, m.y));
  if (seen) m.awake = true;
  if (!m.awake) return;

  const dx = p.x - m.x;
  const dy = p.y - m.y;

  if (Math.abs(dx) + Math.abs(dy) === 1) {
    attack(game, m, p, false);
    return;
  }

  // Persecución simple: acercarse por el eje con mayor distancia,
  // probando el otro eje si el primero está bloqueado.
  const stepX = Math.sign(dx);
  const stepY = Math.sign(dy);
  const moves =
    Math.abs(dx) >= Math.abs(dy)
      ? [[stepX, 0], [0, stepY]]
      : [[0, stepY], [stepX, 0]];

  for (const [mx, my] of moves) {
    if (mx === 0 && my === 0) continue;
    const nx = m.x + mx;
    const ny = m.y + my;
    if (!isWalkable(game.map, nx, ny)) continue;
    if (nx === p.x && ny === p.y) continue;
    if (game.monsters.some((o) => o !== m && o.x === nx && o.y === ny)) continue;
    m.x = nx;
    m.y = ny;
    return;
  }
}
