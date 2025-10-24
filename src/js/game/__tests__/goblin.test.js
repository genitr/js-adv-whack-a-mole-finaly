jest.mock("../../../img/goblin.png", () => "test-goblin.png");
import Goblin from "../goblin";
import PlayingField from "../field";

describe("Goblin", () => {
  let container;
  let playingField;
  let goblin;
  beforeEach(() => {
    container = document.createElement("div");
    container.className = "playing-field";
    document.body.appendChild(container);
    playingField = new PlayingField(container);
    playingField.createBoard();
    goblin = new Goblin();
  });

  afterEach(() => {
    document.body.removeChild(container);
    playingField = undefined;
    goblin = undefined;
  });

  test("Гоблин появляется", () => {
    const randomCell = playingField.getRandomIndex();
    goblin.show(randomCell);
    const received = randomCell.classList[1];
    const expected = goblin.goblinInCellClass(false);
    expect(received).toEqual(expected);
  });

  test("Гоблин исчезает", () => {
    const randomCell = playingField.getRandomIndex();
    goblin.show(randomCell);
    goblin.hide(randomCell);
    const goblinClassName = goblin.goblinInCellClass(false);
    const received = randomCell.classList.contains(goblinClassName);
    const expected = false;
    expect(received).toEqual(expected);
  });

  test("Goblin.goblinInCellClass возвращает корректное значение", () => {
    const received = goblin.goblinInCellClass();
    const expected = ".theGoblinIsHere";
    expect(received).toBe(expected);
  });
});
