# Fix: "Level not found" Error in Production

## Problem
The error `"Level not found"` appeared only in production when calling `/game/item-collect`, but worked fine in development.

## Root Cause
In development, the database seed was being run manually via `npm run db:setup`, which populated the `LevelData` table with level configurations. However, in production, the seed script was never executed, leaving the database empty of level data.

When the game service tried to validate item collection, it would look for level data in the database. If not found, it would silently fall back to default constraints instead of returning a proper error.

## Solution
Two complementary fixes were implemented:

### 1. Auto-Seeding on Application Startup
Created a new `DatabaseInitService` that automatically seeds the `LevelData` table when the application starts, ensuring that required level configurations are always available.

**Files created/modified:**
- `src/database/database-init.service.ts` - Handles seeding logic
- `src/database/database.module.ts` - NestJS module for database services
- `src/app.module.ts` - Imports the new DatabaseModule
- `src/main.ts` - Calls database initialization on bootstrap

### 2. Explicit Level Validation
Modified the game service to explicitly validate that levels exist in the database before processing requests:

**Files modified:**
- `src/game/game.service.ts`
  - `validateItemCollection()` - Now returns error if level is not found
  - `handleLevelComplete()` - Now verifies level exists before processing

## Changes Made

### src/game/game.service.ts
- Changed validation logic to return `{ valid: false, error: 'Level not found' }` if level data doesn't exist
- This ensures consistent error messages between development and production

### src/main.ts
- Added initialization call: `await databaseInitService.initializeDatabase();`
- Executes before the application starts listening for requests

### src/database/database-init.service.ts
- Automatically creates level configurations on first run
- Checks for existing data to avoid duplicate seeding
- Logs all operations for debugging

## How It Works

1. **Application Start**: When the server boots in production, the `DatabaseInitService` checks if level data exists
2. **Auto-Seed**: If no levels are found, it creates the default 5 levels with their configurations
3. **Validation**: All game operations now verify that requested levels exist in the database
4. **Error Handling**: Clear error messages are returned if a level cannot be found

## Testing

To verify the fix works:

```bash
# Production build
npm run build
npm run start:prod

# Check logs for:
# "🌱 Initializing database with seed data..."
# "✅ Database initialization completed successfully"

# Test the endpoint
curl -X PATCH http://localhost:3000/game/item-collect \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"levelId": 1, "itemType": "chocolate", "itemIndex": 0}'
```

## Impact

- **Development**: No changes required - existing workflow continues to work
- **Production**: Auto-seeding eliminates the need for manual database setup
- **Reliability**: Clear error messages if levels are misconfigured
- **Backwards Compatible**: No breaking changes to existing APIs
