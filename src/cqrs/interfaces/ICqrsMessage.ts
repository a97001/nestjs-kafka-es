// this is so we can pop both commands and events on a message bus
export interface ICqrsMessage {
    _id?: string;
    createdAt: Date;
}