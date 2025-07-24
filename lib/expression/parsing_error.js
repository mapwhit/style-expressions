export default class ParsingError extends Error {
  constructor(key, message) {
    super(message);
    this.message = message;
    this.key = key;
  }
}
