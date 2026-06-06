"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ActivityType, ClientStatus, DealStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ClientFormField = "contactEmail" | "contactName" | "estimatedValue" | "name" | "website";

export type ClientFormState = {
  fieldErrors?: Partial<Record<ClientFormField, string>>;
  message: string;
  status: "error" | "idle" | "success";
};

export type CreateClientField = ClientFormField;
export type CreateClientFormState = ClientFormState;
export type UpdateClientFormState = ClientFormState;

export type DealFormField = "clientId" | "expectedCloseDate" | "probability" | "stage" | "title" | "value";

export type DealFormState = {
  fieldErrors?: Partial<Record<DealFormField, string>>;
  message: string;
  status: "error" | "idle" | "success";
};

export type CreateDealFormState = DealFormState;
export type UpdateDealFormState = DealFormState;

const clientStatuses = new Set<string>(Object.values(ClientStatus));
const dealStages = new Set<string>(Object.values(DealStage));

const readField = (formData: FormData, field: string) => String(formData.get(field) ?? "").trim();

const normalizeWebsite = (website: string) => {
  if (!website) {
    return { value: null };
  }

  const withProtocol = /^https?:\/\//i.test(website) ? website : `https://${website}`;

  try {
    const url = new URL(withProtocol);

    if (!url.hostname.includes(".")) {
      return { error: "Enter a valid website." };
    }

    return { value: url.toString() };
  } catch {
    return { error: "Enter a valid website." };
  }
};

const readClientPayload = (formData: FormData) => {
  const estimatedValueInput = readField(formData, "estimatedValue").replace(/[$,]/g, "");

  return {
    contactEmail: readField(formData, "contactEmail").toLowerCase(),
    contactName: readField(formData, "contactName"),
    contactTitle: readField(formData, "contactTitle"),
    estimatedValue: estimatedValueInput ? Number(estimatedValueInput) : 0,
    estimatedValueInput,
    industry: readField(formData, "industry"),
    name: readField(formData, "name"),
    status: readField(formData, "status") || ClientStatus.PROSPECT,
    websiteInput: readField(formData, "website"),
  };
};

const validateClientPayload = (payload: ReturnType<typeof readClientPayload>) => {
  const fieldErrors: ClientFormState["fieldErrors"] = {};

  if (payload.name.length < 2) {
    fieldErrors.name = "Company name is required.";
  }

  if (payload.contactName.length < 2) {
    fieldErrors.contactName = "Primary contact is required.";
  }

  if (payload.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contactEmail)) {
    fieldErrors.contactEmail = "Enter a valid email.";
  }

  if (!clientStatuses.has(payload.status)) {
    fieldErrors.name = "Choose a valid client status.";
  }

  if (!Number.isFinite(payload.estimatedValue) || payload.estimatedValue < 0) {
    fieldErrors.estimatedValue = "Enter a valid value.";
  }

  const website = normalizeWebsite(payload.websiteInput);

  if (website.error) {
    fieldErrors.website = website.error;
  }

  return {
    fieldErrors,
    website,
  };
};

const readDealPayload = (formData: FormData) => {
  const valueInput = readField(formData, "value").replace(/[$,]/g, "");
  const probabilityInput = readField(formData, "probability");

  return {
    clientId: readField(formData, "clientId"),
    expectedCloseDateInput: readField(formData, "expectedCloseDate"),
    probability: probabilityInput ? Number(probabilityInput) : 50,
    probabilityInput,
    stage: readField(formData, "stage") || DealStage.QUALIFIED,
    title: readField(formData, "title"),
    value: valueInput ? Number(valueInput) : 0,
    valueInput,
  };
};

const parseExpectedCloseDate = (dateInput: string): { error?: string; value: Date | null } => {
  if (!dateInput) {
    return { value: null };
  }

  const date = new Date(`${dateInput}T09:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return { error: "Choose a valid close date.", value: null };
  }

  return { value: date };
};

const validateDealPayload = (payload: ReturnType<typeof readDealPayload>) => {
  const fieldErrors: DealFormState["fieldErrors"] = {};

  if (!payload.clientId) {
    fieldErrors.clientId = "Choose a client.";
  }

  if (payload.title.length < 3) {
    fieldErrors.title = "Deal title is required.";
  }

  if (!dealStages.has(payload.stage)) {
    fieldErrors.stage = "Choose a valid stage.";
  }

  if (!Number.isFinite(payload.value) || payload.value < 0) {
    fieldErrors.value = "Enter a valid deal value.";
  }

  if (!Number.isFinite(payload.probability) || payload.probability < 0 || payload.probability > 100) {
    fieldErrors.probability = "Probability must be between 0 and 100.";
  }

  const expectedCloseDate = parseExpectedCloseDate(payload.expectedCloseDateInput);

  if (expectedCloseDate.error) {
    fieldErrors.expectedCloseDate = expectedCloseDate.error;
  }

  return {
    expectedCloseDate,
    fieldErrors,
  };
};

const revalidateDealPaths = (...clientIds: string[]) => {
  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath("/deals");
  revalidatePath("/reports");
  revalidatePath("/billing");

  for (const clientId of new Set(clientIds.filter(Boolean))) {
    revalidatePath(`/clients/${clientId}`);
  }
};

export async function createClientAction(
  _previousState: CreateClientFormState,
  formData: FormData,
): Promise<CreateClientFormState> {
  const session = await auth();

  if (!session?.user?.id || !session.user.workspaceId) {
    return {
      message: "Sign in again before adding a client.",
      status: "error",
    };
  }

  const payload = readClientPayload(formData);
  const { fieldErrors, website } = validateClientPayload(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      message: "Fix the highlighted fields.",
      status: "error",
    };
  }

  const existingClient = await prisma.client.findFirst({
    select: {
      id: true,
    },
    where: {
      name: payload.name,
      workspaceId: session.user.workspaceId,
    },
  });

  if (existingClient) {
    return {
      fieldErrors: {
        name: "A client with this name already exists.",
      },
      message: "Client already exists.",
      status: "error",
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const client = await transaction.client.create({
        data: {
          estimatedValue: payload.estimatedValue.toString(),
          industry: payload.industry || null,
          name: payload.name,
          status: payload.status as ClientStatus,
          website: website.value,
          workspaceId: session.user.workspaceId,
          contacts: {
            create: {
              email: payload.contactEmail || null,
              name: payload.contactName,
              title: payload.contactTitle || null,
            },
          },
        },
        select: {
          id: true,
          name: true,
        },
      });

      await transaction.activity.create({
        data: {
          actorId: session.user.id,
          clientId: client.id,
          message: `${client.name} added to the client portfolio.`,
          type: ActivityType.CLIENT_CREATED,
          workspaceId: session.user.workspaceId,
        },
      });
    });
  } catch {
    return {
      message: "Could not add the client. Try again.",
      status: "error",
    };
  }

  revalidatePath("/clients");
  revalidatePath("/dashboard");

  return {
    message: `${payload.name} has been added.`,
    status: "success",
  };
}

export async function updateClientAction(
  _previousState: UpdateClientFormState,
  formData: FormData,
): Promise<UpdateClientFormState> {
  const session = await auth();

  if (!session?.user?.id || !session.user.workspaceId) {
    return {
      message: "Sign in again before updating this client.",
      status: "error",
    };
  }

  const clientId = readField(formData, "clientId");
  const requestedContactId = readField(formData, "contactId");
  const payload = readClientPayload(formData);
  const { fieldErrors, website } = validateClientPayload(payload);

  if (!clientId) {
    return {
      message: "Client id is missing.",
      status: "error",
    };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      message: "Fix the highlighted fields.",
      status: "error",
    };
  }

  const client = await prisma.client.findFirst({
    include: {
      contacts: {
        orderBy: {
          createdAt: "asc",
        },
        take: 1,
      },
    },
    where: {
      id: clientId,
      workspaceId: session.user.workspaceId,
    },
  });

  if (!client) {
    return {
      message: "Client was not found.",
      status: "error",
    };
  }

  const duplicateClient = await prisma.client.findFirst({
    select: {
      id: true,
    },
    where: {
      id: {
        not: clientId,
      },
      name: payload.name,
      workspaceId: session.user.workspaceId,
    },
  });

  if (duplicateClient) {
    return {
      fieldErrors: {
        name: "A client with this name already exists.",
      },
      message: "Client already exists.",
      status: "error",
    };
  }

  const primaryContactId =
    client.contacts.find((contact) => contact.id === requestedContactId)?.id ?? client.contacts[0]?.id;

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.client.update({
        data: {
          estimatedValue: payload.estimatedValue.toString(),
          industry: payload.industry || null,
          name: payload.name,
          status: payload.status as ClientStatus,
          website: website.value,
        },
        where: {
          id: client.id,
        },
      });

      if (primaryContactId) {
        await transaction.contact.update({
          data: {
            email: payload.contactEmail || null,
            name: payload.contactName,
            title: payload.contactTitle || null,
          },
          where: {
            id: primaryContactId,
          },
        });
      } else {
        await transaction.contact.create({
          data: {
            clientId: client.id,
            email: payload.contactEmail || null,
            name: payload.contactName,
            title: payload.contactTitle || null,
          },
        });
      }

      await transaction.activity.create({
        data: {
          actorId: session.user.id,
          clientId: client.id,
          message: `${payload.name} account details updated.`,
          type: ActivityType.NOTE,
          workspaceId: session.user.workspaceId,
        },
      });
    });
  } catch {
    return {
      message: "Could not update the client. Try again.",
      status: "error",
    };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${client.id}`);
  revalidatePath("/dashboard");

  return {
    message: `${payload.name} has been updated.`,
    status: "success",
  };
}

export async function createDealAction(
  _previousState: CreateDealFormState,
  formData: FormData,
): Promise<CreateDealFormState> {
  const session = await auth();

  if (!session?.user?.id || !session.user.workspaceId) {
    return {
      message: "Sign in again before adding a deal.",
      status: "error",
    };
  }

  const payload = readDealPayload(formData);
  const { expectedCloseDate, fieldErrors } = validateDealPayload(payload);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      message: "Fix the highlighted fields.",
      status: "error",
    };
  }

  const client = await prisma.client.findFirst({
    select: {
      id: true,
      name: true,
    },
    where: {
      id: payload.clientId,
      workspaceId: session.user.workspaceId,
    },
  });

  if (!client) {
    return {
      fieldErrors: {
        clientId: "Choose a valid client.",
      },
      message: "Client was not found.",
      status: "error",
    };
  }

  const duplicateDeal = await prisma.deal.findFirst({
    select: {
      id: true,
    },
    where: {
      clientId: client.id,
      title: payload.title,
      workspaceId: session.user.workspaceId,
    },
  });

  if (duplicateDeal) {
    return {
      fieldErrors: {
        title: "This client already has a deal with that title.",
      },
      message: "Deal already exists.",
      status: "error",
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      const deal = await transaction.deal.create({
        data: {
          clientId: client.id,
          expectedCloseDate: expectedCloseDate.value,
          probability: Math.round(payload.probability),
          stage: payload.stage as DealStage,
          title: payload.title,
          value: payload.value.toString(),
          workspaceId: session.user.workspaceId,
        },
        select: {
          id: true,
          title: true,
        },
      });

      await transaction.activity.create({
        data: {
          actorId: session.user.id,
          clientId: client.id,
          dealId: deal.id,
          message: `${deal.title} added for ${client.name}.`,
          type: ActivityType.DEAL_UPDATED,
          workspaceId: session.user.workspaceId,
        },
      });
    });
  } catch {
    return {
      message: "Could not add the deal. Try again.",
      status: "error",
    };
  }

  revalidateDealPaths(client.id);

  return {
    message: `${payload.title} has been added.`,
    status: "success",
  };
}

export async function updateDealAction(
  _previousState: UpdateDealFormState,
  formData: FormData,
): Promise<UpdateDealFormState> {
  const session = await auth();

  if (!session?.user?.id || !session.user.workspaceId) {
    return {
      message: "Sign in again before updating this deal.",
      status: "error",
    };
  }

  const dealId = readField(formData, "dealId");
  const payload = readDealPayload(formData);
  const { expectedCloseDate, fieldErrors } = validateDealPayload(payload);

  if (!dealId) {
    return {
      message: "Deal id is missing.",
      status: "error",
    };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      message: "Fix the highlighted fields.",
      status: "error",
    };
  }

  const [deal, client] = await Promise.all([
    prisma.deal.findFirst({
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      where: {
        id: dealId,
        workspaceId: session.user.workspaceId,
      },
    }),
    prisma.client.findFirst({
      select: {
        id: true,
        name: true,
      },
      where: {
        id: payload.clientId,
        workspaceId: session.user.workspaceId,
      },
    }),
  ]);

  if (!deal) {
    return {
      message: "Deal was not found.",
      status: "error",
    };
  }

  if (!client) {
    return {
      fieldErrors: {
        clientId: "Choose a valid client.",
      },
      message: "Client was not found.",
      status: "error",
    };
  }

  const duplicateDeal = await prisma.deal.findFirst({
    select: {
      id: true,
    },
    where: {
      clientId: client.id,
      id: {
        not: deal.id,
      },
      title: payload.title,
      workspaceId: session.user.workspaceId,
    },
  });

  if (duplicateDeal) {
    return {
      fieldErrors: {
        title: "This client already has a deal with that title.",
      },
      message: "Deal already exists.",
      status: "error",
    };
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.deal.update({
        data: {
          clientId: client.id,
          expectedCloseDate: expectedCloseDate.value,
          probability: Math.round(payload.probability),
          stage: payload.stage as DealStage,
          title: payload.title,
          value: payload.value.toString(),
        },
        where: {
          id: deal.id,
        },
      });

      await transaction.activity.create({
        data: {
          actorId: session.user.id,
          clientId: client.id,
          dealId: deal.id,
          message: `${payload.title} deal details updated.`,
          type: ActivityType.DEAL_UPDATED,
          workspaceId: session.user.workspaceId,
        },
      });
    });
  } catch {
    return {
      message: "Could not update the deal. Try again.",
      status: "error",
    };
  }

  revalidateDealPaths(deal.client.id, client.id);

  return {
    message: `${payload.title} has been updated.`,
    status: "success",
  };
}
