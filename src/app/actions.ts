"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { ActivityType, ClientStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateClientField = "contactEmail" | "contactName" | "estimatedValue" | "name" | "website";

export type CreateClientFormState = {
  fieldErrors?: Partial<Record<CreateClientField, string>>;
  message: string;
  status: "error" | "idle" | "success";
};

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

  const name = readField(formData, "name");
  const industry = readField(formData, "industry");
  const status = readField(formData, "status") || ClientStatus.PROSPECT;
  const estimatedValueInput = readField(formData, "estimatedValue").replace(/[$,]/g, "");
  const websiteInput = readField(formData, "website");
  const contactName = readField(formData, "contactName");
  const contactEmail = readField(formData, "contactEmail").toLowerCase();
  const contactTitle = readField(formData, "contactTitle");
  const fieldErrors: CreateClientFormState["fieldErrors"] = {};

  if (name.length < 2) {
    fieldErrors.name = "Company name is required.";
  }

  if (contactName.length < 2) {
    fieldErrors.contactName = "Primary contact is required.";
  }

  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    fieldErrors.contactEmail = "Enter a valid email.";
  }

  if (!clientStatuses.has(status)) {
    fieldErrors.name = "Choose a valid client status.";
  }

  const estimatedValue = estimatedValueInput ? Number(estimatedValueInput) : 0;

  if (!Number.isFinite(estimatedValue) || estimatedValue < 0) {
    fieldErrors.estimatedValue = "Enter a valid value.";
  }

  const website = normalizeWebsite(websiteInput);

  if (website.error) {
    fieldErrors.website = website.error;
  }

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
      name,
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
          estimatedValue: estimatedValue.toString(),
          industry: industry || null,
          name,
          status: status as ClientStatus,
          website: website.value,
          workspaceId: session.user.workspaceId,
          contacts: {
            create: {
              email: contactEmail || null,
              name: contactName,
              title: contactTitle || null,
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
    message: `${name} has been added.`,
    status: "success",
  };
}
