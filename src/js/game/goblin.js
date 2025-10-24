import goblinImage from "../../img/goblin.png";

export default class Goblin {
  constructor() {
    this.imageSrc = goblinImage;
    this._goblinInCellClass = "theGoblinIsHere";
  }

  goblinInCellClass(withDot = true) {
    return withDot ? `.${this._goblinInCellClass}` : this._goblinInCellClass;
  }

  show(location) {
    const image = document.createElement("img");
    image.src = this.imageSrc;
    image.alt = "";
    image.style.maxWidth = "100%";
    image.style.width = "auto";
    location.append(image);
    location.classList.add(this.goblinInCellClass(false));
  }

  hide(location) {
    location.classList.remove(this.goblinInCellClass(false));
  }
}
