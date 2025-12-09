import { Injectable } from '@nestjs/common';
import { CreateMoodDto } from './dto/create-mood.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mood, MoodDocument } from './schemas/mood.schema';

@Injectable()
export class MoodService {
    constructor(@InjectModel(Mood.name) private moodModel: Model<MoodDocument>) { }

    async create(createMoodDto: CreateMoodDto, userId: string): Promise<Mood> {
        const createdMood = new this.moodModel({
            ...createMoodDto,
            userId,
            timestamp: createMoodDto.timestamp ? new Date(createMoodDto.timestamp) : new Date(),
        });
        return createdMood.save();
    }

    async findAll(userId: string): Promise<Mood[]> {
        return this.moodModel.find({ userId } as any).sort({ timestamp: -1 }).exec();
    }
}
