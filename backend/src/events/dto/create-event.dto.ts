import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    time: string;

    @IsString()
    @IsNotEmpty()
    predictedMood: string;

    @IsString()
    @IsNotEmpty()
    tag: string;
}
