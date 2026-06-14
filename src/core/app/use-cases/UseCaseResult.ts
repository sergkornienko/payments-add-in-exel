export class UseCaseResult {
  static Ok(message: string = "Слава Україні!"): UseCaseResult {
    return new UseCaseResult(200, message);
  }

  static UnknownError(message: string = "Невідома помилка"): UseCaseResult {
    return new UseCaseResult(500, message);
  }

  static ValidationError(message: string = "Вхідні дані мають помилку"): UseCaseResult {
    return new UseCaseResult(400, message);
  }

  constructor(
    private readonly status: 200 | 400 | 500,
    readonly message: string
  ) {}

  isError(): boolean {
    return this.status !== 200;
  }
}
