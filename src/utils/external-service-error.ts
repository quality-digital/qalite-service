export class ExternalServiceError extends Error {
  constructor(
    public readonly service: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'ExternalServiceError'
  }
}
