class RuntimeError {
  constructor(message) {
    this.name = 'ExpressionEvaluationError';
    this.message = message;
  }

  toJSON() {
    return this.message;
  }
}

module.exports = RuntimeError;
