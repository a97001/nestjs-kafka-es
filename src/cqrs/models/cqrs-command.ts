import { ObjectId } from "mongodb";
import { ICqrsMessage } from "../interfaces/ICqrsMessage";

export class CqrsCommand implements ICqrsMessage {
    public readonly createdAt: Date;

    constructor(
        public readonly _id?: string,
        public readonly expectedAggregateVersion?: number
    ) {
        if (!this._id) {
            this._id = new ObjectId().toHexString();
            this.createdAt = new Date();
            this.expectedAggregateVersion = 0;
        }
    }
}
