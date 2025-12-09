import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type MoodDocument = Mood & Document;

@Schema()
export class Mood {
    @Prop({ required: true })
    mood: string;

    @Prop()
    note: string;

    @Prop({ default: Date.now })
    timestamp: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: User;
}

export const MoodSchema = SchemaFactory.createForClass(Mood);
