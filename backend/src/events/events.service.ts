import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument } from './schemas/event.schema';

@Injectable()
export class EventsService {
    constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) { }

    async create(createEventDto: CreateEventDto, userId: string): Promise<Event> {
        const createdEvent = new this.eventModel({
            ...createEventDto,
            userId,
        });
        return createdEvent.save();
    }

    async findAll(userId: string): Promise<Event[]> {
        return this.eventModel.find({ userId } as any).exec();
    }
}
