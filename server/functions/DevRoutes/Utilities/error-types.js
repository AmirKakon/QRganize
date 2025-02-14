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

const mapErrorToStatusCode = (error) => {
    switch (true) {
        case error instanceof NotFoundError:
          return 404;
        case error instanceof MissingArgumentError:
          return 400;
        default:
          return 500;
      }
};

module.exports = { mapErrorToStatusCode }
  