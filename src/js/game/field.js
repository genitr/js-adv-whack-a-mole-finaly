export default class PlayingField {
  constructor(container, rows = 4, cols = 4) {
    this.rows = rows;
    this.cols = cols;
    this.cells = null;
    this.field = container;
    this._rowClassName = "row";
    this._colClassName = "col";
    this.lastRandomIndex = -1;
  }

  rowClass(withDot = true) {
    return withDot ? `.${this._rowClassName}` : this._rowClassName;
  }

  colClass(withDot = true) {
    return withDot ? `.${this._colClassName}` : this._colClassName;
  }

  /**
   * Добавляет ряд в игровое поле с классом "row"
   * @returns Элемент div с классом "row"
   */
  addRow() {
    const row = document.createElement("div");
    row.classList.add(this.rowClass(false));
    this.field.append(row);
    return row;
  }

  /**
   * Добавляет столбец в игровое поле с классом "col"
   * @param {element} element
   */
  addCol(element) {
    const cell = document.createElement("div");
    cell.classList.add(this.colClass(false));
    element.append(cell);
  }

  /**
   * Создаёт игровое поле
   */
  createBoard() {
    Array.from({ length: this.cols }, () => {
      const row = this.addRow();
      Array.from({ length: this.rows }, () => this.addCol(row));
    });
    this.cells = document.querySelectorAll(this.colClass());
  }

  /**
   * Выбирает случайный индекс из массива cells
   * @returns Случайный индекс
   */
  getRandomIndex() {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * this.cells.length);
    } while (randomIndex === this.lastRandomIndex && this.cells.length > 1);

    this.lastRandomIndex = randomIndex;
    return this.cells[randomIndex];
  }
}
