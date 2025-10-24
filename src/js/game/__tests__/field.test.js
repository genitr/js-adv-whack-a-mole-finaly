import PlayingField from "../field";

describe("PlayingField", () => {
  let container;
  let playingField;
  beforeEach(() => {
    container = document.createElement("div");
    container.className = "playing-field";
    document.body.appendChild(container);
    playingField = new PlayingField(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    playingField = undefined;
  });

  test("Создание игрового поля с корректным числом строк", () => {
    playingField.createBoard();
    const rows = container.querySelectorAll(".row");
    expect(rows.length).toBe(4);
  });

  test("Создание игрового поля с корректным числом столбцов", () => {
    playingField.createBoard();
    const rows = container.querySelectorAll(".row");
    rows.forEach((row) => {
      const cols = row.querySelectorAll(".col");
      expect(cols.length).toBe(4);
    });
  });

  test("Свойство PlayingField.cells правильно инициализируется после создания игрового поля", () => {
    playingField.createBoard();
    expect(playingField.cells).toBeDefined();
    expect(playingField.cells.length).toBe(16);
  });

  test("PlayingField.rowClass возвращает корректное значение", () => {
    const received = playingField.rowClass();
    const expected = `.${playingField._rowClassName}`;
    expect(`${received}`).toEqual(expected);
  });

  test("PlayingField.getRandomIndex возвращает случайный не повторяющийся элемент", () => {
    playingField.createBoard();
    const result1 = playingField.getRandomIndex();
    const result2 = playingField.getRandomIndex();
    expect(result1).not.toBe(result2);
  });
});
