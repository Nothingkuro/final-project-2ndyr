export interface IFactory<TInput, TOutput> {
    create(input: TInput): TOutput;
}
