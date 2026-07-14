import { pathToFileURL } from "node:url";

import type { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import "dotenv/config";

import { createPrismaClient } from "../src/database/prisma/prisma-client.factory";

const DEV_PASSWORD = "OrionDev123!";
const PASSWORD_SALT_ROUNDS = 10;

const sectors = [
  { name: "Gerência", slug: "gerencia" },
  { name: "Fiscal", slug: "fiscal" },
  { name: "Contábil", slug: "contabil" },
  { name: "Departamento Pessoal", slug: "departamento-pessoal" },
  { name: "Legalização", slug: "legalizacao" },
  { name: "Financeiro", slug: "financeiro" },
  { name: "Administrativo", slug: "administrativo" },
] satisfies Prisma.SectorCreateInput[];

const roles = [
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

const permissions = [
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
] as const;

const rolePermissions = {
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
  ],
  coordenador: [
    "users.read",
    "sectors.read",
    "roles.read",
    "conversations.read-own",
    "conversations.read-sector",
  ],
  setorial: ["sectors.read", "conversations.read-own", "conversations.read-sector"],
  auxiliar: ["conversations.read-own"],
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
