import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type EventDocument = Event & Document;

@Schema()
export class Event {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    time: string;

    @Prop()
    predictedMood: string;

    @Prop()
    tag: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: User;
}

export const EventSchema = SchemaFactory.createForClass(Event);
