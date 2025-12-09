import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';

export class CreateMoodDto {
    @IsString()
    @IsNotEmpty()
    @IsEnum(['happy', 'calm', 'tired', 'anxious', 'neutral', 'sad', 'energetic'])
    mood: string;

    @IsString()
    @IsOptional()
    note?: string;

    @IsDateString()
    @IsOptional()
    timestamp?: string;
}
