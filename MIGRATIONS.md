# Migration Guide for Happy Backend

## Creating a New Migration

When you modify `prisma/schema.prisma`, create a migration:

```bash
npm run prisma:migrate -- --name add_new_model
```

This will:
1. Compare your schema to the database
2. Detect changes
3. Generate a migration file in `prisma/migrations/`
4. Apply changes to development database
5. Regenerate Prisma client

## Viewing Migrations

```bash
# List all migrations and their status
npm run prisma:migrate -- status

# View a specific migration SQL
cat prisma/migrations/[timestamp]_[name]/migration.sql
```

## Rolling Back Changes (Development)

For MongoDB, use:
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Then re-run seeds
npm run prisma:seed
```

## Production Migrations

```bash
# Plan migrations without applying
npx prisma migrate diff --from-url $OLD_DB_URL --to-url $NEW_DB_URL

# Deploy specific migrations
npx prisma migrate deploy
```

## Schema Changes Workflow

1. **Update schema.prisma**
```prisma
model NewModel {
  id    String  @id @default(auto()) @map("_id") @db.ObjectId
  name  String
}
```

2. **Create migration**
```bash
npm run prisma:migrate -- --name add_new_model
```

3. **Review migration file**
```bash
cat prisma/migrations/[timestamp]_add_new_model/migration.sql
```

4. **Test locally**
```bash
npm run start:dev
```

5. **Commit and push**
```bash
git add prisma/migrations
git commit -m "feat: add NewModel migration"
```

## Common Migration Scenarios

### Adding a New Field
```prisma
// In model
newField: String?  // optional
```

```bash
npm run prisma:migrate -- --name add_new_field_to_model
```

### Making a Field Required
```prisma
// Change from
field: String?

// To
field: String
```

```bash
npm run prisma:migrate -- --name make_field_required
```

### Adding a Relationship
```prisma
model Parent {
  id       String   @id @default(auto()) @map("_id") @db.ObjectId
  children Child[]
}

model Child {
  id       String @id @default(auto()) @map("_id") @db.ObjectId
  parentId String @db.ObjectId
  parent   Parent @relation(fields: [parentId], references: [id])
}
```

```bash
npm run prisma:migrate -- --name add_parent_child_relationship
```

### Removing a Model
```bash
# Remove from schema.prisma

npm run prisma:migrate -- --name remove_old_model
```

## Seeding Data

### Adding New Seeds
Edit `prisma/seed.ts`:

```typescript
async function main() {
  // Existing seeds...
  
  // New seeds
  await prisma.customModel.createMany({
    data: [
      { field: 'value1' },
      { field: 'value2' },
    ],
  });
}
```

### Run Seeds
```bash
npm run prisma:seed
```

## Troubleshooting Migrations

### "Migration already applied"
```bash
# Check status
npm run prisma:migrate -- status

# If stuck, reset development database
npx prisma migrate reset
```

### "Cannot find migration files"
```bash
# Check migration history
npx prisma migrate status

# View all migrations
ls -la prisma/migrations/
```

### Schema validation errors
```bash
# Validate schema syntax
npx prisma validate
```

### MongoDB connection issues
```bash
# Test connection
npx prisma db execute --stdin < migration.sql
```

## Best Practices

1. **Test locally first**: Always test migrations on development database
2. **Review SQL**: Check generated SQL before applying to production
3. **Backup production**: Always backup MongoDB before major migrations
4. **Test rollback**: Know how to recover from failed migrations
5. **Commit migrations**: Always version control migration files
6. **Document changes**: Add comments to schema.prisma
7. **Use descriptive names**: Migration names should describe the change

## Reference

- [Prisma Migrations Documentation](https://www.prisma.io/docs/orm/prisma-migrate)
- [Prisma MongoDB Guide](https://www.prisma.io/docs/orm/overview/databases/mongodb)
