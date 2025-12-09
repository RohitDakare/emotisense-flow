import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { MoodService } from './mood.service';
import { CreateMoodDto } from './dto/create-mood.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('moods')
@UseGuards(JwtAuthGuard)
export class MoodController {
    constructor(private readonly moodService: MoodService) { }

    @Post()
    create(@Request() req, @Body() createMoodDto: CreateMoodDto) {
        return this.moodService.create(createMoodDto, req.user.userId);
    }

    @Get()
    findAll(@Request() req) {
        return this.moodService.findAll(req.user.userId);
    }
}
