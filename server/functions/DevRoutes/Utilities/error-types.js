class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = "NotFoundError";
    }
}

class MissingArgumentError extends Error {
    constructor(message) {
        super(message);
        this.name = "MissingArgumentError";
    }
}
  