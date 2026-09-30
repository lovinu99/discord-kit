export class NotifyError extends Error {
  readonly name = 'NotifyError';
  readonly channel: string;
  readonly status?: number;
  readonly attempts: number;
  override readonly cause?: unknown;

  constructor(
    message: string,
    details: {
      channel: string;
      status?: number;
      attempts: number;
      cause?: unknown;
    },
  ) {
    super(message, { cause: details.cause });
    this.channel = details.channel;
    this.status = details.status;
    this.attempts = details.attempts;
    this.cause = details.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}