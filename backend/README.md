# EmotiSense Flow Backend

This is the NestJS backend for the EmotiSense Flow application.

## Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
    *Note: If you encounter type errors during build like "Cannot find type definition file for...", try installing the missing types, e.g., `npm i -D @types/yargs-parser @types/express ...`*

## Running the app

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

The server runs on `http://localhost:3000` by default.

## API Endpoints

### Moods

*   **POST /moods**: Create a new mood entry.
    *   Body: `{ "mood": "happy", "note": "Feeling great!", "timestamp": "2023-10-27T10:00:00Z" }`
*   **GET /moods**: Get all mood entries.

### Events

*   **POST /events**: Create a new event.
    *   Body: `{ "title": "Meeting", "time": "10:00 AM", "predictedMood": "neutral", "tag": "Work" }`
*   **GET /events**: Get all events.

## Integration

To integrate with the frontend:
1.  Ensure the backend is running.
2.  Update the frontend to fetch data from `http://localhost:3000` instead of using `localStorage` or mock data.
