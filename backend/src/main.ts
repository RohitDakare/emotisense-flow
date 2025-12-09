import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS for frontend communication
    app.enableCors({
        origin: ['http://localhost:5173', 'http://localhost:8080'], // Allow both default Vite port and 8080
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
    }));

    await app.listen(3001);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
