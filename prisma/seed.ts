import { PrismaPg } from "@prisma/adapter-pg";
import { compare, hash } from "bcryptjs";
import { config } from "dotenv";
import {
  ActivityType,
  ClientStatus,
  DealStage,
  MemberRole,
  PrismaClient,
  SubscriptionPlan,
  SubscriptionStatus,
  TaskPriority,
  TaskStatus,
} from "../src/generated/prisma/client";

config({ path: ".env.local" });
config();

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL must be set before seeding.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
};

async function main() {
  const demoEmail = process.env["DEMO_USER_EMAIL"] || "demo@clientflow.app";
  const demoPassword = process.env["DEMO_USER_PASSWORD"] || "ChangeMe123!";
  const passwordHash = await hash(demoPassword, 12);

  await prisma.workspace.deleteMany({
    where: { slug: "clientflow-demo" },
  });

  await prisma.user.deleteMany({
    where: { email: demoEmail },
  });

  const user = await prisma.user.create({
    data: {
      name: "Onyeukwu Agbafo",
      email: demoEmail,
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "ClientFlow Demo",
      slug: "clientflow-demo",
      memberships: {
        create: {
          role: MemberRole.OWNER,
          user: {
            connect: { id: user.id },
          },
        },
      },
      subscription: {
        create: {
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: addDays(30),
        },
      },
    },
  });

  const northstar = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: "Northstar Labs",
      status: ClientStatus.ACTIVE,
      industry: "AI Infrastructure",
      website: "https://northstar.example",
      estimatedValue: "24000",
      contacts: {
        create: [
          {
            name: "Amina Bello",
            email: "amina@northstar.example",
            phone: "+1 555 0147",
            title: "Head of Operations",
          },
        ],
      },
    },
  });

  const clearline = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: "Clearline Finance",
      status: ClientStatus.PROSPECT,
      industry: "Fintech",
      website: "https://clearline.example",
      estimatedValue: "18500",
      contacts: {
        create: [
          {
            name: "Daniel Hart",
            email: "daniel@clearline.example",
            phone: "+1 555 0182",
            title: "Revenue Lead",
          },
        ],
      },
    },
  });

  const urbanNest = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: "Urban Nest",
      status: ClientStatus.ACTIVE,
      industry: "Real Estate",
      website: "https://urbannest.example",
      estimatedValue: "31200",
      contacts: {
        create: [
          {
            name: "Fatima Okoro",
            email: "fatima@urbannest.example",
            phone: "+234 801 555 0199",
            title: "Managing Partner",
          },
        ],
      },
    },
  });

  const medix = await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: "Medix Cloud",
      status: ClientStatus.AT_RISK,
      industry: "Healthcare SaaS",
      website: "https://medix.example",
      estimatedValue: "14800",
      contacts: {
        create: [
          {
            name: "James Carter",
            email: "james@medix.example",
            phone: "+44 20 5555 0191",
            title: "Product Director",
          },
        ],
      },
    },
  });

  const northstarDeal = await prisma.deal.create({
    data: {
      workspaceId: workspace.id,
      clientId: northstar.id,
      title: "Northstar Labs growth rollout",
      stage: DealStage.PROPOSAL,
      value: "24000",
      probability: 72,
      expectedCloseDate: addDays(21),
    },
  });

  const clearlineDeal = await prisma.deal.create({
    data: {
      workspaceId: workspace.id,
      clientId: clearline.id,
      title: "Clearline Finance CRM setup",
      stage: DealStage.DISCOVERY,
      value: "18500",
      probability: 48,
      expectedCloseDate: addDays(35),
    },
  });

  const urbanNestDeal = await prisma.deal.create({
    data: {
      workspaceId: workspace.id,
      clientId: urbanNest.id,
      title: "Urban Nest sales operations",
      stage: DealStage.NEGOTIATION,
      value: "31200",
      probability: 81,
      expectedCloseDate: addDays(14),
    },
  });

  const medixDeal = await prisma.deal.create({
    data: {
      workspaceId: workspace.id,
      clientId: medix.id,
      title: "Medix Cloud renewal workflow",
      stage: DealStage.QUALIFIED,
      value: "14800",
      probability: 55,
      expectedCloseDate: addDays(28),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        workspaceId: workspace.id,
        clientId: northstar.id,
        dealId: northstarDeal.id,
        assigneeId: user.id,
        title: "Send revised Northstar proposal",
        description: "Include updated rollout timeline and pricing notes.",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: addDays(0),
      },
      {
        workspaceId: workspace.id,
        clientId: urbanNest.id,
        dealId: urbanNestDeal.id,
        assigneeId: user.id,
        title: "Prepare Urban Nest onboarding plan",
        description: "Map stakeholders, onboarding milestones, and launch risks.",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: addDays(1),
      },
      {
        workspaceId: workspace.id,
        clientId: clearline.id,
        dealId: clearlineDeal.id,
        assigneeId: user.id,
        title: "Review subscription terms",
        description: "Confirm annual terms before proposal call.",
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueDate: addDays(4),
      },
      {
        workspaceId: workspace.id,
        clientId: medix.id,
        dealId: medixDeal.id,
        assigneeId: user.id,
        title: "Schedule Medix technical review",
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: addDays(6),
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      {
        workspaceId: workspace.id,
        clientId: northstar.id,
        dealId: northstarDeal.id,
        actorId: user.id,
        type: ActivityType.DEAL_UPDATED,
        message: "Proposal sent to Northstar Labs.",
      },
      {
        workspaceId: workspace.id,
        clientId: clearline.id,
        dealId: clearlineDeal.id,
        actorId: user.id,
        type: ActivityType.DEAL_UPDATED,
        message: "Clearline Finance moved to Discovery.",
      },
      {
        workspaceId: workspace.id,
        clientId: urbanNest.id,
        dealId: urbanNestDeal.id,
        actorId: user.id,
        type: ActivityType.TASK_CREATED,
        message: "Urban Nest follow-up scheduled.",
      },
      {
        workspaceId: workspace.id,
        clientId: medix.id,
        dealId: medixDeal.id,
        actorId: user.id,
        type: ActivityType.NOTE,
        message: "Medix Cloud renewal needs technical review.",
      },
    ],
  });

  const passwordMatches = await compare(demoPassword, passwordHash);

  console.log(
    JSON.stringify(
      {
        seeded: true,
        demoEmail,
        passwordHashVerified: passwordMatches,
        workspace: workspace.slug,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
