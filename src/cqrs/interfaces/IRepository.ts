import { AggregateRoot } from "../models/aggregate-root";

export interface IRepository<T extends AggregateRoot> {
    // save(T, expectedVersion: number): Promise<void>;

    getById(id: string): Promise<T>;
}