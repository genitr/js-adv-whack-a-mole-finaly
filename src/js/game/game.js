import PlayingField from "./field";
import Goblin from "./goblin";

export default class Game {
  constructor(
    container,
    iterations = 1,
    showDelay = 500,
    hideDelay = 1000,
    maxFails = 5,
  ) {
    this.iterations = iterations;
    this.showDelay = showDelay;
    this.hideDelay = hideDelay;
    this.maxFails = maxFails;
    this.playingField = null;
    this.goblin = null;
    this.isRunning = false;
    this.currentGoblinCell = null;
    this.score = 0;
    this.fails = 0;
    this.gameOverCalled = false;
    this.goblinWasClicked = false;
    this.goblinIsVisible = false;
    this.init(container);
  }

  init(container) {
    this.playingField = new PlayingField(container);
    this.playingField.createBoard();
    this.goblin = new Goblin();
    this.setupClickHandlers();
    this.createScoreDisplay();
  }

  /**
   * Создаем отображение счета
   */
  createScoreDisplay() {
    const scoreElement = document.createElement("div");
    scoreElement.id = "game-score";
    scoreElement.innerHTML = `
      <div style="font-family: Arial, sans-serif; font-size: 18px; margin: 10px;">
        <strong>Очки: <span id="score-value">${this.score}</span></strong> | 
        <strong>Провалы: <span id="fails-value">${this.fails}</span>/
        <span id="max-fails">${this.maxFails}</span></strong>
      </div>
    `;
    document.body.insertBefore(scoreElement, document.body.firstChild);

    // Создаем контейнер для кнопки рестарта
    const restartContainer = document.createElement("div");
    restartContainer.id = "restart-container";
    restartContainer.style.margin = "10px";
    scoreElement.appendChild(restartContainer);
  }

  /**
   * Обновляем отображение счета
   */
  updateScoreDisplay() {
    const scoreValue = document.getElementById("score-value");
    const failsValue = document.getElementById("fails-value");
    const maxFailsValue = document.getElementById("max-fails");

    if (scoreValue) scoreValue.textContent = this.score;
    if (failsValue) failsValue.textContent = this.fails;
    if (maxFailsValue) maxFailsValue.textContent = this.maxFails;

    // Меняем цвет счетчика промахов при приближении к лимиту
    if (failsValue) {
      if (this.fails >= this.maxFails) {
        failsValue.style.color = "red";
        failsValue.style.fontWeight = "bold";
      } else if (this.fails >= this.maxFails - 1) {
        failsValue.style.color = "orange";
      } else {
        failsValue.style.color = "";
      }
    }
  }

  /**
   * Настраиваем обработчики кликов
   */
  setupClickHandlers() {
    if (this.playingField.field) {
      this.playingField.field.addEventListener("click", (event) => {
        this.handleCellClick(event);
      });
    }
  }

  /**
   * Обработчик клика по ячейке
   */
  handleCellClick(event) {
    if (!this.isRunning || this.gameOverCalled) return;

    const cell = this.playingField.colClass();
    const clickedCell = event.target.closest(cell);

    if (clickedCell) {
      // Проверяем, есть ли в ячейке гоблин
      const goblin = this.goblin.goblinInCellClass(false);
      const hasGoblin = clickedCell.classList.contains(goblin);

      if (hasGoblin && clickedCell === this.currentGoblinCell) {
        this.score++;
        this.goblinWasClicked = true;
        console.log("Попадание! +1 очко");
        clickedCell.style.backgroundColor = "lightgreen";

        // Дополнительные эффекты при попадании
        clickedCell.style.transform = "scale(0.95)";
        setTimeout(() => {
          clickedCell.style.transform = "scale(1)";
        }, 150);

        // Сразу скрываем гоблина после попадания
        this.hideAllGoblins();
      } else {
        this.fails++;
        console.log("Промах! +1 провал");
        clickedCell.style.backgroundColor = "lightcoral";

        // Проверяем, не достигли ли лимита промахов
        if (this.fails >= this.maxFails) {
          this.gameOver("Превышено максимальное количество промахов!");
          return;
        }
      }

      this.updateScoreDisplay();

      // Сбрасываем цвет через короткое время
      if (this.isRunning && !this.gameOverCalled) {
        setTimeout(() => {
          clickedCell.style.backgroundColor = "";
        }, 300);
      }
    }
  }

  checkGameState() {
    if (this.fails >= this.maxFails && !this.gameOverCalled) {
      this.gameOver("Превышено максимальное количество промахов!");
      return true;
    }
    return false;
  }

  /**
   * Завершение игры
   */
  gameOver(reason = "") {
    if (this.gameOverCalled) return;
    this.gameOverCalled = true;

    this.isRunning = false;
    this.hideAllGoblins();

    console.log(
      `Игра окончена! ${reason} Финальный счет: Очки: ${this.score} / Промахи: ${this.fails}`,
    );

    // Сбрасываем все стили ячеек
    this.resetAllCellStyles();

    // Показываем итоговый результат (только один раз)
    setTimeout(() => {
      alert(
        `Игра окончена!\n${reason}\n\nОчки: ${this.score}\nПромахи: ${this.fails}`,
      );
    }, 100);

    // Можно добавить кнопку перезапуска
    this.showRestartButton();
  }

  /**
   * Сбрасываем стили всех ячеек
   */
  resetAllCellStyles() {
    const col = this.playingField.colClass();
    document.querySelectorAll(col).forEach((cell) => {
      cell.style.backgroundColor = "";
      cell.style.transform = "";
    });
  }

  /**
   * Показываем кнопку перезапуска
   */
  showRestartButton() {
    const restartContainer = document.getElementById("restart-container");
    if (!restartContainer) return;

    // Очищаем контейнер перед добавлением новой кнопки
    restartContainer.innerHTML = "";

    const restartBtn = document.createElement("button");
    restartBtn.textContent = "Играть снова";
    restartBtn.style.cssText = `
      padding: 10px 20px;
      font-size: 16px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-top: 5px;
    `;

    restartBtn.onclick = () => {
      this.restart();
    };

    restartContainer.appendChild(restartBtn);
  }

  /**
   * Перезапуск игры
   */
  restart() {
    this.score = 0;
    this.fails = 0;
    this.isRunning = false;
    this.gameOverCalled = false;
    this.goblinWasClicked = false;
    this.currentGoblinCell = null;

    // Сбрасываем стили ячеек
    this.resetAllCellStyles();

    // Обновляем отображение и скрываем кнопку рестарта
    this.updateScoreDisplay();
    this.hideRestartButton();

    // Запускаем игру заново
    setTimeout(() => {
      this.start();
    }, 100);
  }

  /**
   * Скрываем кнопку рестарта
   */
  hideRestartButton() {
    const restartContainer = document.getElementById("restart-container");
    if (restartContainer) {
      restartContainer.innerHTML = "";
    }
  }

  /**
   * Задержка выполнения
   * @param {ms} ms Миллисекунды
   * @returns Promise
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  showGoblinInCell() {
    // Выбираем случайную ячейку
    const randomCell = this.playingField.getRandomIndex();
    this.goblin.show(randomCell);
    this.currentGoblinCell = randomCell;
    this.goblinWasClicked = false;
    this.goblinIsVisible = true;
  }

  hideAllGoblins() {
    const col = this.playingField.colClass();
    document.querySelectorAll(col).forEach((cell) => {
      this.goblin.hide(cell);
      for (const child of cell.children) {
        child.remove();
      }
    });
    this.currentGoblinCell = null;
    this.goblinIsVisible = false;
  }

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.score = 0;
    this.fails = 0;
    this.goblinWasClicked = false;
    this.updateScoreDisplay();

    console.log("Игра началась!");

    for (let i = 0; i < this.iterations; i++) {
      if (this.fails >= this.maxFails || this.gameOverCalled) {
        if (!this.gameOverCalled) {
          this.gameOver("Превышено максимальное количество промахов!");
        }
        break;
      }

      console.log(`Раунд ${i + 1}`);
      this.showGoblinInCell();

      // Ждем указанное время
      await this.delay(this.hideDelay);

      this.hideAllGoblins();

      if (i < this.iterations - 1) {
        await this.delay(this.showDelay);
      }
    }

    // Если игра завершилась не по промахам, а по завершению итераций
    if (this.isRunning && this.fails < this.maxFails && !this.gameOverCalled) {
      this.stop();
    }
  }

  /**
   * Ожидание клика по гоблину
   */
  waitForGoblinClick() {
    return new Promise((resolve) => {
      const checkClick = () => {
        if (
          this.goblinWasClicked ||
          !this.currentGoblinCell ||
          this.fails >= this.maxFails ||
          this.gameOverCalled
        ) {
          resolve();
          return;
        }
        setTimeout(checkClick, 100);
      };
      checkClick();
    });
  }

  stop() {
    // Защита от двойного вызова
    if (this.gameOverCalled) return;
    this.gameOverCalled = true;

    this.isRunning = false;
    this.hideAllGoblins();
    this.resetAllCellStyles();

    console.log(
      `Игра окончена! Финальный счет: Очки: ${this.score} / Промахи: ${this.fails}`,
    );

    setTimeout(() => {
      alert(`Игра окончена!\nОчки: ${this.score}\nПромахи: ${this.fails}`);
      this.showRestartButton();
    }, 100);
  }
}
