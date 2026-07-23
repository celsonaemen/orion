import { pathToFileURL } from "node:url";

import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";

import { createPrismaClient } from "../src/database/prisma/prisma-client.factory";
import { permissions, rolePermissions, roles, sectors } from "./seed";

const PASSWORD_SALT_ROUNDS = 12;
const PASSWORD_MINIMUM_LENGTH = 12;

function requiredEnvironmentValue(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for the production bootstrap.`);
  return value;
}

function validatePassword(password: string) {
  const isStrong =
    password.length >= PASSWORD_MINIMUM_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!isStrong) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD must have at least 12 characters, upper and lower case letters, a number, and a symbol.",
    );
  }
}

async function ensureFoundation(prisma: PrismaClient) {
  for (const sector of sectors) {
    await prisma.sector.upsert({
      where: { slug: sector.slug },
      update: { isActive: true, name: sector.name },
      create: sector,
    });
  }

  for (const role of roles) {
    await prisma.role.upsert({
      where: { slug: role.slug },
      update: {
        description: role.description,
        hierarchyLevel: role.hierarchyLevel,
        isActive: true,
        name: role.name,
      },
      create: role,
    });
  }

  for (const [code, description] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { description },
      create: { code, description },
    });
  }

  for (const [roleSlug, permissionCodes] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { slug: roleSlug } });
    const desiredPermissions = await prisma.permission.findMany({
      select: { id: true },
      where: { code: { in: [...permissionCodes] } },
    });

    if (desiredPermissions.length !== permissionCodes.length) {
      throw new Error(`Missing permission while configuring role ${roleSlug}.`);
    }

    await prisma.rolePermission.deleteMany({
      where: {
        permissionId: { notIn: desiredPermissions.map((permission) => permission.id) },
        roleId: role.id,
      },
    });

    for (const permissionId of desiredPermissions.map((permission) => permission.id)) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { permissionId, roleId: role.id } },
        update: {},
        create: { permissionId, roleId: role.id },
      });
    }
  }
}

export async function bootstrapProduction(prisma: PrismaClient) {
  const email = requiredEnvironmentValue("BOOTSTRAP_ADMIN_EMAIL").toLowerCase();
  const name = requiredEnvironmentValue("BOOTSTRAP_ADMIN_NAME");
  const password = requiredEnvironmentValue("BOOTSTRAP_ADMIN_PASSWORD");

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error("BOOTSTRAP_ADMIN_EMAIL must be a valid e-mail address.");
  }

  if (name.length < 2 || name.length > 120) {
    throw new Error("BOOTSTRAP_ADMIN_NAME must contain between 2 and 120 characters.");
  }

  validatePassword(password);
  await ensureFoundation(prisma);

  const [role, sector, existingUser] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { slug: "gerente" } }),
    prisma.sector.findUniqueOrThrow({ where: { slug: "gerencia" } }),
    prisma.user.findUnique({ where: { email } }),
  ]);
  const shouldResetPassword = process.env.BOOTSTRAP_ADMIN_RESET_PASSWORD === "true";
  const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

  const administrator = existingUser
    ? await prisma.user.update({
        data: {
          deletedAt: null,
          name,
          roleId: role.id,
          sectorId: sector.id,
          status: "ACTIVE",
          ...(shouldResetPassword ? { passwordHash } : {}),
        },
        where: { id: existingUser.id },
      })
    : await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          roleId: role.id,
          sectorId: sector.id,
          status: "ACTIVE",
        },
      });

  const activeSectors = await prisma.sector.findMany({
    select: { id: true },
    where: { isActive: true },
  });

  for (const activeSector of activeSectors) {
    await prisma.channel.upsert({
      where: { sectorId_slug: { sectorId: activeSector.id, slug: "geral" } },
      update: {},
      create: {
        createdById: administrator.id,
        description: "Canal geral do setor.",
        name: "geral",
        sectorId: activeSector.id,
        slug: "geral",
      },
    });
  }
}

async function main() {
  const prisma = createPrismaClient();

  try {
    await bootstrapProduction(prisma);
    console.log("Production administrator and access foundation are ready.");
  } finally {
    await prisma.$disconnect();
  }
}

const executedFileUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;

if (import.meta.url === executedFileUrl) {
  void main();
}
