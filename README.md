# ClientFlow

ClientFlow is a full-stack SaaS CRM dashboard built as a portfolio-grade project. It is designed to show practical product engineering across authentication, relational data modeling, dashboard analytics, billing simulation, testing, and deployment.

## Tech Stack

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- PostgreSQL on Neon
- Prisma ORM
- Auth.js
- Stripe test-mode billing
- Vitest for unit tests
- Playwright for browser tests
- Vercel for deployment

## Planned Features

- Workspace-based CRM dashboard
- Seeded demo account for portfolio visitors
- Client and lead management
- Deal pipeline with stages and values
- Task tracking and due dates
- Dashboard metrics
- Role-aware workspace access
- Stripe test checkout and subscription state
- Unit and end-to-end test coverage

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Then update `.env.local` with your local values. Real environment files are ignored by Git.

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/clientflow?sslmode=require"
AUTH_SECRET="replace-with-a-long-random-secret"
AUTH_URL="http://localhost:3000"
DEMO_USER_EMAIL="demo@clientflow.app"
DEMO_USER_PASSWORD="ChangeMe123!"
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
```

Stripe keys stay empty until the billing stage. The app will use Stripe test mode only.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

More scripts will be added as Prisma, seeding, Vitest, and Playwright are introduced.

## Development Roadmap

1. Scaffold Next.js app and baseline dashboard shell
2. Add database schema with Prisma and Neon PostgreSQL
3. Add Auth.js authentication and seeded demo login
4. Build clients, leads, deals, and tasks workflows
5. Add dashboard metrics and activity history
6. Add Stripe test-mode billing
7. Add Vitest and Playwright coverage
8. Deploy on Vercel with Neon

## Deployment Notes

The target deployment is Vercel Hobby with Neon Free Postgres. This keeps the project free to build, run, and show on a portfolio while still using a real production-style stack.
