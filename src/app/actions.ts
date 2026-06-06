"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ActivityType, ClientStatus } from "@/generated/prisma/client";
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

const clientStatuses = new Set<string>(Object.values(ClientStatus));

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
