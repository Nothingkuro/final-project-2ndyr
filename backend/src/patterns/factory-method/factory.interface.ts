/**
 * Generic factory contract for transforming an input payload to an output shape.
 */
export interface IFactory<TInput, TOutput> {
    create(input: TInput): TOutput;
}
