export default class Helpers {
  /**
   * Génère un identifiant unique.
   */
  static generateId(prefix = "id") {
    this.handleIdCounter += 1;
    return `${prefix}-${this.handleIdCounter}`;
  }
}
