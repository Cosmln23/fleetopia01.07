# Fleetopia - Transport & Logistics Marketplace

**Enterprise-grade transport marketplace platform with AI-powered features**

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run type-check
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/                   # Utilities, types, database
│   ├── __mocks__/         # Mock data (NOT imported in production)
│   ├── db.ts              # PostgreSQL database connection
│   ├── types.ts           # TypeScript interfaces
│   └── zodSchemas.ts      # Validation schemas
├── database/              # SQL schema files
├── docs/                  # All project documentation
└── contexts/              # React contexts
```

## ⚠️ Important Rules

### Mock Data Policy
- **Mock files live in `lib/__mocks__/`**
- **NEVER import mocks in `app/**` or `components/**`**
- Mock files are excluded from production builds via `tsconfig.json`
- Use mocks only for development tools/tests

### Code Quality
- Always run `npm run type-check` before commits
- Build must pass: `npm run build`
- Follow existing code patterns and naming conventions
- Preserve the dark theme interface - it's sacred! 🎨

## 🏗️ Current Features

### ✅ Marketplace System
- Complete cargo posting with GPS coordinates
- Real-time search & filtering (6 criteria)
- Offer request system with smart pricing
- Individual cargo detail pages

### ✅ Communication System
- AI Chat Widget (bottom-left)
- User-to-user messaging (header icons)
- System notifications & alerts
- Perfect dark theme integration

### ✅ Infrastructure
- PostgreSQL database on Railway
- Google Maps integration with geocoding
- Zod validation schemas
- TypeScript type safety

### 🚧 In Development
- Fleet management system (UI ready, backend coming)
- AI Dispatcher L0-L4 levels (UI ready, backend coming)
- Real-time GPS tracking integration

## 🗂️ Documentation

All detailed documentation is in the `docs/` folder:
- `CONSTRUCTIE-07-01-2025.md` - Complete build log
- `IMPLEMENTATION_PROGRESS.md` - Current status
- `PROJECT_DOCUMENTATION.md` - Technical details
- Migration guides for production deployment

## 🎯 Development Principles

1. **Surgical Precision** - No breaking changes to existing functionality
2. **Sacred Interface** - Dark theme and UX must remain untouched
3. **Progressive Enhancement** - Add features without breaking existing ones
4. **Production First** - Every change must build and deploy cleanly

## 🚀 Deployment

- **Database:** Railway PostgreSQL
- **Frontend:** Ready for Vercel/Netlify
- **Environment:** Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## 🤝 Contributing

1. Read `docs/PREFERINTE_LUCRU.md` for work preferences
2. Follow the mock data policy strictly
3. Test builds before pushing: `npm run build && npm run type-check`
4. Preserve the sacred dark theme interface

---

**Status:** Production ready marketplace + communication system. Fleet & AI features coming soon.