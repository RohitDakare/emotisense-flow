import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Post()
    create(@Request() req, @Body() createEventDto: CreateEventDto) {
        return this.eventsService.create(createEventDto, req.user.userId);
    }

    @Get()
    findAll(@Request() req) {
        return this.eventsService.findAll(req.user.userId);
    }
}
