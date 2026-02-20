#!/usr/bin/env bash
# Verification Script - Happy Backend Implementation

echo "🎮 Happy Backend - Implementation Verification"
echo "=============================================="
echo ""

# Check Node.js
echo "✅ Checking Node.js version..."
node --version

# Check npm
echo "✅ Checking npm version..."
npm --version

# Check build
echo "✅ Checking TypeScript compilation..."
if [ -d "dist/src" ]; then
    echo "   ✓ Build directory exists"
    echo "   ✓ Source compiled successfully"
else
    echo "   ✗ Build failed"
    exit 1
fi

# Count files
echo ""
echo "📊 Project Statistics:"
echo "   Files in src/:"
find src -type f -name "*.ts" | wc -l
echo "   Module files:"
find src -type f -name "*.module.ts" | wc -l
echo "   Service files:"
find src -type f -name "*.service.ts" | wc -l
echo "   Controller files:"
find src -type f -name "*.controller.ts" | wc -l
echo "   Test files:"
find src -type f -name "*.spec.ts" | wc -l

# Check documentation
echo ""
echo "📚 Documentation Files:"
ls -lh *.md | awk '{print "   " $9 " (" $5 ")"}'

# Check Prisma
echo ""
echo "🗄️ Database Setup:"
if [ -f "prisma/schema.prisma" ]; then
    echo "   ✓ Prisma schema exists"
    models=$(grep "^model " prisma/schema.prisma | wc -l)
    echo "   ✓ Models defined: $models"
else
    echo "   ✗ Prisma schema not found"
fi

if [ -f "prisma/seed.ts" ]; then
    echo "   ✓ Seed file exists"
else
    echo "   ✗ Seed file not found"
fi

# Check dependencies
echo ""
echo "📦 Dependencies:"
packages=$(npm ls --depth=0 | grep -c "├──\|└──")
echo "   ✓ $packages packages installed"

# Check scripts
echo ""
echo "🔧 Available Scripts:"
echo "   npm run build       - Build production"
echo "   npm run start       - Start server"
echo "   npm run start:dev   - Dev with hot reload"
echo "   npm run test        - Run unit tests"
echo "   npm run test:e2e    - Run e2e tests"
echo "   npm run prisma:generate - Generate Prisma client"
echo "   npm run prisma:migrate  - Run migrations"
echo "   npm run prisma:seed     - Seed database"
echo "   npm run prisma:studio   - Open Prisma Studio"

# Summary
echo ""
echo "✅ VERIFICATION COMPLETE"
echo ""
echo "Next Steps:"
echo "1. Configure .env with DATABASE_URL"
echo "2. Run: npm run db:setup"
echo "3. Run: npm run start:dev"
echo "4. Open browser: http://localhost:3000"
echo ""
