export class BaseError extends Error {
  public name: string;

  public constructor(public message: string, public cause?: Error, public meta: Record<string, unknown> = {}) {
    super(message/*, { cause } */);
    this.name = this.constructor.name;
  }

  public serialize() {
    return {
      message: this.message,
      stack: this.stack,
      ...this.meta,
      originalError: {
        message: this.cause?.message,
        stack: this.cause?.stack,
      },
    };
  }
}
