# Backend Implementation Plan

The current backend is a basic NestJS boilerplate with in-memory storage for Moods and Events. To make this a production-ready application, we need to add persistence (Database) and Authentication.

## Tech Stack Choice
- **Framework**: NestJS (Existing)
- **Database**: MongoDB (via @nestjs/mongoose & mongoose) - Flexible and suitable for document-based data like Moods/Events.
- **Authentication**: JWT (JSON Web Tokens) with Passport.

## Steps

### 1. Dependencies and Configuration
- Install `mongoose`, `@nestjs/mongoose`, `@nestjs/config`.
- Install `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`.
- Create `.env` file for configuration (MONGO_URI, JWT_SECRET).
- Configure `AppModule` to use `MongooseModule` and `ConfigModule`.

### 2. Users Module (New)
- Create `UsersModule`, `UsersService`, `UsersController`.
- Define `User` schema (email, password, name).
- Implement `create` (signup) and `findByEmail` (login).

### 3. Auth Module (New)
- Create `AuthModule`, `AuthService`, `AuthController`.
- Implement `login` and `register` endpoints.
- Implement `JwtStrategy` and `JwtAuthGuard` for protecting routes.

### 4. Upgrade Mood Module
- Define `Mood` schema (mood, note, timestamp, **userId**).
- Update `MoodService` to save/find from MongoDB.
- Protect `MoodController` routes with `JwtAuthGuard`.
- Associate created moods with the logged-in user.

### 5. Upgrade Events Module
- Define `Event` schema (title, time, predictedMood, tag, **userId**).
- Update `EventsService` to save/find from MongoDB.
- Protect `EventsController` routes.

## Execution Order
1. Install dependencies.
2. Setup Config and Database connection.
3. Create Users & Auth.
4. Refactor Mood & Events.
