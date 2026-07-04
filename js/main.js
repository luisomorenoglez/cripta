import { newGame, movePlayer, wait, drinkPotion } from "./game.js";
import { render, renderUi } from "./render.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let game = newGame();
window.__cripta = () => game; // hook de depuración desde la consola

const MOVES = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
};

window.addEventListener("keydown", (e) => {
  if (e.key in MOVES) {
    e.preventDefault();
    const [dx, dy] = MOVES[e.key];
    movePlayer(game, dx, dy);
  } else if (e.key === " ") {
    e.preventDefault();
    wait(game);
  } else if (e.key === "q" || e.key === "Q") {
    drinkPotion(game);
  } else if (e.key === "r" || e.key === "R") {
    game = newGame();
  } else {
    return;
  }
  draw();
});

function draw() {
  render(ctx, game);
  renderUi(game);
}

draw();
