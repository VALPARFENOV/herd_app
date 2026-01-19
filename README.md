# HerdMaster Pro

Modern SaaS herd management system for dairy farms. A next-generation replacement for DairyComp 305 with cloud capabilities, mobile support, and AI-powered analytics.

## Features

- **Herd Management** - Digital animal cards with 142 metrics per animal
- **Reproduction** - Heat detection, breeding protocols, pregnancy prediction
- **Milk Production** - Daily tracking, lactation curves, quality monitoring
- **Veterinary** - Treatment logs, medication tracking, health alerts
- **Multi-tenancy** - Support for multiple farms with data isolation
- **Offline Mobile** - React Native app with sync capabilities

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Supabase (PostgreSQL, PostgREST, Auth) |
| Database | PostgreSQL 15 + TimescaleDB |
| Mobile | React Native + Expo (planned) |
| ML | FastAPI + Python (planned) |

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker (for local database)
- Supabase CLI (recommended)

### Installation

```bash
# Clone and install dependencies
git clone <repo-url>
cd herd_app
pnpm install

# Start local Supabase (recommended)
cd packages/database
supabase start

# Or use Docker
cd deploy
docker-compose up -d

# Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your Supabase credentials

# Run database migrations
cd packages/database
supabase db push

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
├── apps/
│   └── web/              # Next.js web application
├── packages/
│   └── database/         # SQL schemas, migrations, seeds
├── services/             # Backend microservices (planned)
├── deploy/               # Docker configurations
└── docs/                 # Documentation
```

## Development

```bash
# Start dev server
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Generate database types
cd packages/database
supabase gen types typescript --local > ../apps/web/src/types/database.generated.ts
```

## Database

The database schema is in `packages/database/schema/`. Key concepts:

- **Multi-tenancy** via Row Level Security (RLS)
- **TimescaleDB** for time-series data (milk readings, sensor data)
- All tables have `tenant_id` for isolation

To reset the database with seed data:

```bash
cd packages/database
supabase db reset
```

## Documentation

- [Product Specification](./saas_concept.md) - Full product requirements
- [Feature Hierarchy](./features_hierarchy.md) - Detailed feature breakdown
- [CLAUDE.md](./CLAUDE.md) - Technical context for AI assistants

## License

Proprietary - All rights reserved
