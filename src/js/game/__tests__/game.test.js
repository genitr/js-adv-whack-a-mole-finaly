jest.mock("../../../img/goblin.png", () => "test-goblin.png");
import PlayingField from "../field";
import Goblin from "../goblin";
import Game from "../game";

jest.mock("../field");
jest.mock("../goblin");

describe("Game", () => {
  let container;
  let game;
  let mockPlayingField;
  let mockGoblin;

  beforeEach(() => {
    container = document.createElement("div");
    container.className = "game-container";
    document.body.appendChild(container);

    // Настраиваем моки
    mockPlayingField = {
      field: container,
      createBoard: jest.fn(),
      getRandomIndex: jest.fn(),
      colClass: jest.fn(() => ".col"),
      cells: ["cell1", "cell2", "cell3"],
    };

    mockGoblin = {
      show: jest.fn(),
      hide: jest.fn(),
      goblinInCellClass: jest.fn(() => "goblin"),
    };

    PlayingField.mockImplementation(() => mockPlayingField);
    Goblin.mockImplementation(() => mockGoblin);

    // Мокаем таймеры
    jest.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Очищаем созданные элементы
    const scoreElement = document.getElementById("game-score");
    if (scoreElement) {
      document.body.removeChild(scoreElement);
    }
  });

  describe("Инициализация", () => {
    beforeEach(() => {
      game = new Game(container);
    });

    test("Создание объекта класса PlayingField", () => {
      expect(PlayingField).toHaveBeenCalledWith(container);
    });

    test("Создание объекта класса Goblin", () => {
      expect(Goblin).toHaveBeenCalled();
    });

    test("Создание игрового поля", () => {
      expect(mockPlayingField.createBoard).toHaveBeenCalled();
    });

    test("Установка обработчика кликов", () => {
      const addEventListenerSpy = jest.spyOn(container, "addEventListener");

      game = new Game(container);

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
      );
      addEventListenerSpy.mockRestore();
    });

    test("Создание игрового счёта", () => {
      const scoreElement = document.getElementById("game-score");
      expect(scoreElement).toBeTruthy();
    });
  });

  describe("Управление игровым счётом", () => {
    beforeEach(() => {
      game = new Game(container);
    });

    test("Корректное обновление попаданий", () => {
      game.score = 3;
      game.updateScoreDisplay();
      const scoreValue = document.getElementById("score-value");
      expect(scoreValue.textContent).toBe("3");
    });

    test("Корректное обновление промахов", () => {
      game.fails = 2;
      game.updateScoreDisplay();
      const failsValue = document.getElementById("fails-value");
      expect(failsValue.textContent).toBe("2");
    });

    test("Изменение цвета количества промахов на orange", () => {
      game.fails = 4;
      game.updateScoreDisplay();
      const failsValue = document.getElementById("fails-value");
      expect(failsValue.style.color).toBe("orange");
    });

    test("Изменение цвета количества промахов на red", () => {
      game.fails = 5;
      game.updateScoreDisplay();
      const failsValue = document.getElementById("fails-value");
      expect(failsValue.style.color).toBe("red");
    });
  });

  describe("Обработка клика по ячейкам", () => {
    let clickEvent;
    beforeEach(() => {
      game = new Game(container);
      game.isRunning = true;
      clickEvent = new MouseEvent("click");
    });

    test("Игнорирование кликов если игра не запущена", () => {
      game.isRunning = false;
      const initialScore = game.score;
      const initialFails = game.fails;
      game.handleCellClick(clickEvent);
      expect(game.score).toBe(initialScore);
      expect(game.fails).toBe(initialFails);
    });

    test("Игнорирование кликов если был вызван gameOver", () => {
      game.gameOverCalled = true;
      const initialScore = game.score;
      const initialFails = game.fails;
      game.handleCellClick(clickEvent);
      expect(game.score).toBe(initialScore);
      expect(game.fails).toBe(initialFails);
    });

    test("Увеличение счёта попаданий если клик был по ячейке с гоблином", () => {
      const mockCell = document.createElement("div");
      mockCell.classList.add("col", "goblin");
      Object.defineProperty(clickEvent, "target", { value: mockCell });

      jest.spyOn(document, "querySelectorAll").mockReturnValue([mockCell]);
      game.currentGoblinCell = mockCell;

      const initialScore = game.score;
      game.handleCellClick(clickEvent);

      expect(game.score).toBe(initialScore + 1);
      expect(game.goblinWasClicked).toBe(true);
    });

    test("Увеличение счёта промахов если клик был не по ячейке с гоблином", () => {
      const mockCell = document.createElement("div");
      mockCell.classList.add("col");
      Object.defineProperty(clickEvent, "target", { value: mockCell });

      jest.spyOn(document, "querySelectorAll").mockReturnValue([mockCell]);

      const initialFails = game.fails;
      game.handleCellClick(clickEvent);

      expect(game.fails).toBe(initialFails + 1);
    });

    test("Вызов gameOver если превышено количество промахов", () => {
      const gameOverSpy = jest.spyOn(game, "gameOver");
      game.fails = 4;

      const mockCell = document.createElement("div");
      mockCell.classList.add("col");
      Object.defineProperty(clickEvent, "target", { value: mockCell });

      jest.spyOn(document, "querySelectorAll").mockReturnValue([mockCell]);

      game.handleCellClick(clickEvent);

      expect(gameOverSpy).toHaveBeenCalledWith(
        "Превышено максимальное количество промахов!",
      );
    });
  });

  describe("Управление гоблином", () => {
    beforeEach(() => {
      game = new Game(container);
    });

    test("Метод showGoblinInCell должен показать гоблина в случайной ячейке", () => {
      const mockCell = document.createElement("div");
      mockPlayingField.getRandomIndex.mockReturnValue(mockCell);

      game.showGoblinInCell();

      expect(mockPlayingField.getRandomIndex).toHaveBeenCalled();
      expect(mockGoblin.show).toHaveBeenCalledWith(mockCell);
      expect(game.currentGoblinCell).toBe(mockCell);
      expect(game.goblinIsVisible).toBe(true);
    });

    test("Метод hideAllGoblins должен удалить всех детей из ячейки", () => {
      // Создаем mock ячейки с дочерними элементами
      const mockCell1 = document.createElement("div");
      const mockCell2 = document.createElement("div");

      const child1 = document.createElement("img");
      const child2 = document.createElement("div");

      mockCell1.appendChild(child1);
      mockCell2.appendChild(child2);

      jest
        .spyOn(document, "querySelectorAll")
        .mockReturnValue([mockCell1, mockCell2]);

      game.hideAllGoblins();

      // Проверяем что дочерние элементы были удалены
      expect(mockCell1.children.length).toBe(0);
      expect(mockCell2.children.length).toBe(0);
      expect(game.currentGoblinCell).toBeNull();
      expect(game.goblinIsVisible).toBe(false);
    });

    test("Следует использовать setTimeout для опроса, когда условия не выполняются", async () => {
      game.isRunning = true;
      game.currentGoblinCell = document.createElement("div"); // Гоблин виден
      game.goblinWasClicked = false;
      game.fails = 0;
      game.gameOverCalled = false;

      const setTimeoutSpy = jest.spyOn(global, "setTimeout");

      const waitPromise = game.waitForGoblinClick();

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

      setTimeoutSpy.mock.calls[0][0]();

      // Разрешаем промис
      await Promise.resolve();

      let promiseResolved = false;
      waitPromise.then(() => {
        promiseResolved = true;
      });
      await Promise.resolve();
      expect(promiseResolved).toBe(false);

      game.goblinWasClicked = true;

      if (setTimeoutSpy.mock.calls[1]) {
        setTimeoutSpy.mock.calls[1][0]();
        await Promise.resolve();
      }

      await expect(waitPromise).resolves.toBeUndefined();

      setTimeoutSpy.mockRestore();
    });

    test("Должно разрешиться немедленно при щелчке по гоблину", async () => {
      game.isRunning = true;
      game.currentGoblinCell = document.createElement("div");
      game.goblinWasClicked = true;

      const waitPromise = game.waitForGoblinClick();

      await expect(waitPromise).resolves.toBeUndefined();
    });

    test("Должно разрешиться, когда игра окончена во время опроса", async () => {
      game.isRunning = true;
      game.currentGoblinCell = document.createElement("div");
      game.goblinWasClicked = false;
      game.gameOverCalled = false;

      const setTimeoutSpy = jest.spyOn(global, "setTimeout");

      const waitPromise = game.waitForGoblinClick();

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

      game.gameOverCalled = true;

      setTimeoutSpy.mock.calls[0][0]();
      await Promise.resolve();

      await expect(waitPromise).resolves.toBeUndefined();

      setTimeoutSpy.mockRestore();
    });

    test("Должно разрешиться, когда во время опроса достигнуто максимальное количество промахов", async () => {
      game.isRunning = true;
      game.currentGoblinCell = document.createElement("div");
      game.goblinWasClicked = false;
      game.fails = 0;
      game.maxFails = 3;
      game.gameOverCalled = false;

      const setTimeoutSpy = jest.spyOn(global, "setTimeout");

      const waitPromise = game.waitForGoblinClick();

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

      game.fails = 3;

      setTimeoutSpy.mock.calls[0][0]();
      await Promise.resolve();

      await expect(waitPromise).resolves.toBeUndefined();

      setTimeoutSpy.mockRestore();
    });
  });

  describe("Ход игры", () => {
    beforeEach(() => {
      game = new Game(container, 2, 100, 200, 3); // Короткие задержки для тестов
    });

    test("Метод start должен инициализировать игру", async () => {
      game.start();

      expect(game.isRunning).toBe(true);
      expect(game.score).toBe(0);
      expect(game.fails).toBe(0);
      expect(game.gameOverCalled).toBe(false);
    });

    test("Завершение итерации без превышения максимального количества промахов", async () => {
      const gameOverSpy = jest.spyOn(game, "gameOver");

      game.start();

      // Продвигаем таймеры через все итерации
      jest.advanceTimersByTime(1000);

      expect(gameOverSpy).not.toHaveBeenCalled();
    });

    test("setupClickHandlers должен подписать игровое поле на событие клика", () => {
      game.playingField.field = document.createElement("div");
      const addEventListenerSpy = jest.spyOn(
        game.playingField.field,
        "addEventListener",
      );

      game.setupClickHandlers();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "click",
        expect.any(Function),
      );

      const clickHandler = addEventListenerSpy.mock.calls[0][1];
      const mockEvent = { target: document.createElement("div") };
      const handleCellClickSpy = jest.spyOn(game, "handleCellClick");

      clickHandler(mockEvent);
      expect(handleCellClickSpy).toHaveBeenCalledWith(mockEvent);

      addEventListenerSpy.mockRestore();
      handleCellClickSpy.mockRestore();
    });

    test("Остановка игры если превышено максимальное количество промахов", async () => {
      const gameOverSpy = jest.spyOn(game, "gameOver");
      game.fails = game.maxFails;
      game.checkGameState();

      expect(gameOverSpy).toHaveBeenCalledWith(
        "Превышено максимальное количество промахов!",
      );

      gameOverSpy.mockRestore();
    });
  });

  describe("Окончание игры и перезапуск", () => {
    beforeEach(() => {
      game = new Game(container);
    });

    test("gameOver должен остановить игру и показать сообщение", () => {
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
      game.isRunning = true;

      expect(game.gameOverCalled).toBe(false);

      game.gameOver("Test reason");

      expect(game.isRunning).toBe(false);
      expect(game.gameOverCalled).toBe(true);

      jest.advanceTimersByTime(150);

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test reason"),
      );

      alertSpy.mockRestore();
    });

    test("gameOver должен быть вызван только один раз", () => {
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

      game.gameOver("First call");
      game.gameOver("Second call");

      jest.advanceTimersByTime(150);

      expect(alertSpy).toHaveBeenCalledTimes(1);
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("First call"),
      );

      alertSpy.mockRestore();
    });

    test("Рестарт должен сбросить состояние игры", () => {
      game.score = 5;
      game.fails = 3;
      game.isRunning = true;
      game.gameOverCalled = true;

      game.restart();

      expect(game.score).toBe(0);
      expect(game.fails).toBe(0);
      expect(game.isRunning).toBe(false);
      expect(game.gameOverCalled).toBe(false);
    });

    test("Кнопка перезапуска должна быть показана и скрыта", () => {
      game.showRestartButton();

      const restartContainer = document.getElementById("restart-container");
      expect(restartContainer.innerHTML).toContain("button");

      game.hideRestartButton();
      expect(restartContainer.innerHTML).toBe("");
    });
  });

  describe("Задержка выполнения", () => {
    beforeEach(() => {
      game = new Game(container);
    });

    test("Должно разрешиться после определенного времени", async () => {
      const delayPromise = game.delay(100);

      jest.advanceTimersByTime(100);

      await expect(delayPromise).resolves.toBeUndefined();
    });
  });

  describe("Ожидание клика по гоблину", () => {
    beforeEach(() => {
      game = new Game(container);
      game.isRunning = true;
    });

    test("Должно разрешиться немедленно после клика по гоблину", async () => {
      game.goblinWasClicked = true;

      const waitPromise = game.waitForGoblinClick();
      jest.advanceTimersByTime(100);

      await expect(waitPromise).resolves.toBeUndefined();
    });

    test("Должно разрешиться если gameOver был вызван", async () => {
      game.gameOverCalled = true;

      const waitPromise = game.waitForGoblinClick();
      jest.advanceTimersByTime(100);

      await expect(waitPromise).resolves.toBeUndefined();
    });
  });

  describe("Анимации", () => {
    test("Следует применять и сбрасывать анимацию масштабирования при клике по гоблину", () => {
      game.isRunning = true;
      game.gameOverCalled = false;

      const mockCell = document.createElement("div");
      mockCell.classList.add("col", "goblin");
      mockCell.style.transform = "";

      const clickEvent = new MouseEvent("click");
      Object.defineProperty(clickEvent, "target", { value: mockCell });

      const querySelectorAllSpy = jest
        .spyOn(document, "querySelectorAll")
        .mockImplementation((selector) => {
          if (selector === ".col") return [mockCell];
          return [];
        });

      game.currentGoblinCell = mockCell;
      game.handleCellClick(clickEvent);

      expect(mockCell.style.transform).toBe("scale(0.95)");

      jest.advanceTimersByTime(150);
      expect(mockCell.style.transform).toBe("scale(1)");

      querySelectorAllSpy.mockRestore();
    });

    test("Следует сбросить цвет фона ячейки после задержки при промахе", () => {
      game.isRunning = true;
      game.gameOverCalled = false;

      const mockCell = document.createElement("div");
      mockCell.classList.add("col");
      mockCell.style.backgroundColor = "lightcoral";

      const clickEvent = new MouseEvent("click");
      Object.defineProperty(clickEvent, "target", { value: mockCell });

      const querySelectorAllSpy = jest
        .spyOn(document, "querySelectorAll")
        .mockImplementation((selector) => {
          if (selector === ".col") return [mockCell];
          return [];
        });

      game.handleCellClick(clickEvent);

      expect(mockCell.style.backgroundColor).toBe("lightcoral");

      jest.advanceTimersByTime(300);
      expect(mockCell.style.backgroundColor).toBe("");

      querySelectorAllSpy.mockRestore();
    });
  });

  describe("Состояние игры", () => {
    test("Метод checkGameState должен вернуть false если количество промахов ниже максимума", () => {
      game.fails = 2;
      game.maxFails = 5;
      game.gameOverCalled = false;

      const result = game.checkGameState();

      expect(result).toBe(false);
    });

    test("Метод checkGameState должен вернуть true и вызвать gameOver если количество промахов больше максимума", () => {
      const gameOverSpy = jest.spyOn(game, "gameOver");
      game.fails = 5;
      game.maxFails = 5;
      game.gameOverCalled = false;

      const result = game.checkGameState();

      expect(result).toBe(true);
      expect(gameOverSpy).toHaveBeenCalledWith(
        "Превышено максимальное количество промахов!",
      );
      gameOverSpy.mockRestore();
    });

    test("Метод checkGameState должен вернуть false если gameOver уже был вызван", () => {
      game.fails = 5;
      game.maxFails = 5;
      game.gameOverCalled = true;

      const result = game.checkGameState();

      expect(result).toBe(false);
    });
  });

  describe("Кнопка перезапуска игры", () => {
    test("Метод showRestartButton должен вернуться раньше, если контейнер для перезапуска не найден", () => {
      const restartContainer = document.getElementById("restart-container");
      if (restartContainer) {
        restartContainer.remove();
      }

      expect(() => game.showRestartButton()).not.toThrow();
    });

    test("Кнопка перезапуска должна вернуть метод перезапуска", () => {
      game.createScoreDisplay();

      game.showRestartButton();

      const restartContainer = document.getElementById("restart-container");
      const restartBtn = restartContainer.querySelector("button");

      const restartSpy = jest.spyOn(game, "restart");

      restartBtn.onclick();

      expect(restartSpy).toHaveBeenCalled();
      restartSpy.mockRestore();
    });

    test("Перезапуск должен вызвать начало игры после задержки", () => {
      const startSpy = jest.spyOn(game, "start");

      game.restart();

      jest.advanceTimersByTime(100);

      expect(startSpy).toHaveBeenCalled();
      startSpy.mockRestore();
    });
  });

  describe("Крайние случаи метода запуска", () => {
    test("start должен вернуться немедленно, если уже запущен", () => {
      game.isRunning = true;
      const showGoblinSpy = jest.spyOn(game, "showGoblinInCell");

      game.start();

      expect(showGoblinSpy).not.toHaveBeenCalled();
      showGoblinSpy.mockRestore();
    });

    test("start должен вызывать gameOver, когда достигается максимальное количество промахов", async () => {
      game = new Game(container, 3, 100, 200, 2);

      const gameOverSpy = jest.spyOn(game, "gameOver");

      game.delay = jest.fn().mockResolvedValue();
      game.start();
      game.fails = 2;

      await Promise.resolve();
      await Promise.resolve();

      expect(gameOverSpy).toHaveBeenCalledWith(
        "Превышено максимальное количество промахов!",
      );

      gameOverSpy.mockRestore();
    });

    test("start должен прерывать цикл, когда gameOverCalled возвращает true", async () => {
      game = new Game(container, 5, 100, 200, 3);

      const gameOverSpy = jest.spyOn(game, "gameOver");

      game.start();
      game.gameOverCalled = true;

      jest.advanceTimersByTime(1000);

      expect(gameOverSpy).not.toHaveBeenCalled();

      gameOverSpy.mockRestore();
    });

    test("start должен вызывать stop после успешного завершения всех итераций", async () => {
      game = new Game(container, 2, 100, 200, 5);

      const stopSpy = jest.spyOn(game, "stop");
      const gameOverSpy = jest.spyOn(game, "gameOver");

      let delayResolve;
      game.delay = jest.fn(() => {
        return new Promise((resolve) => {
          delayResolve = resolve;
        });
      });

      game.start();

      delayResolve();
      await Promise.resolve();

      delayResolve();
      await Promise.resolve();

      delayResolve();
      await Promise.resolve();

      expect(stopSpy).toHaveBeenCalled();
      expect(gameOverSpy).not.toHaveBeenCalledWith(
        "Превышено максимальное количество промахов!",
      );

      stopSpy.mockRestore();
      gameOverSpy.mockRestore();
    });

    test("start должен проверять условие сбоя при каждом запуске итерации", async () => {
      game = new Game(container, 3, 100, 200, 2);

      const gameOverSpy = jest.spyOn(game, "gameOver");

      // Мокаем только delay и важные методы
      game.delay = jest.fn().mockResolvedValue();
      game.showGoblinInCell = jest.fn();
      game.hideAllGoblins = jest.fn();

      // Запускаем игру
      const startPromise = game.start();

      // Сразу устанавливаем промахи на максимум
      game.fails = 2;

      // Даем промису завершиться
      await startPromise;

      // Проверяем что gameOver был вызван
      expect(gameOverSpy).toHaveBeenCalledWith(
        "Превышено максимальное количество промахов!",
      );

      gameOverSpy.mockRestore();
    });
  });

  describe("Методы остановки", () => {
    test("Остановка игры должна установить правильное состояние и запланировать отображение окончания игры", () => {
      const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
      const showRestartSpy = jest.spyOn(game, "showRestartButton");
      const hideGoblinsSpy = jest.spyOn(game, "hideAllGoblins");
      const resetStylesSpy = jest.spyOn(game, "resetAllCellStyles");

      game.isRunning = true;
      game.gameOverCalled = false;

      game.stop();

      expect(game.gameOverCalled).toBe(true);
      expect(game.isRunning).toBe(false);
      expect(hideGoblinsSpy).toHaveBeenCalled();
      expect(resetStylesSpy).toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(alertSpy).toHaveBeenCalled();
      expect(showRestartSpy).toHaveBeenCalled();

      alertSpy.mockRestore();
      showRestartSpy.mockRestore();
      hideGoblinsSpy.mockRestore();
      resetStylesSpy.mockRestore();
    });

    test("Остановка игры должна вызваться раньше, если gameOver уже был вызван", () => {
      const hideGoblinsSpy = jest.spyOn(game, "hideAllGoblins");

      game.gameOverCalled = true;

      game.stop();

      expect(hideGoblinsSpy).not.toHaveBeenCalled();

      hideGoblinsSpy.mockRestore();
    });
  });
});
