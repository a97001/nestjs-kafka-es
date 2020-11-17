import { prop } from "@typegoose/typegoose";
import { ObjectId } from "mongodb";
import { ICqrsMessage } from "../interfaces/ICqrsMessage";

export class CqrsEvent implements ICqrsMessage {
    @prop()
    public readonly _id: string;

    @prop()
    public readonly aggregateId: string;

    @prop()
    public readonly aggregateType: string;

    @prop()
    public readonly createdAt: Date;

    @prop()
    public readonly version: number;

    constructor(aggregateId: string, version: number) {
        // if (!this._id) {
        this._id = new ObjectId().toHexString();
        this.createdAt = new Date();
        // }
        this.aggregateId = aggregateId;
        // this.aggregateType = this.aggregateType;
        this.createdAt = new Date();
        this.version = version;
    }
}
