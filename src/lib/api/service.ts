import {
  ActivityType,
  ClientStatus,
  DealStage,
  MemberRole,
  SubscriptionPlan,
  SubscriptionStatus,
  TaskPriority,
  TaskStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured } from "@/lib/stripe";
import {
  isOpenStage,
  serializeActivity,
  serializeClientSummary,
  serializeContact,
  serializeDeal,
  serializeTask,
} from "@/lib/api/serializers";
import type { MobileSession } from "@/lib/api/auth";
import type {
  MobileBilling,
  MobileClientDetail,
  MobileClientSummary,
  MobileDashboard,
  MobileDealSummary,
  MobileReports,
  MobileTaskSummary,
} from "@/types/mobile";

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; fields?: Record<string, string> };

const fail = (status: number, message: string, fields?: Record<string, string>): ServiceResult<never> => ({
  ok: false,
  status,
  message,
  fields,
});

// ---------- input helpers ----------

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const has = (input: Record<string, unknown>, key: string): boolean => input[key] !== undefined;

const asNumber = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = typeof value === "string" ? Number(value.replace(/[$,]/g, "")) : Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const parseDate = (value: unknown): { value: Date | null } | { error: string } => {
  const raw = asString(value);

  if (!raw) {
    return { value: null };
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T09:00:00.000Z`) : new Date(raw);
  return Number.isNaN(date.getTime()) ? { error: "Enter a valid date." } : { value: date };
};

const normalizeWebsite = (value: string): { value: string | null } | { error: string } => {
  const trimmed = value.trim();

  if (!trimmed) {
    return { value: null };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    return url.hostname.includes(".") ? { value: url.toString() } : { error: "Enter a valid website." };
  } catch {
    return { error: "Enter a valid website." };
  }
};

const clientStatuses = new Set<string>(Object.values(ClientStatus));
const dealStages = new Set<string>(Object.values(DealStage));
const taskStatuses = new Set<string>(Object.values(TaskStatus));
const taskPriorities = new Set<string>(Object.values(TaskPriority));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Prisma include shapes that match the serializer row types.
const clientSummaryInclude = {
  contacts: { orderBy: { createdAt: "asc" }, take: 1 },
  deals: { select: { stage: true, value: true } },
  tasks: { where: { status: { not: TaskStatus.DONE } }, select: { id: true } },
} as const;

const dealInclude = { client: { select: { name: true } } } as const;

const taskInclude = {
  client: { select: { name: true } },
  deal: { select: { title: true } },
  assignee: { select: { name: true } },
} as const;

// ---------- queries ----------

export async function listClients(workspaceId: string): Promise<MobileClientSummary[]> {
  const clients = await prisma.client.findMany({
    where: { workspaceId },
    include: clientSummaryInclude,
    orderBy: { updatedAt: "desc" },
  });

  return clients.map(serializeClientSummary);
}

export async function getClientDetail(workspaceId: string, clientId: string): Promise<MobileClientDetail | null> {
  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId },
    include: {
      contacts: { orderBy: { createdAt: "asc" } },
      deals: { include: dealInclude, orderBy: { updatedAt: "desc" } },
      tasks: { include: taskInclude, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] },
      activities: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!client) {
    return null;
  }

  const openDeals = client.deals.filter((deal) => isOpenStage(deal.stage));

  return {
    id: client.id,
    name: client.name,
    status: client.status,
    industry: client.industry,
    website: client.website,
    estimatedValue: Number(client.estimatedValue ?? 0),
    pipelineValue: openDeals.reduce((total, deal) => total + Number(deal.value ?? 0), 0),
    openDeals: openDeals.length,
    openTasks: client.tasks.filter((task) => task.status !== TaskStatus.DONE).length,
    primaryContact: client.contacts[0] ? serializeContact(client.contacts[0]) : null,
    updatedAt: client.updatedAt.toISOString(),
    contacts: client.contacts.map(serializeContact),
    deals: client.deals.map(serializeDeal),
    tasks: client.tasks.map(serializeTask),
    activities: client.activities.map(serializeActivity),
  };
}

export async function listDeals(workspaceId: string): Promise<MobileDealSummary[]> {
  const deals = await prisma.deal.findMany({
    where: { workspaceId },
    include: dealInclude,
    orderBy: [{ expectedCloseDate: "asc" }, { updatedAt: "desc" }],
  });

  return deals.map(serializeDeal);
}

export async function listTasks(workspaceId: string): Promise<MobileTaskSummary[]> {
  const tasks = await prisma.task.findMany({
    where: { workspaceId },
    include: taskInclude,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return tasks.map(serializeTask);
}

export async function getDashboard(workspaceId: string): Promise<MobileDashboard | null> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const [workspace, activeClients, newClientsThisWeek, openTasks, dueToday] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        deals: { include: dealInclude, orderBy: { updatedAt: "desc" } },
        tasks: { include: taskInclude, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }], take: 5 },
        activities: { include: { actor: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 5 },
        subscription: true,
      },
    }),
    prisma.client.count({ where: { workspaceId, status: ClientStatus.ACTIVE } }),
    prisma.client.count({ where: { workspaceId, createdAt: { gte: weekStart } } }),
    prisma.task.count({ where: { workspaceId, status: { not: TaskStatus.DONE } } }),
    prisma.task.count({
      where: { workspaceId, status: { not: TaskStatus.DONE }, dueDate: { gte: todayStart, lt: tomorrowStart } },
    }),
  ]);

  if (!workspace) {
    return null;
  }

  const openDeals = workspace.deals.filter((deal) => isOpenStage(deal.stage));
  const pipelineValue = openDeals.reduce((total, deal) => total + Number(deal.value ?? 0), 0);
  const weightedPipelineValue = openDeals.reduce(
    (total, deal) => total + Number(deal.value ?? 0) * (deal.probability / 100),
    0,
  );
  const hotDeals = openDeals.filter((deal) => deal.probability >= 70);
  const winConfidence = openDeals.length
    ? Math.round(openDeals.reduce((total, deal) => total + deal.probability, 0) / openDeals.length)
    : 0;

  return {
    workspace: { name: workspace.name },
    metrics: {
      pipelineValue,
      weightedPipelineValue: Math.round(weightedPipelineValue),
      openDeals: openDeals.length,
      activeClients,
      newClientsThisWeek,
      openTasks,
      dueToday,
      winConfidence,
      hotDeals: hotDeals.length,
    },
    pipeline: openDeals.slice(0, 5).map(serializeDeal),
    tasks: workspace.tasks.map(serializeTask),
    activity: workspace.activities.map(serializeActivity),
    subscription: workspace.subscription
      ? { plan: workspace.subscription.plan, status: workspace.subscription.status }
      : null,
  };
}

// ---------- mutations ----------

export async function createClient(
  session: MobileSession,
  input: Record<string, unknown>,
): Promise<ServiceResult<MobileClientSummary>> {
  const name = asString(input.name);
  const contactName = asString(input.contactName);
  const contactEmail = asString(input.contactEmail).toLowerCase();
  const contactTitle = asString(input.contactTitle);
  const industry = asString(input.industry);
  const status = asString(input.status) || ClientStatus.PROSPECT;
  const estimatedValue = asNumber(input.estimatedValue) ?? 0;
  const website = normalizeWebsite(asString(input.website));

  const fields: Record<string, string> = {};

  if (name.length < 2) fields.name = "Company name is required.";
  if (contactName.length < 2) fields.contactName = "Primary contact is required.";
  if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) fields.contactEmail = "Enter a valid email.";
  if (!clientStatuses.has(status)) fields.status = "Choose a valid status.";
  if (Number.isNaN(estimatedValue) || estimatedValue < 0) fields.estimatedValue = "Enter a valid value.";
  if ("error" in website) fields.website = website.error;

  if (Object.keys(fields).length > 0) {
    return fail(400, "Fix the highlighted fields.", fields);
  }

  const duplicate = await prisma.client.findFirst({
    where: { workspaceId: session.workspaceId, name },
    select: { id: true },
  });

  if (duplicate) {
    return fail(409, "A client with this name already exists.", { name: "Already exists." });
  }

  const client = await prisma.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: {
        name,
        status: status as ClientStatus,
        industry: industry || null,
        website: "value" in website ? website.value : null,
        estimatedValue: estimatedValue.toString(),
        workspaceId: session.workspaceId,
        contacts: {
          create: { name: contactName, email: contactEmail || null, title: contactTitle || null },
        },
      },
    });

    await tx.activity.create({
      data: {
        actorId: session.userId,
        clientId: created.id,
        message: `${created.name} added to the client portfolio.`,
        type: ActivityType.CLIENT_CREATED,
        workspaceId: session.workspaceId,
      },
    });

    return tx.client.findUniqueOrThrow({ where: { id: created.id }, include: clientSummaryInclude });
  });

  return { ok: true, data: serializeClientSummary(client) };
}

export async function updateClient(
  session: MobileSession,
  clientId: string,
  input: Record<string, unknown>,
): Promise<ServiceResult<MobileClientSummary>> {
  const existing = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: session.workspaceId },
    include: { contacts: { orderBy: { createdAt: "asc" }, take: 1 } },
  });

  if (!existing) {
    return fail(404, "Client was not found.");
  }

  const fields: Record<string, string> = {};
  const data: Record<string, unknown> = {};

  if (has(input, "name")) {
    const name = asString(input.name);
    if (name.length < 2) {
      fields.name = "Company name is required.";
    } else {
      const duplicate = await prisma.client.findFirst({
        where: { workspaceId: session.workspaceId, name, id: { not: clientId } },
        select: { id: true },
      });
      if (duplicate) fields.name = "A client with this name already exists.";
      else data.name = name;
    }
  }

  if (has(input, "status")) {
    const status = asString(input.status);
    if (!clientStatuses.has(status)) fields.status = "Choose a valid status.";
    else data.status = status as ClientStatus;
  }

  if (has(input, "industry")) data.industry = asString(input.industry) || null;

  if (has(input, "estimatedValue")) {
    const value = asNumber(input.estimatedValue) ?? 0;
    if (Number.isNaN(value) || value < 0) fields.estimatedValue = "Enter a valid value.";
    else data.estimatedValue = value.toString();
  }

  if (has(input, "website")) {
    const website = normalizeWebsite(asString(input.website));
    if ("error" in website) fields.website = website.error;
    else data.website = website.value;
  }

  const contactData: Record<string, unknown> = {};
  if (has(input, "contactName")) {
    const contactName = asString(input.contactName);
    if (contactName.length < 2) fields.contactName = "Primary contact is required.";
    else contactData.name = contactName;
  }
  if (has(input, "contactEmail")) {
    const contactEmail = asString(input.contactEmail).toLowerCase();
    if (contactEmail && !EMAIL_PATTERN.test(contactEmail)) fields.contactEmail = "Enter a valid email.";
    else contactData.email = contactEmail || null;
  }
  if (has(input, "contactTitle")) contactData.title = asString(input.contactTitle) || null;

  if (Object.keys(fields).length > 0) {
    return fail(400, "Fix the highlighted fields.", fields);
  }

  const client = await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.client.update({ where: { id: clientId }, data });
    }

    if (Object.keys(contactData).length > 0) {
      const primaryContactId = existing.contacts[0]?.id;
      if (primaryContactId) {
        await tx.contact.update({ where: { id: primaryContactId }, data: contactData });
      } else {
        await tx.contact.create({ data: { clientId, name: "Primary contact", ...contactData } });
      }
    }

    await tx.activity.create({
      data: {
        actorId: session.userId,
        clientId,
        message: `${data.name ?? existing.name} account details updated.`,
        type: ActivityType.NOTE,
        workspaceId: session.workspaceId,
      },
    });

    return tx.client.findUniqueOrThrow({ where: { id: clientId }, include: clientSummaryInclude });
  });

  return { ok: true, data: serializeClientSummary(client) };
}

export async function deleteClient(session: MobileSession, clientId: string): Promise<ServiceResult<{ id: string }>> {
  const existing = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: session.workspaceId },
    select: { id: true },
  });

  if (!existing) {
    return fail(404, "Client was not found.");
  }

  await prisma.client.delete({ where: { id: clientId } });
  return { ok: true, data: { id: clientId } };
}

export async function createDeal(
  session: MobileSession,
  input: Record<string, unknown>,
): Promise<ServiceResult<MobileDealSummary>> {
  const title = asString(input.title);
  const clientId = asString(input.clientId);
  const stage = asString(input.stage) || DealStage.QUALIFIED;
  const value = asNumber(input.value) ?? 0;
  const probability = asNumber(input.probability) ?? 50;
  const closeDate = parseDate(input.expectedCloseDate);

  const fields: Record<string, string> = {};

  if (!clientId) fields.clientId = "Choose a client.";
  if (title.length < 3) fields.title = "Deal title is required.";
  if (!dealStages.has(stage)) fields.stage = "Choose a valid stage.";
  if (Number.isNaN(value) || value < 0) fields.value = "Enter a valid deal value.";
  if (Number.isNaN(probability) || probability < 0 || probability > 100) {
    fields.probability = "Probability must be between 0 and 100.";
  }
  if ("error" in closeDate) fields.expectedCloseDate = closeDate.error;

  if (Object.keys(fields).length > 0) {
    return fail(400, "Fix the highlighted fields.", fields);
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: session.workspaceId },
    select: { id: true, name: true },
  });

  if (!client) {
    return fail(400, "Client was not found.", { clientId: "Choose a valid client." });
  }

  const deal = await prisma.$transaction(async (tx) => {
    const created = await tx.deal.create({
      data: {
        title,
        clientId: client.id,
        stage: stage as DealStage,
        value: value.toString(),
        probability: Math.round(probability),
        expectedCloseDate: "value" in closeDate ? closeDate.value : null,
        workspaceId: session.workspaceId,
      },
    });

    await tx.activity.create({
      data: {
        actorId: session.userId,
        clientId: client.id,
        dealId: created.id,
        message: `${created.title} added for ${client.name}.`,
        type: ActivityType.DEAL_UPDATED,
        workspaceId: session.workspaceId,
      },
    });

    return tx.deal.findUniqueOrThrow({ where: { id: created.id }, include: dealInclude });
  });

  return { ok: true, data: serializeDeal(deal) };
}

export async function updateDeal(
  session: MobileSession,
  dealId: string,
  input: Record<string, unknown>,
): Promise<ServiceResult<MobileDealSummary>> {
  const existing = await prisma.deal.findFirst({
    where: { id: dealId, workspaceId: session.workspaceId },
    select: { id: true, clientId: true, title: true },
  });

  if (!existing) {
    return fail(404, "Deal was not found.");
  }

  const fields: Record<string, string> = {};
  const data: Record<string, unknown> = {};

  if (has(input, "title")) {
    const title = asString(input.title);
    if (title.length < 3) fields.title = "Deal title is required.";
    else data.title = title;
  }
  if (has(input, "stage")) {
    const stage = asString(input.stage);
    if (!dealStages.has(stage)) fields.stage = "Choose a valid stage.";
    else data.stage = stage as DealStage;
  }
  if (has(input, "value")) {
    const value = asNumber(input.value) ?? 0;
    if (Number.isNaN(value) || value < 0) fields.value = "Enter a valid deal value.";
    else data.value = value.toString();
  }
  if (has(input, "probability")) {
    const probability = asNumber(input.probability) ?? 0;
    if (Number.isNaN(probability) || probability < 0 || probability > 100) {
      fields.probability = "Probability must be between 0 and 100.";
    } else {
      data.probability = Math.round(probability);
    }
  }
  if (has(input, "expectedCloseDate")) {
    const closeDate = parseDate(input.expectedCloseDate);
    if ("error" in closeDate) fields.expectedCloseDate = closeDate.error;
    else data.expectedCloseDate = closeDate.value;
  }
  if (has(input, "clientId")) {
    const clientId = asString(input.clientId);
    const client = await prisma.client.findFirst({
      where: { id: clientId, workspaceId: session.workspaceId },
      select: { id: true },
    });
    if (!client) fields.clientId = "Choose a valid client.";
    else data.clientId = client.id;
  }

  if (Object.keys(fields).length > 0) {
    return fail(400, "Fix the highlighted fields.", fields);
  }

  const deal = await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.deal.update({ where: { id: dealId }, data });
    }

    await tx.activity.create({
      data: {
        actorId: session.userId,
        clientId: (data.clientId as string) ?? existing.clientId,
        dealId,
        message: `${data.title ?? existing.title} deal details updated.`,
        type: ActivityType.DEAL_UPDATED,
        workspaceId: session.workspaceId,
      },
    });

    return tx.deal.findUniqueOrThrow({ where: { id: dealId }, include: dealInclude });
  });

  return { ok: true, data: serializeDeal(deal) };
}

// Validates and resolves client/deal/assignee references for a task.
async function resolveTaskRelations(
  workspaceId: string,
  clientId: string,
  dealId: string,
  assigneeId: string,
): Promise<
  | { ok: true; clientId: string | null; dealId: string | null; assigneeId: string | null; clientName: string }
  | { ok: false; fields: Record<string, string> }
> {
  const fields: Record<string, string> = {};

  const [client, deal, assignee] = await Promise.all([
    clientId
      ? prisma.client.findFirst({ where: { id: clientId, workspaceId }, select: { id: true, name: true } })
      : Promise.resolve(null),
    dealId
      ? prisma.deal.findFirst({
          where: { id: dealId, workspaceId },
          select: { id: true, clientId: true, client: { select: { name: true } } },
        })
      : Promise.resolve(null),
    assigneeId
      ? prisma.membership.findFirst({ where: { userId: assigneeId, workspaceId }, select: { userId: true } })
      : Promise.resolve(null),
  ]);

  if (clientId && !client) fields.clientId = "Choose a valid client.";
  if (dealId && !deal) fields.dealId = "Choose a valid deal.";
  if (assigneeId && !assignee) fields.assigneeId = "Choose a valid assignee.";
  if (client && deal && deal.clientId !== client.id) fields.dealId = "Selected deal belongs to another client.";

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    clientId: deal?.clientId ?? client?.id ?? null,
    dealId: deal?.id ?? null,
    assigneeId: assignee?.userId ?? null,
    clientName: deal?.client.name ?? client?.name ?? "Workspace",
  };
}

export async function createTask(
  session: MobileSession,
  input: Record<string, unknown>,
): Promise<ServiceResult<MobileTaskSummary>> {
  const title = asString(input.title);
  const description = asString(input.description);
  const status = asString(input.status) || TaskStatus.TODO;
  const priority = asString(input.priority) || TaskPriority.MEDIUM;
  const dueDate = parseDate(input.dueDate);

  const fields: Record<string, string> = {};

  if (title.length < 3) fields.title = "Task title is required.";
  if (!taskStatuses.has(status)) fields.status = "Choose a valid status.";
  if (!taskPriorities.has(priority)) fields.priority = "Choose a valid priority.";
  if ("error" in dueDate) fields.dueDate = dueDate.error;

  const relations = await resolveTaskRelations(
    session.workspaceId,
    asString(input.clientId),
    asString(input.dealId),
    asString(input.assigneeId),
  );

  if (!relations.ok) {
    Object.assign(fields, relations.fields);
  }

  if (Object.keys(fields).length > 0 || !relations.ok) {
    return fail(400, "Fix the highlighted fields.", fields);
  }

  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title,
        description: description || null,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        dueDate: "value" in dueDate ? dueDate.value : null,
        completedAt: status === TaskStatus.DONE ? new Date() : null,
        clientId: relations.clientId,
        dealId: relations.dealId,
        assigneeId: relations.assigneeId,
        workspaceId: session.workspaceId,
      },
    });

    await tx.activity.create({
      data: {
        actorId: session.userId,
        clientId: relations.clientId,
        dealId: relations.dealId,
        message: `${created.title} task added for ${relations.clientName}.`,
        type: ActivityType.TASK_CREATED,
        workspaceId: session.workspaceId,
      },
    });

    return tx.task.findUniqueOrThrow({ where: { id: created.id }, include: taskInclude });
  });

  return { ok: true, data: serializeTask(task) };
}

export async function updateTask(
  session: MobileSession,
  taskId: string,
  input: Record<string, unknown>,
): Promise<ServiceResult<MobileTaskSummary>> {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, workspaceId: session.workspaceId },
    select: { id: true, completedAt: true, clientId: true, dealId: true, assigneeId: true, title: true },
  });

  if (!existing) {
    return fail(404, "Task was not found.");
  }

  const fields: Record<string, string> = {};
  const data: Record<string, unknown> = {};

  if (has(input, "title")) {
    const title = asString(input.title);
    if (title.length < 3) fields.title = "Task title is required.";
    else data.title = title;
  }
  if (has(input, "description")) data.description = asString(input.description) || null;

  let nextStatus: TaskStatus | undefined;
  if (has(input, "status")) {
    const status = asString(input.status);
    if (!taskStatuses.has(status)) fields.status = "Choose a valid status.";
    else nextStatus = status as TaskStatus;
  }
  if (has(input, "priority")) {
    const priority = asString(input.priority);
    if (!taskPriorities.has(priority)) fields.priority = "Choose a valid priority.";
    else data.priority = priority as TaskPriority;
  }
  if (has(input, "dueDate")) {
    const dueDate = parseDate(input.dueDate);
    if ("error" in dueDate) fields.dueDate = dueDate.error;
    else data.dueDate = dueDate.value;
  }

  // Relations: only re-resolve if any relation field was provided.
  let relationClientId = existing.clientId;
  let relationDealId = existing.dealId;
  if (has(input, "clientId") || has(input, "dealId") || has(input, "assigneeId")) {
    const relations = await resolveTaskRelations(
      session.workspaceId,
      has(input, "clientId") ? asString(input.clientId) : (existing.clientId ?? ""),
      has(input, "dealId") ? asString(input.dealId) : (existing.dealId ?? ""),
      has(input, "assigneeId") ? asString(input.assigneeId) : (existing.assigneeId ?? ""),
    );
    if (!relations.ok) {
      Object.assign(fields, relations.fields);
    } else {
      data.clientId = relations.clientId;
      data.dealId = relations.dealId;
      data.assigneeId = relations.assigneeId;
      relationClientId = relations.clientId;
      relationDealId = relations.dealId;
    }
  }

  if (nextStatus !== undefined) {
    data.status = nextStatus;
    data.completedAt = nextStatus === TaskStatus.DONE ? (existing.completedAt ?? new Date()) : null;
  }

  if (Object.keys(fields).length > 0) {
    return fail(400, "Fix the highlighted fields.", fields);
  }

  const task = await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.task.update({ where: { id: taskId }, data });
    }

    await tx.activity.create({
      data: {
        actorId: session.userId,
        clientId: relationClientId,
        dealId: relationDealId,
        message: `${data.title ?? existing.title} task details updated.`,
        type: ActivityType.NOTE,
        workspaceId: session.workspaceId,
      },
    });

    return tx.task.findUniqueOrThrow({ where: { id: taskId }, include: taskInclude });
  });

  return { ok: true, data: serializeTask(task) };
}

export async function deleteDeal(session: MobileSession, dealId: string): Promise<ServiceResult<{ id: string }>> {
  const existing = await prisma.deal.findFirst({
    where: { id: dealId, workspaceId: session.workspaceId },
    select: { id: true },
  });

  if (!existing) {
    return fail(404, "Deal was not found.");
  }

  await prisma.deal.delete({ where: { id: dealId } });
  return { ok: true, data: { id: dealId } };
}

export async function deleteTask(session: MobileSession, taskId: string): Promise<ServiceResult<{ id: string }>> {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, workspaceId: session.workspaceId },
    select: { id: true },
  });

  if (!existing) {
    return fail(404, "Task was not found.");
  }

  await prisma.task.delete({ where: { id: taskId } });
  return { ok: true, data: { id: taskId } };
}

const OPEN_STAGE_LIST = [DealStage.QUALIFIED, DealStage.DISCOVERY, DealStage.PROPOSAL, DealStage.NEGOTIATION] as const;

export async function getReports(workspaceId: string): Promise<MobileReports | null> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in30 = new Date(todayStart);
  in30.setDate(in30.getDate() + 30);
  const in7 = new Date(todayStart);
  in7.setDate(in7.getDate() + 7);

  const [clients, deals, tasks] = await Promise.all([
    prisma.client.findMany({ where: { workspaceId }, select: { estimatedValue: true, status: true } }),
    prisma.deal.findMany({
      where: { workspaceId },
      select: { expectedCloseDate: true, probability: true, stage: true, value: true },
    }),
    prisma.task.findMany({ where: { workspaceId }, select: { dueDate: true, status: true } }),
  ]);

  const openDeals = deals.filter((deal) => isOpenStage(deal.stage));
  const openPipeline = openDeals.reduce((total, deal) => total + Number(deal.value ?? 0), 0);
  const weightedForecast = openDeals.reduce((t, deal) => t + Number(deal.value ?? 0) * (deal.probability / 100), 0);
  const nextThirtyDayValue = openDeals
    .filter((d) => d.expectedCloseDate && d.expectedCloseDate >= todayStart && d.expectedCloseDate <= in30)
    .reduce((total, deal) => total + Number(deal.value ?? 0), 0);
  const activeClients = clients.filter((c) => c.status === ClientStatus.ACTIVE).length;
  const atRiskClients = clients.filter((c) => c.status === ClientStatus.AT_RISK).length;
  const portfolioValue = clients.reduce((total, c) => total + Number(c.estimatedValue ?? 0), 0);
  const openTasks = tasks.filter((t) => t.status !== TaskStatus.DONE);
  const dueSoonTasks = openTasks.filter((t) => t.dueDate && t.dueDate >= todayStart && t.dueDate <= in7).length;
  const activeRate = clients.length ? Math.round((activeClients / clients.length) * 100) : 0;
  const taskCompletionRate = tasks.length
    ? Math.round((tasks.filter((t) => t.status === TaskStatus.DONE).length / tasks.length) * 100)
    : 0;

  const stages = OPEN_STAGE_LIST.map((stage) => {
    const stageDeals = openDeals.filter((deal) => deal.stage === stage);
    const totalValue = stageDeals.reduce((total, deal) => total + Number(deal.value ?? 0), 0);
    const weightedValue = stageDeals.reduce((t, deal) => t + Number(deal.value ?? 0) * (deal.probability / 100), 0);
    const averageProbability = stageDeals.length
      ? Math.round(stageDeals.reduce((t, deal) => t + deal.probability, 0) / stageDeals.length)
      : 0;
    return { stage, count: stageDeals.length, totalValue, weightedValue: Math.round(weightedValue), averageProbability };
  });

  const clientHealth = [ClientStatus.ACTIVE, ClientStatus.PROSPECT, ClientStatus.AT_RISK, ClientStatus.INACTIVE].map(
    (status) => ({ status, count: clients.filter((c) => c.status === status).length }),
  );

  const taskBreakdown = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE].map((status) => ({
    status,
    count: tasks.filter((t) => t.status === status).length,
  }));

  return {
    headline: { accounts: clients.length, openPipeline, weightedForecast: Math.round(weightedForecast) },
    metrics: {
      openPipeline,
      openDeals: openDeals.length,
      weightedForecast: Math.round(weightedForecast),
      activeRate,
      nextThirtyDayValue,
      dueSoonTasks,
      portfolioValue,
      taskCompletionRate,
      atRiskClients,
    },
    stages,
    clientHealth,
    taskBreakdown,
  };
}

const PLAN_CATALOG: Record<
  SubscriptionPlan,
  { name: string; price: number; description: string; features: string[]; limits: Record<string, number> }
> = {
  [SubscriptionPlan.FREE]: {
    name: "Free",
    price: 0,
    description: "A lightweight workspace for early CRM experiments.",
    features: ["10 client accounts", "5 active opportunities", "Basic task tracking"],
    limits: { clients: 10, deals: 5, members: 1, tasks: 20 },
  },
  [SubscriptionPlan.GROWTH]: {
    name: "Growth",
    price: 29,
    description: "The portfolio demo plan for a growing sales workspace.",
    features: ["100 client accounts", "50 active opportunities", "Team workspace", "Reports dashboard"],
    limits: { clients: 100, deals: 50, members: 5, tasks: 150 },
  },
  [SubscriptionPlan.PRO]: {
    name: "Pro",
    price: 79,
    description: "Advanced controls for larger teams and deeper reporting.",
    features: ["Unlimited client accounts", "Advanced analytics", "Priority support", "Custom billing flows"],
    limits: { clients: 500, deals: 250, members: 25, tasks: 1000 },
  },
};

const ROLE_LABELS: Record<MemberRole, string> = {
  [MemberRole.OWNER]: "Owner",
  [MemberRole.ADMIN]: "Admin",
  [MemberRole.MEMBER]: "Member",
};

const usagePercent = (value: number, limit: number) => Math.min(100, Math.max(6, Math.round((value / limit) * 100)));

export async function getBilling(workspaceId: string): Promise<MobileBilling | null> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      clients: { select: { id: true } },
      deals: { select: { stage: true, value: true } },
      tasks: { select: { status: true } },
      memberships: { include: { user: { select: { email: true, name: true } } }, orderBy: { createdAt: "asc" } },
      subscription: true,
    },
  });

  if (!workspace) {
    return null;
  }

  const plan = workspace.subscription?.plan ?? SubscriptionPlan.FREE;
  const status = workspace.subscription?.status ?? SubscriptionStatus.TRIALING;
  const details = PLAN_CATALOG[plan];
  const renewal = workspace.subscription?.currentPeriodEnd ?? new Date(Date.now() + 14 * 86_400_000);
  const daysRemaining = Math.max(0, Math.ceil((renewal.getTime() - Date.now()) / 86_400_000));
  const openDeals = workspace.deals.filter((deal) => isOpenStage(deal.stage));
  const pipelineValue = openDeals.reduce((total, deal) => total + Number(deal.value ?? 0), 0);
  const openTasks = workspace.tasks.filter((t) => t.status !== TaskStatus.DONE);

  const usage = [
    { label: "Client accounts", value: workspace.clients.length, limit: details.limits.clients },
    { label: "Open deals", value: openDeals.length, limit: details.limits.deals },
    { label: "Team seats", value: workspace.memberships.length, limit: details.limits.members },
    { label: "Open tasks", value: openTasks.length, limit: details.limits.tasks },
  ].map((item) => ({ ...item, percent: usagePercent(item.value, item.limit) }));

  const plans = Object.values(SubscriptionPlan).map((key) => ({
    key,
    name: PLAN_CATALOG[key].name,
    price: PLAN_CATALOG[key].price,
    description: PLAN_CATALOG[key].description,
    features: PLAN_CATALOG[key].features,
    current: key === plan,
  }));

  const history = [
    {
      id: "INV-DEMO-003",
      label: `${details.name} plan · current cycle`,
      amount: details.price,
      date: new Date(renewal.getTime() - 30 * 86_400_000).toISOString(),
      status: "Paid",
    },
    {
      id: "INV-DEMO-002",
      label: "Portfolio billing test credit",
      amount: 0,
      date: new Date(renewal.getTime() - 60 * 86_400_000).toISOString(),
      status: "Demo",
    },
    {
      id: "INV-DEMO-001",
      label: "Workspace setup preview",
      amount: 0,
      date: new Date(renewal.getTime() - 90 * 86_400_000).toISOString(),
      status: "Demo",
    },
  ];

  return {
    plan,
    planName: details.name,
    price: details.price,
    status,
    renewalDate: renewal.toISOString(),
    daysRemaining,
    pipelineValue,
    paymentMode: workspace.subscription?.stripeCustomerId
      ? "Stripe test customer connected"
      : "Stripe test mode preview",
    stripeConfigured: isStripeConfigured(),
    usage,
    plans,
    members: workspace.memberships.map((m) => ({
      name: m.user.name,
      email: m.user.email,
      role: ROLE_LABELS[m.role],
    })),
    history,
  };
}
