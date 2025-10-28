import PlayingField from "./field";
import Goblin from "./goblin";

export default class Game {
  constructor(container, iterations = 20, hideDelay = 1000, maxFails = 5) {
    this.iterations = iterations;
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
    this.clickHappened = false;
    this.currentModal = null;
    this.init(container);
  }

  /**
   * Инициализация
   * @param {Window.element} container Родительский элемент
   */
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
        <span id="max-fails">${this.maxFails}</span></span></strong>
      </div>
    `;
    document.body.before(scoreElement, document.body.firstChild);

    // Создаем контейнер для кнопки рестарта
    const restartContainer = document.createElement("div");
    restartContainer.id = "restart-container";
    restartContainer.style.margin = "10px";
    scoreElement.append(restartContainer);
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
   * @param {Window.event} event Перехваченное событие
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
        this.clickHappened = true;
        this.score++;
        this.goblinWasClicked = true;
        console.log("Попадание! +1 очко");
        clickedCell.style.backgroundColor = "lightgreen";

        // Дополнительные эффекты при попадании
        clickedCell.style.transform = "scale(0.95)";
        setTimeout(() => {
          this.resetAllCellStyles();
        }, 150);

        // Сразу скрываем гоблина после попадания
        this.hideAllGoblins();
      } else {
        clickedCell.style.backgroundColor = "lightcoral";
        clickedCell.style.transform = "scale(0.95)";
        setTimeout(() => {
          this.resetAllCellStyles();
        }, 150);
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

  /**
   * Проверка состояния игры
   * @returns {boolean} Окончена игра или нет
   */
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

    this.createModal(this.playingField.field);
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
   * Создание кнопки перезапуска игры
   * @param {Window.element} parent Родительский элемент
   */
  createRestartButton(parent) {
    const restartBtn = document.createElement("button");
    restartBtn.classList.add("restart");
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

    // restartBtn.addEventListener("mouseenter", () => {
    //   restartBtn.style.background = "#45a049";
    // });

    // restartBtn.addEventListener("mouseleave", () => {
    //   restartBtn.style.background = "#4CAF50";
    // });

    restartBtn.onclick = () => {
      this.restart();
    };

    parent.append(restartBtn);
  }

  /**
   * Показываем кнопку перезапуска
   */
  showRestartButton() {
    const restartContainer = document.getElementById("restart-container");
    if (!restartContainer) return;

    // Очищаем контейнер перед добавлением новой кнопки
    restartContainer.innerHTML = "";

    this.createRestartButton(restartContainer);
  }

  /**
   *
   * @param {Window.element} element Родительский элемент
   */
  createModal(element) {
    const targetElement = element;

    // Создаем контейнер для модального окна
    const modalContainer = document.createElement("div");
    modalContainer.className = "modal-container";
    modalContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.7);
    `;

    // Создаем модальное окно
    const modalWindow = document.createElement("div");
    modalWindow.className = "modal-window";
    modalWindow.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        text-align: center;
        position: absolute;
        min-width: 300px;
    `;
    const gameOverText = "Игра окончена!";
    const failText = "Вы проиграли!";

    modalWindow.innerHTML = `
        <h2>${this.gameOverCalled ? failText : gameOverText}</h2>
        <p>Финальный счет:</p>
        <p><strong>Очки: ${this.score}</strong></p>
        <p><strong>Промахи: ${this.fails}/${this.maxFails}</strong></p>
    `;

    // Создаем кнопку закрытия
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    `;

    // Добавляем обработчики событий
    closeBtn.addEventListener("click", () => {
      this.closeCurrentModal();
      this.showRestartButton();
    });

    // Обработчик для закрытия по клику на фон
    modalContainer.addEventListener("click", (e) => {
      if (e.target === modalContainer) {
        this.closeCurrentModal();
        this.showRestartButton();
      }
    });

    // Предотвращаем закрытие при клике на само модальное окно
    modalWindow.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Собираем модальное окно
    modalWindow.prepend(closeBtn);
    this.createRestartButton(modalWindow);
    modalContainer.append(modalWindow);
    targetElement.append(modalContainer);

    // Сохраняем ссылку на текущее модальное окно
    this.currentModal = modalContainer;
  }

  /**
   * Закрытие текущего модального окна
   */
  closeCurrentModal() {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
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
    this.clickHappened = false;

    // Сбрасываем стили ячеек
    this.resetAllCellStyles();

    // Обновляем отображение и скрываем кнопку рестарта
    this.updateScoreDisplay();

    this.hideRestartButton();

    this.closeCurrentModal();

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
      const button = document.querySelector(".restart");
      const hasButton = Array.from(restartContainer.children).some(
        (child) => child === button,
      );
      if (hasButton) {
        restartContainer.innerHTML = "";
      }
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

  /**
   * Появление гоблина в случайной ячейке
   */
  showGoblinInCell() {
    // Выбираем случайную ячейку
    const randomCell = this.playingField.getRandomIndex();
    this.goblin.show(randomCell);
    this.currentGoblinCell = randomCell;
    this.goblinWasClicked = false;
    this.clickHappened = false;
  }

  /**
   * Удаление гоблина
   */
  hideAllGoblins() {
    const col = this.playingField.colClass();
    document.querySelectorAll(col).forEach((cell) => {
      this.goblin.hide(cell);
      for (const child of cell.children) {
        child.remove();
      }
    });
    if (!this.clickHappened && this.currentGoblinCell) {
      this.fails += 1;
    }
    this.currentGoblinCell = null;
  }

  /**
   * Запускает игровой процесс
   *
   */
  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.score = 0;
    this.fails = 0;
    this.goblinWasClicked = false;
    this.clickHappened = false;
    this.updateScoreDisplay();

    console.log("Игра началась!");

    for (let i = 0; i < this.iterations; i++) {
      if (this.fails >= this.maxFails || this.gameOverCalled) {
        this.gameOver("Превышено максимальное количество промахов!");
        break;
      }

      console.log(`Раунд ${i + 1}`);
      this.showGoblinInCell();

      // Ждем указанное время
      await this.delay(this.hideDelay);

      this.hideAllGoblins();

      this.updateScoreDisplay();
    }

    // Если игра завершилась не по промахам, а по завершению итераций
    if (this.isRunning && this.fails < this.maxFails && !this.gameOverCalled) {
      this.stop();
    }
  }

  /**
   * Завершение игры после завершения цикла
   *
   */
  stop() {
    // Защита от двойного вызова
    if (this.gameOverCalled) return;
    this.isRunning = false;
    this.hideAllGoblins();
    this.resetAllCellStyles();

    this.createModal(this.playingField.field);
  }
}
