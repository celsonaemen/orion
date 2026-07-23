import { pathToFileURL } from "node:url";

import type { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";

import { createPrismaClient } from "../src/database/prisma/prisma-client.factory";

const DEV_PASSWORD = "OrionDev123!";
const PASSWORD_SALT_ROUNDS = 10;

export const sectors = [
  { name: "Gerência", slug: "gerencia" },
  { name: "Fiscal", slug: "fiscal" },
  { name: "Contábil", slug: "contabil" },
  { name: "Departamento Pessoal", slug: "departamento-pessoal" },
  { name: "Legalização", slug: "legalizacao" },
  { name: "Financeiro", slug: "financeiro" },
  { name: "Administrativo", slug: "administrativo" },
] satisfies Prisma.SectorCreateInput[];

export const roles = [
  {
    name: "Gerente",
    slug: "gerente",
    hierarchyLevel: 1,
    description: "Supervisão geral, com acessos auditáveis.",
  },
  {
    name: "Coordenador",
    slug: "coordenador",
    hierarchyLevel: 2,
    description: "Coordenação operacional do setor.",
  },
  {
    name: "Setorial",
    slug: "setorial",
    hierarchyLevel: 3,
    description: "Acompanhamento operacional do setor.",
  },
  {
    name: "Auxiliar",
    slug: "auxiliar",
    hierarchyLevel: 4,
    description: "Atuação nas conversas, grupos e tarefas autorizadas.",
  },
] satisfies Prisma.RoleCreateInput[];

export const permissions = [
  ["users.read", "Ler usuários."],
  ["users.create", "Criar usuários."],
  ["users.update", "Atualizar usuários."],
  ["users.change-status", "Alterar status de usuários."],
  ["sectors.read", "Ler setores."],
  ["sectors.create", "Criar setores."],
  ["sectors.update", "Atualizar setores."],
  ["roles.read", "Ler cargos e permissões."],
  ["roles.manage", "Gerenciar cargos e permissões."],
  ["audit.read", "Ler auditoria."],
  ["conversations.read-own", "Ler conversas próprias."],
  ["conversations.read-sector", "Ler conversas do setor quando autorizado."],
  ["conversations.supervise", "Supervisionar conversas com auditoria."],
  ["chat.access", "Acessar os canais de chat autorizados."],
  ["chat.channels.manage", "Criar canais nos setores autorizados."],
  ["chat.read_all", "Ler canais de todos os setores ativos."],
] as const;

export const rolePermissions = {
  gerente: [
    "users.read",
    "users.create",
    "users.update",
    "users.change-status",
    "sectors.read",
    "sectors.create",
    "sectors.update",
    "roles.read",
    "roles.manage",
    "audit.read",
    "conversations.read-own",
    "conversations.read-sector",
    "conversations.supervise",
    "chat.access",
    "chat.channels.manage",
    "chat.read_all",
  ],
  coordenador: [
    "users.read",
    "sectors.read",
    "roles.read",
    "conversations.read-own",
    "conversations.read-sector",
    "chat.access",
    "chat.channels.manage",
  ],
  setorial: ["sectors.read", "conversations.read-own", "conversations.read-sector", "chat.access"],
  auxiliar: ["conversations.read-own", "chat.access"],
} as const;

const users = [
  {
    name: "Administrador Orion",
    email: "admin@orion.local",
    roleSlug: "gerente",
    sectorSlug: "gerencia",
  },
  {
    name: "Gerente Exemplo",
    email: "gerente@orion.local",
    roleSlug: "gerente",
    sectorSlug: "gerencia",
  },
  {
    name: "Coordenador Fiscal",
    email: "coordenador.fiscal@orion.local",
    roleSlug: "coordenador",
    sectorSlug: "fiscal",
  },
  {
    name: "Auxiliar Fiscal",
    email: "auxiliar.fiscal@orion.local",
    roleSlug: "auxiliar",
    sectorSlug: "fiscal",
  },
  {
    name: "Auxiliar Contábil",
    email: "auxiliar.contabil@orion.local",
    roleSlug: "auxiliar",
    sectorSlug: "contabil",
  },
] as const;

export async function seedDatabase(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, PASSWORD_SALT_ROUNDS);

  for (const sector of sectors) {
    await prisma.sector.upsert({
      where: { slug: sector.slug },
      update: {
        name: sector.name,
        isActive: true,
      },
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
      throw new Error(`Missing permission while seeding role ${roleSlug}.`);
    }

    await prisma.rolePermission.deleteMany({
      where: {
        permissionId: { notIn: desiredPermissions.map((permission) => permission.id) },
        roleId: role.id,
      },
    });

    for (const permissionCode of permissionCodes) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { code: permissionCode },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  for (const user of users) {
    const normalizedEmail = user.email.toLowerCase();
    const role = await prisma.role.findUniqueOrThrow({ where: { slug: user.roleSlug } });
    const sector = await prisma.sector.findUniqueOrThrow({ where: { slug: user.sectorSlug } });

    await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: user.name,
        roleId: role.id,
        sectorId: sector.id,
        status: "ACTIVE",
      },
      create: {
        email: normalizedEmail,
        name: user.name,
        passwordHash,
        roleId: role.id,
        sectorId: sector.id,
        status: "ACTIVE",
      },
    });
  }

  const channelCreator = await prisma.user.findUniqueOrThrow({
    where: { email: "admin@orion.local" },
  });
  const activeSectors = await prisma.sector.findMany({
    select: { id: true },
    where: { isActive: true },
  });

  for (const sector of activeSectors) {
    await prisma.channel.upsert({
      where: {
        sectorId_slug: {
          sectorId: sector.id,
          slug: "geral",
        },
      },
      update: {},
      create: {
        createdById: channelCreator.id,
        description: "Canal geral do setor.",
        name: "geral",
        sectorId: sector.id,
        slug: "geral",
      },
    });
  }
}

async function main() {
  const prisma = createPrismaClient();

  try {
    await seedDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

const executedFileUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : undefined;

if (import.meta.url === executedFileUrl) {
  void main();
}
