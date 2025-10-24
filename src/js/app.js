import Game from "./game/game";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".playing-field");
  const game = new Game(container);
  game.start();
});
