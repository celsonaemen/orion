import type {
  CreateUserFormValues,
  SectorFormValues,
  UpdateUserFormValues,
  UserStatus,
  ValidationResult,
} from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9-]+$/;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isUserStatus(value: string): value is UserStatus {
  return value === "ACTIVE" || value === "INACTIVE";
}

export function validateCreateUserForm(
  values: CreateUserFormValues,
): ValidationResult<CreateUserFormValues> {
  const normalized = {
    ...values,
    email: normalizeEmail(values.email),
    name: values.name.trim(),
  };
  const errors: Record<string, string> = {};

  validateUserBase(normalized, errors);

  if (normalized.password.length < 10) {
    errors.password = "Informe uma senha inicial com pelo menos 10 caracteres.";
  }

  if (normalized.password.length > 128) {
    errors.password = "A senha inicial deve ter no maximo 128 caracteres.";
  }

  return result(normalized, errors);
}

export function validateUpdateUserForm(
  values: UpdateUserFormValues,
): ValidationResult<UpdateUserFormValues> {
  const normalized = {
    ...values,
    email: normalizeEmail(values.email),
    name: values.name.trim(),
  };
  const errors: Record<string, string> = {};

  validateUserBase(normalized, errors);

  return result(normalized, errors);
}

function validateUserBase(values: UpdateUserFormValues, errors: Record<string, string>) {
  if (values.name.length < 2 || values.name.length > 120) {
    errors.name = "Informe um nome entre 2 e 120 caracteres.";
  }

  if (!emailPattern.test(values.email) || values.email.length > 254) {
    errors.email = "Informe um e-mail valido.";
  }

  if (!values.roleId) {
    errors.roleId = "Selecione um cargo.";
  }

  if (!isUserStatus(values.status)) {
    errors.status = "Selecione um status valido.";
  }
}

export function createUserPayload(values: CreateUserFormValues) {
  return {
    email: normalizeEmail(values.email),
    name: values.name.trim(),
    password: values.password,
    roleId: values.roleId,
    sectorId: values.sectorId || undefined,
    status: values.status,
  };
}

export function updateUserPayload(values: UpdateUserFormValues) {
  return {
    email: normalizeEmail(values.email),
    name: values.name.trim(),
    roleId: values.roleId,
    sectorId: values.sectorId || null,
  };
}

export function validateSectorForm(values: SectorFormValues): ValidationResult<SectorFormValues> {
  const normalized = {
    ...values,
    description: values.description.trim(),
    name: values.name.trim(),
    slug: normalizeSlug(values.slug || values.name),
  };
  const errors: Record<string, string> = {};

  if (normalized.name.length < 2 || normalized.name.length > 120) {
    errors.name = "Informe um nome entre 2 e 120 caracteres.";
  }

  if (!normalized.slug || normalized.slug.length < 2 || normalized.slug.length > 80) {
    errors.slug = "Informe um slug entre 2 e 80 caracteres.";
  }

  if (!slugPattern.test(normalized.slug)) {
    errors.slug = "Use apenas letras minusculas, numeros e hifens no slug.";
  }

  if (normalized.description.length > 240) {
    errors.description = "A descricao deve ter no maximo 240 caracteres.";
  }

  return result(normalized, errors);
}

export function createSectorPayload(values: SectorFormValues) {
  return {
    description: values.description.trim() || undefined,
    isActive: values.isActive,
    name: values.name.trim(),
    slug: normalizeSlug(values.slug || values.name),
  };
}

export function updateSectorPayload(values: SectorFormValues) {
  return {
    description: values.description.trim() || null,
    isActive: values.isActive,
    name: values.name.trim(),
  };
}

function result<T>(values: T, errors: Record<string, string>): ValidationResult<T> {
  if (Object.keys(errors).length === 0) {
    return {
      errors: {},
      isValid: true,
      values,
    };
  }

  return {
    errors,
    isValid: false,
    values,
  };
}
