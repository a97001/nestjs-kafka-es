import { CqrsEvent } from "./cqrs-event"

export abstract class AggregateRoot {
    private _changes: CqrsEvent[] = []
    protected _id: string
  
    get id(): string {
      return this._id
    }
  
    private _version: number
  
    public getUncommittedChanges(): CqrsEvent[] {
      return this._changes
    }
  
    markChangesAsCommitted(): void {
      this._changes.length = 0
    }
  
    loadFromHistory(history: CqrsEvent[]): void {
      history.forEach((event) => {
        this.applyChangeInternal(event, false)
      })
    }
  
    protected applyChange(event: CqrsEvent): void {
      this.applyChangeInternal(event, true)
    }
  
    private applyChangeInternal(event: CqrsEvent, isNew = false): void {
      if (!this[`apply${event.constructor.name}`]) {
        throw new Error(
          `No handler found for ${event.constructor.name}. Be sure to define a method called apply${event.constructor.name} on the aggregate.`
        )
      }
  
      this[`apply${event.constructor.name}`](event)
      this._version += 1
  
      if (isNew) {
        this._changes.push(event)
      }
    }
  }