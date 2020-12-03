import { AggregateRoot } from '@nestjs/cqrs';

export interface IRepository<T extends AggregateRoot> {
    // save(T, expectedVersion: number): Promise<void>;

    getById(id: string): Promise<T>;
}