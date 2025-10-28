jest.mock("../../../img/goblin.png", () => "test-goblin.png");
import Game from "../game";

describe("Game", () => {
  let container;
  let game;

  beforeEach(() => {
    container = document.createElement("div");
    container.className = "playing-field";
    document.body.appendChild(container);

    game = new Game(container, 3, 10, 2);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    const score = document.getElementById("game-score");
    if (score && score.parentNode) {
      score.parentNode.removeChild(score);
    }
    document.querySelectorAll(".modal-container").forEach((el) => el.remove());

    jest.restoreAllMocks();
    jest.useRealTimers();
    game = undefined;
  });

  test("Увеличивает счет при клике по ячейке с гоблином и не увеличивает промахи", () => {
    game.isRunning = true;

    // Выбираем конкретную ячейку
    const cell = container.querySelector(".col");

    // Показать гоблина и выставить текущую ячейку
    game.goblin.show(cell);
    game.currentGoblinCell = cell;

    // Имитируем клик по ячейке
    const evt = new MouseEvent("click", { bubbles: true });
    cell.dispatchEvent(evt);
    game.resetAllCellStyles();

    expect(game.score).toBe(1);
    expect(game.fails).toBe(0);
    expect(game.goblinWasClicked).toBe(true);
    expect(game.currentGoblinCell).toBeNull();
    expect(cell.style.backgroundColor).toBe("");

    // Проверка UI
    const scoreValue = document.getElementById("score-value");
    const failsValue = document.getElementById("fails-value");
    expect(scoreValue.textContent).toBe("1");
    expect(failsValue.textContent).toBe("0");
  });

  test("Увеличивает промах при отсутствии клика после появления гоблина", () => {
    game.isRunning = true;

    const cell = container.querySelector(".col");
    jest.spyOn(game.playingField, "getRandomIndex").mockReturnValue(cell);

    game.showGoblinInCell();
    expect(game.currentGoblinCell).toBe(cell);

    game.hideAllGoblins();
    expect(game.fails).toBe(1);
    expect(game.currentGoblinCell).toBeNull();

    // Обновляем UI вручную, как это делает цикл игры
    game.updateScoreDisplay();
    const failsValue = document.getElementById("fails-value");
    expect(failsValue.textContent).toBe("1");
  });

  test("checkGameState вызывает gameOver при достижении лимита промахов и создает модалку", () => {
    game.fails = game.maxFails; // == 2
    const res = game.checkGameState();
    expect(res).toBe(true);
    expect(game.gameOverCalled).toBe(true);
    expect(game.isRunning).toBe(false);

    const modal = container.querySelector(".modal-container");
    expect(modal).not.toBeNull();
  });

  test("stop завершает игру, скрывает гоблинов и показывает модалку", () => {
    // Подготовим состояние с "появившимся" гоблином
    const cell = container.querySelector(".col");
    game.isRunning = true;
    game.goblin.show(cell);
    game.currentGoblinCell = cell;

    game.stop();

    expect(game.isRunning).toBe(false);
    const modal = container.querySelector(".modal-container");
    expect(modal).not.toBeNull();
    // После stop не должно быть текущей ячейки
    expect(game.currentGoblinCell).toBeNull();
  });

  test("restart сбрасывает состояние, закрывает модалку и перезапускает игру", () => {
    jest.useFakeTimers();

    // Зафиксируем, что start будет вызван без реального запуска игры
    const startSpy = jest.spyOn(game, "start").mockResolvedValue();

    // Инициируем окончание игры для показа модалки с кнопкой рестарта
    game.gameOver();

    const modal = container.querySelector(".modal-container");
    expect(modal).not.toBeNull();

    // Кнопка рестарта внутри модалки
    const restartBtn = modal.querySelector("button.restart");
    expect(restartBtn).not.toBeNull();

    restartBtn.click();

    // Продвигаем таймер (restart вызывает start через setTimeout 100мс)
    jest.advanceTimersByTime(100);

    expect(startSpy).toHaveBeenCalled();
    expect(game.score).toBe(0);
    expect(game.fails).toBe(0);
    expect(game.gameOverCalled).toBe(false);

    // Модалка должна быть закрыта
    expect(container.querySelector(".modal-container")).toBeNull();
  });

  test("updateScoreDisplay меняет цвет при достижении порогов промахов", () => {
    // На один меньше максимума
    game.fails = game.maxFails - 1; // 1
    game.updateScoreDisplay();
    let failsValue = document.getElementById("fails-value");
    expect(failsValue.style.color).toBe("orange");

    // Равен максимуму
    game.fails = game.maxFails; // 2
    game.updateScoreDisplay();
    failsValue = document.getElementById("fails-value");
    expect(failsValue.style.color).toBe("red");

    // Ниже порога
    game.fails = 0;
    game.updateScoreDisplay();
    failsValue = document.getElementById("fails-value");
    expect(failsValue.style.color).toBe("");
  });

  test("createModal: кнопка закрытия удаляет модалку и показывает кнопку рестарта", () => {
    game.gameOver();
    const modal = container.querySelector(".modal-container");
    expect(modal).not.toBeNull();

    const closeBtn = Array.from(modal.querySelectorAll("button")).find(
      (btn) => btn.textContent === "×",
    );
    expect(closeBtn).toBeDefined();

    closeBtn.click();

    expect(container.querySelector(".modal-container")).toBeNull();
    const restartContainer = document.getElementById("restart-container");
    expect(restartContainer.querySelector("button.restart")).not.toBeNull();
  });

  test("createModal: клик по фону закрывает, клик по окну не закрывает", () => {
    game.gameOver();
    let modal = container.querySelector(".modal-container");
    const modalWindow = modal.querySelector(".modal-window");

    // Клик по окну не закрывает
    modalWindow.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(container.querySelector(".modal-container")).not.toBeNull();

    // Клик по фону закрывает
    modal.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(container.querySelector(".modal-container")).toBeNull();
  });

  test("setupClickHandlers: клик по полю вызывает handleCellClick", () => {
    const spy = jest.spyOn(game, "handleCellClick");
    const evt = new MouseEvent("click", { bubbles: true });
    container.dispatchEvent(evt);
    expect(spy).toHaveBeenCalledWith(evt);
    spy.mockRestore();
  });

  test("showGoblinInCell устанавливает текущую ячейку и флаги", () => {
    game.showGoblinInCell();
    expect(game.currentGoblinCell).not.toBeNull();
    expect(game.goblinWasClicked).toBe(false);
    expect(game.clickHappened).toBe(false);
  });

  test("start с нулевым количеством итераций вызывает stop и показывает модалку", async () => {
    game.iterations = 0;
    await game.start();
    expect(container.querySelector(".modal-container")).not.toBeNull();
    expect(game.isRunning).toBe(false);
  });

  test("gameOver идемпотентен: повторный вызов не создает вторую модалку", () => {
    game.isRunning = true;
    game.gameOver("test");
    const countAfterFirst =
      container.querySelectorAll(".modal-container").length;
    game.gameOver("second");
    const countAfterSecond =
      container.querySelectorAll(".modal-container").length;

    expect(countAfterFirst).toBe(1);
    expect(countAfterSecond).toBe(1);
    expect(game.gameOverCalled).toBe(true);
    expect(game.isRunning).toBe(false);
  });

  test("handleCellClick: промах меняет фон и сбрасывает эффекты по таймеру", () => {
    jest.useFakeTimers();
    game.isRunning = true;

    const cell = container.querySelector(".col");
    // Убедимся, что это не текущая ячейка гоблина и без класса гоблина
    game.currentGoblinCell = null;

    // Симулируем клик по не-гоблин ячейке
    game.handleCellClick({ target: cell });

    expect(cell.style.backgroundColor).toBe("lightcoral");
    expect(cell.style.transform).toBe("scale(0.95)");

    // После 150мс transform должен восстановиться
    jest.advanceTimersByTime(150);

    // После 300мс фон должен очиститься
    jest.advanceTimersByTime(150);
    expect(cell.style.backgroundColor).toBe("");
  });

  test("hideAllGoblins: не увеличивает промахи, если clickHappened = true", () => {
    game.isRunning = true;
    const cell = container.querySelector(".col");
    game.currentGoblinCell = cell;
    game.clickHappened = true;
    game.fails = 0;

    game.hideAllGoblins();

    expect(game.fails).toBe(0);
    expect(game.currentGoblinCell).toBeNull();
  });

  test("hideAllGoblins: не увеличивает промахи, если нет текущей ячейки", () => {
    game.isRunning = true;
    game.currentGoblinCell = null;
    game.clickHappened = false;
    game.fails = 1;

    game.hideAllGoblins();

    expect(game.fails).toBe(1);
    expect(game.currentGoblinCell).toBeNull();
  });

  test("resetAllCellStyles очищает стили у всех ячеек", () => {
    const cells = container.querySelectorAll(".col");
    cells.forEach((c) => {
      c.style.backgroundColor = "lightgreen";
      c.style.transform = "scale(0.8)";
    });

    game.resetAllCellStyles();

    cells.forEach((c) => {
      expect(c.style.backgroundColor).toBe("");
      expect(c.style.transform).toBe("");
    });
  });

  test("delay возвращает промис, который резолвится через указанное время", async () => {
    jest.useFakeTimers();
    let resolved = false;
    const p = game.delay(200).then(() => {
      resolved = true;
    });
    // до сдвига времени промис не резолвится
    await Promise.resolve();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(199);
    await Promise.resolve();
    expect(resolved).toBe(false);

    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(resolved).toBe(true);
    await p;
  });

  test("start выполняет заданное количество итераций и вызывает методы цикла", async () => {
    game.iterations = 2;
    // делаем задержку мгновенной
    game.delay = jest.fn().mockResolvedValue();
    const showSpy = jest.spyOn(game, "showGoblinInCell");
    const hideSpy = jest.spyOn(game, "hideAllGoblins");
    const updateSpy = jest.spyOn(game, "updateScoreDisplay");
    const stopSpy = jest.spyOn(game, "stop").mockImplementation(() => {
      game.isRunning = false; // минимальная имитация
    });

    await game.start();

    expect(game.isRunning).toBe(true);
    expect(showSpy).toHaveBeenCalledTimes(2);
    expect(hideSpy).toHaveBeenCalledTimes(2);
    // updateScoreDisplay вызывается 1 раз перед циклом и по 1 разу на итерацию
    expect(updateSpy).toHaveBeenCalledTimes(1 + 2);

    showSpy.mockRestore();
    hideSpy.mockRestore();
    updateSpy.mockRestore();
    stopSpy.mockRestore();
  });

  test("stop при gameOverCalled=true завершает выполнение без побочных эффектов", () => {
    game.gameOverCalled = true;
    const hideSpy = jest.spyOn(game, "hideAllGoblins");
    const resetSpy = jest.spyOn(game, "resetAllCellStyles");
    const modalSpy = jest.spyOn(game, "createModal");

    game.stop();

    expect(hideSpy).not.toHaveBeenCalled();
    expect(resetSpy).not.toHaveBeenCalled();
    expect(modalSpy).not.toHaveBeenCalled();

    hideSpy.mockRestore();
    resetSpy.mockRestore();
    modalSpy.mockRestore();
  });

  test("hideRestartButton очищает контейнер, если кнопка присутствует", () => {
    // сначала создадим кнопку рестарта в контейнере
    game.showRestartButton();
    const restartContainer = document.getElementById("restart-container");
    expect(restartContainer.querySelector(".restart")).not.toBeNull();

    game.hideRestartButton();

    expect(restartContainer.innerHTML).toBe("");
  });

  test("showRestartButton корректно возвращается, если контейнер отсутствует", () => {
    const containerEl = document.getElementById("restart-container");
    containerEl.remove();
    expect(() => game.showRestartButton()).not.toThrow();
  });

  test("checkGameState возвращает false, когда промахов меньше максимума и gameOver не вызван", () => {
    game.fails = 0;
    game.maxFails = 5;
    game.gameOverCalled = false;
    const res = game.checkGameState();
    expect(res).toBe(false);
  });

  test("createRestartButton создает стилизованную кнопку 'Играть снова'", () => {
    const parent = document.createElement("div");
    game.createRestartButton(parent);
    const btn = parent.querySelector("button.restart");
    expect(btn).not.toBeNull();
    expect(btn.textContent).toBe("Играть снова");
    // Проверяем ключевые inline-стили
    expect(btn.style.padding).toBe("10px 20px");
    expect(btn.style.fontSize).toBe("16px");
    expect(btn.style.color).toBe("white");
    expect(btn.style.borderRadius).toBe("5px");
    expect(btn.style.cursor).toBe("pointer");
  });

  test("handleCellClick (hit) вызывает resetAllCellStyles через 150мс", () => {
    jest.useFakeTimers();
    game.isRunning = true;
    const cell = container.querySelector(".col");
    const goblinClass = game.goblin.goblinInCellClass(false);
    cell.classList.add(goblinClass);
    game.currentGoblinCell = cell;

    const resetSpy = jest.spyOn(game, "resetAllCellStyles");

    const evt = new MouseEvent("click", { bubbles: true });
    cell.dispatchEvent(evt);

    expect(resetSpy).not.toHaveBeenCalled();
    jest.advanceTimersByTime(150);
    expect(resetSpy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test("start вызывает delay с hideDelay на каждой итерации", async () => {
    game.iterations = 2;
    const delaySpy = jest.spyOn(game, "delay").mockResolvedValue();
    const stopSpy = jest.spyOn(game, "stop").mockImplementation(() => {
      game.isRunning = false;
    });

    await game.start();

    expect(delaySpy).toHaveBeenCalledTimes(2);
    // Проверяем, что хотя бы один вызов был с текущим hideDelay
    expect(delaySpy).toHaveBeenCalledWith(game.hideDelay);

    stopSpy.mockRestore();
  });

  test("start вызывает stop после завершения всех итераций при выполнении условий", async () => {
    game.iterations = 1;
    jest.spyOn(game, "delay").mockResolvedValue();
    const stopSpy = jest.spyOn(game, "stop").mockImplementation(() => {
      game.isRunning = false;
    });

    await game.start();

    expect(stopSpy).toHaveBeenCalled();
  });

  test("start не вызывает stop, если к концу итерации достигнут лимит промахов", async () => {
    game.iterations = 1;
    game.maxFails = 1;
    jest.spyOn(game, "delay").mockResolvedValue();
    const stopSpy = jest.spyOn(game, "stop");

    await game.start();

    expect(game.fails).toBe(1);
    expect(stopSpy).not.toHaveBeenCalled();
  });

  test("stop вызывает hideAllGoblins, resetAllCellStyles и createModal", () => {
    const hideSpy = jest.spyOn(game, "hideAllGoblins");
    const resetSpy = jest.spyOn(game, "resetAllCellStyles");
    const modalSpy = jest.spyOn(game, "createModal");

    game.isRunning = true;
    game.stop();

    expect(hideSpy).toHaveBeenCalled();
    expect(resetSpy).toHaveBeenCalled();
    expect(modalSpy).toHaveBeenCalledWith(game.playingField.field);
  });

  test("start возвращается немедленно, если уже запущена", async () => {
    game.isRunning = true;
    const showSpy = jest.spyOn(game, "showGoblinInCell");
    const delaySpy = jest.spyOn(game, "delay");
    const stopSpy = jest.spyOn(game, "stop");

    await game.start();

    expect(showSpy).not.toHaveBeenCalled();
    expect(delaySpy).not.toHaveBeenCalled();
    expect(stopSpy).not.toHaveBeenCalled();
  });

  test("start вызывает stop (конец цикла, реальные побочные эффекты)", async () => {
    game.iterations = 1;
    jest.spyOn(game, "delay").mockResolvedValue();
    const stopSpy = jest.spyOn(game, "stop");

    await game.start();

    expect(stopSpy).toHaveBeenCalled();
    expect(game.isRunning).toBe(false);
    // модалка создана
    expect(container.querySelector(".modal-container")).not.toBeNull();
  });

  test("start не вызывает stop, если gameOverCalled=true к концу цикла", async () => {
    game.iterations = 1;
    jest.spyOn(game, "delay").mockResolvedValue();
    const stopSpy = jest.spyOn(game, "stop");

    // Форсируем флаг, чтобы финальная проверка не прошла
    game.gameOverCalled = true;

    await game.start();

    expect(stopSpy).not.toHaveBeenCalled();
  });
});
