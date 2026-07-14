"use client";

import { Edit2, Plus, RefreshCw, Search, ShieldAlert, UserCheck, UserX } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuthenticatedUser } from "@/components/app-shell/authenticated-user-context";
import { PageHeader } from "@/components/app-shell/page-header";

import { apiRequest } from "./api";
import { canChangeUserStatus, canCreateUsers, canReadUsers, canUpdateUsers } from "./permissions";
import { buildUsersQuery } from "./query";
import type {
  AdminRole,
  AdminSectorOption,
  AdminUser,
  CreateUserFormValues,
  PaginatedResponse,
  Pagination,
  UpdateUserFormValues,
  UserFilters,
  UserOptionsResponse,
  UserStatus,
} from "./types";
import {
  createUserPayload,
  updateUserPayload,
  validateCreateUserForm,
  validateUpdateUserForm,
} from "./validation";

const defaultPagination: Pagination = {
  page: 1,
  pageCount: 1,
  pageSize: 10,
  total: 0,
};

const initialFilters: UserFilters = {
  page: 1,
  pageSize: 10,
};

function emptyCreateForm(roleId = ""): CreateUserFormValues {
  return {
    email: "",
    name: "",
    password: "",
    roleId,
    sectorId: "",
    status: "ACTIVE",
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: UserStatus) {
  return status === "ACTIVE" ? "Ativo" : "Inativo";
}

export function UsersManagement() {
  const currentUser = useAuthenticatedUser();
  const permissions = useMemo(
    () => ({
      canChangeStatus: canChangeUserStatus(currentUser),
      canCreate: canCreateUsers(currentUser),
      canRead: canReadUsers(currentUser),
      canUpdate: canUpdateUsers(currentUser),
    }),
    [currentUser],
  );
  const [filters, setFilters] = useState<UserFilters>(initialFilters);
  const [searchDraft, setSearchDraft] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>(defaultPagination);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [sectors, setSectors] = useState<AdminSectorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CreateUserFormValues>(emptyCreateForm());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const usersRequestId = useRef(0);

  const loadUsers = useCallback(async () => {
    if (!permissions.canRead) {
      usersRequestId.current += 1;
      return;
    }

    const requestId = ++usersRequestId.current;
    setIsLoading(true);
    setLoadError(null);

    const query = buildUsersQuery(filters);
    const result = await apiRequest<PaginatedResponse<AdminUser>>(`/api/users?${query}`);

    if (requestId !== usersRequestId.current) {
      return;
    }

    if (result.ok) {
      if (result.data.pagination.page > result.data.pagination.pageCount) {
        setFilters((current) => ({
          ...current,
          page: result.data.pagination.pageCount,
        }));
        setIsLoading(false);
        return;
      }

      setUsers(result.data.data);
      setPagination(result.data.pagination);
    } else {
      setLoadError(result.message);
    }

    setIsLoading(false);
  }, [filters, permissions.canRead]);

  const loadOptions = useCallback(async () => {
    if (!permissions.canRead) {
      return;
    }

    setOptionsError(null);
    const result = await apiRequest<UserOptionsResponse>("/api/users/options");

    if (result.ok) {
      setRoles(result.data.roles);
      setSectors(result.data.sectors);
      setFormValues((current) => ({
        ...current,
        roleId: current.roleId || result.data.roles.find((role) => role.isActive)?.id || "",
      }));
    } else {
      setOptionsError(result.message);
    }
  }, [permissions.canRead]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (formMode !== "closed") {
      formHeadingRef.current?.focus();
    }
  }, [formMode]);

  if (!permissions.canRead) {
    return (
      <>
        <PageHeader
          description="Seu usuario autenticado nao possui permissao para visualizar usuarios."
          title="Usuarios"
        />
        <section className="border border-[var(--orion-border)] bg-[var(--orion-panel)] p-6 text-sm text-[var(--orion-muted)]">
          <ShieldAlert aria-hidden="true" className="mb-3 text-[var(--orion-accent)]" />
          Acesso negado para administracao de usuarios.
        </section>
      </>
    );
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      page: 1,
      search: searchDraft,
    }));
  }

  function openCreateForm() {
    setEditingUserId(null);
    setFormErrors({});
    setMessage(null);
    setError(null);
    setFormValues(emptyCreateForm(roles.find((role) => role.isActive)?.id || ""));
    setFormMode("create");
  }

  function openEditForm(user: AdminUser) {
    setEditingUserId(user.id);
    setFormErrors({});
    setMessage(null);
    setError(null);
    setFormValues({
      email: user.email,
      name: user.name,
      password: "",
      roleId: user.role.id,
      sectorId: user.sector?.id ?? "",
      status: user.status,
    });
    setFormMode("edit");
  }

  async function submitUserForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setFormErrors({});
    setMessage(null);

    if (formMode === "create") {
      const validation = validateCreateUserForm(formValues);

      if (!validation.isValid) {
        setFormErrors(validation.errors);
        setIsSaving(false);
        return;
      }

      const result = await apiRequest<{ user: AdminUser }>("/api/users", {
        body: JSON.stringify(createUserPayload(validation.values)),
        method: "POST",
      });

      if (result.ok) {
        setMessage("Usuario criado com sucesso.");
        setFormMode("closed");
        setFormValues(emptyCreateForm(roles.find((role) => role.isActive)?.id || ""));
        setFilters((current) => ({ ...current }));
      } else {
        setError(result.message);
      }
    }

    if (formMode === "edit" && editingUserId) {
      const updateValues: UpdateUserFormValues = {
        email: formValues.email,
        name: formValues.name,
        roleId: formValues.roleId,
        sectorId: formValues.sectorId,
        status: formValues.status,
      };
      const validation = validateUpdateUserForm(updateValues);

      if (!validation.isValid) {
        setFormErrors(validation.errors);
        setIsSaving(false);
        return;
      }

      const result = await apiRequest<{ user: AdminUser }>(`/api/users/${editingUserId}`, {
        body: JSON.stringify(updateUserPayload(validation.values)),
        method: "PATCH",
      });

      if (result.ok) {
        if (editingUserId === currentUser.id) {
          window.location.reload();
          return;
        }

        setMessage("Usuario atualizado com sucesso.");
        setFormMode("closed");
        setEditingUserId(null);
        setFilters((current) => ({ ...current }));
      } else {
        setError(result.message);
      }
    }

    setIsSaving(false);
  }

  async function changeStatus(user: AdminUser, nextStatus: UserStatus) {
    if (user.id === currentUser.id && nextStatus === "INACTIVE") {
      setError("Voce nao pode desativar a propria conta.");
      return;
    }

    if (
      nextStatus === "INACTIVE" &&
      !window.confirm("Desativar este usuario e invalidar sessoes ativas?")
    ) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setMessage(null);

    const result = await apiRequest<{ user: AdminUser }>(`/api/users/${user.id}/status`, {
      body: JSON.stringify({ status: nextStatus }),
      method: "PATCH",
    });

    if (result.ok) {
      setMessage(nextStatus === "ACTIVE" ? "Usuario ativado." : "Usuario desativado.");
      setFilters((current) => ({ ...current }));
    } else {
      setError(result.message);
    }

    setIsSaving(false);
  }

  return (
    <>
      <PageHeader
        description="Gerencie usuarios internos, cargos, setores e status operacional."
        title="Usuarios"
      />

      <section className="mb-5 border border-[var(--orion-border)] bg-[var(--orion-panel)] p-4">
        <form
          className="grid gap-3 xl:grid-cols-[1fr_12rem_12rem_10rem_auto]"
          onSubmit={submitFilters}
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[var(--orion-text)]">Busca</span>
            <input
              className="h-10 w-full border border-[var(--orion-border)] bg-transparent px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
              onChange={(event) => {
                setSearchDraft(event.target.value);
              }}
              placeholder="Nome ou e-mail"
              value={searchDraft}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[var(--orion-text)]">Setor</span>
            <select
              className="h-10 w-full border border-[var(--orion-border)] bg-[var(--orion-panel)] px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  sectorId: event.target.value || undefined,
                }));
              }}
              value={filters.sectorId ?? ""}
            >
              <option value="">Todos</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                  {sector.isActive ? "" : " (inativo)"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[var(--orion-text)]">Cargo</span>
            <select
              className="h-10 w-full border border-[var(--orion-border)] bg-[var(--orion-panel)] px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  roleId: event.target.value || undefined,
                }));
              }}
              value={filters.roleId ?? ""}
            >
              <option value="">Todos</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                  {role.isActive ? "" : " (inativo)"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[var(--orion-text)]">Status</span>
            <select
              className="h-10 w-full border border-[var(--orion-border)] bg-[var(--orion-panel)] px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  status: (event.target.value || undefined) as UserStatus | undefined,
                }));
              }}
              value={filters.status ?? ""}
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="INACTIVE">Inativos</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 border border-[var(--orion-border-strong)] px-3 text-sm font-semibold outline-none hover:border-[var(--orion-accent)] focus:ring-2 focus:ring-[var(--orion-focus)]"
              type="submit"
            >
              <Search aria-hidden="true" size={16} />
              Buscar
            </button>
            {permissions.canCreate ? (
              <button
                className="inline-flex h-10 items-center gap-2 bg-[var(--orion-accent)] px-3 text-sm font-semibold text-[var(--orion-accent-contrast)] outline-none focus:ring-2 focus:ring-[var(--orion-focus)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!roles.some((role) => role.isActive)}
                onClick={openCreateForm}
                title={
                  roles.some((role) => role.isActive) ? undefined : "Nenhum cargo ativo disponivel"
                }
                type="button"
              >
                <Plus aria-hidden="true" size={16} />
                Novo
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {message ? (
        <p
          aria-live="polite"
          className="mb-4 border border-emerald-300/50 bg-emerald-500/10 p-3 text-sm text-[var(--orion-success)]"
          role="status"
        >
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          className="mb-4 border border-rose-300/50 bg-rose-500/10 p-3 text-sm text-[var(--orion-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {loadError ? (
        <p
          className="mb-4 border border-rose-300/50 bg-rose-500/10 p-3 text-sm text-[var(--orion-danger)]"
          role="alert"
        >
          {loadError}
        </p>
      ) : null}
      {optionsError ? (
        <div
          className="mb-4 flex flex-wrap items-center justify-between gap-3 border border-rose-300/50 bg-rose-500/10 p-3 text-sm text-[var(--orion-danger)]"
          role="alert"
        >
          <span>{optionsError}</span>
          <button
            className="border border-current px-3 py-1 font-semibold outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
            onClick={() => void loadOptions()}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {formMode !== "closed" ? (
        <section className="mb-5 border border-[var(--orion-border)] bg-[var(--orion-panel)] p-4">
          <h2
            className="text-lg font-semibold text-[var(--orion-text)] outline-none"
            ref={formHeadingRef}
            tabIndex={-1}
          >
            {formMode === "create" ? "Criar usuario" : "Editar usuario"}
          </h2>
          <form className="mt-4 grid gap-4 lg:grid-cols-2" onSubmit={submitUserForm}>
            <FieldError error={formErrors.name} errorId="user-name-error" label="Nome">
              <input
                aria-describedby={formErrors.name ? "user-name-error" : undefined}
                aria-invalid={Boolean(formErrors.name)}
                className="h-10 w-full border border-[var(--orion-border)] bg-transparent px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                onChange={(event) => {
                  setFormValues((current) => ({ ...current, name: event.target.value }));
                }}
                value={formValues.name}
              />
            </FieldError>
            <FieldError error={formErrors.email} errorId="user-email-error" label="E-mail">
              <input
                aria-describedby={formErrors.email ? "user-email-error" : undefined}
                aria-invalid={Boolean(formErrors.email)}
                className="h-10 w-full border border-[var(--orion-border)] bg-transparent px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                onChange={(event) => {
                  setFormValues((current) => ({ ...current, email: event.target.value }));
                }}
                type="email"
                value={formValues.email}
              />
            </FieldError>
            {formMode === "create" ? (
              <FieldError
                error={formErrors.password}
                errorId="user-password-error"
                label="Senha inicial"
              >
                <input
                  aria-describedby={formErrors.password ? "user-password-error" : undefined}
                  aria-invalid={Boolean(formErrors.password)}
                  className="h-10 w-full border border-[var(--orion-border)] bg-transparent px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                  onChange={(event) => {
                    setFormValues((current) => ({ ...current, password: event.target.value }));
                  }}
                  type="password"
                  value={formValues.password}
                />
              </FieldError>
            ) : null}
            <FieldError error={formErrors.roleId} errorId="user-role-error" label="Cargo">
              <select
                aria-describedby={formErrors.roleId ? "user-role-error" : undefined}
                aria-invalid={Boolean(formErrors.roleId)}
                className="h-10 w-full border border-[var(--orion-border)] bg-[var(--orion-panel)] px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                onChange={(event) => {
                  setFormValues((current) => ({ ...current, roleId: event.target.value }));
                }}
                value={formValues.roleId}
              >
                <option value="">Selecione</option>
                {roles.map((role) => (
                  <option
                    disabled={!role.isActive && role.id !== formValues.roleId}
                    key={role.id}
                    value={role.id}
                  >
                    {role.name}
                    {role.isActive ? "" : " (inativo)"}
                  </option>
                ))}
              </select>
            </FieldError>
            <FieldError error={formErrors.sectorId} errorId="user-sector-error" label="Setor">
              <select
                aria-describedby={formErrors.sectorId ? "user-sector-error" : undefined}
                aria-invalid={Boolean(formErrors.sectorId)}
                className="h-10 w-full border border-[var(--orion-border)] bg-[var(--orion-panel)] px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                onChange={(event) => {
                  setFormValues((current) => ({ ...current, sectorId: event.target.value }));
                }}
                value={formValues.sectorId}
              >
                <option value="">Sem setor</option>
                {sectors.map((sector) => (
                  <option
                    disabled={!sector.isActive && sector.id !== formValues.sectorId}
                    key={sector.id}
                    value={sector.id}
                  >
                    {sector.name}
                    {sector.isActive ? "" : " (inativo)"}
                  </option>
                ))}
              </select>
            </FieldError>
            {formMode === "create" ? (
              <FieldError
                error={formErrors.status}
                errorId="user-status-error"
                label="Status inicial"
              >
                <select
                  aria-describedby={formErrors.status ? "user-status-error" : undefined}
                  aria-invalid={Boolean(formErrors.status)}
                  className="h-10 w-full border border-[var(--orion-border)] bg-[var(--orion-panel)] px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                  onChange={(event) => {
                    setFormValues((current) => ({
                      ...current,
                      status: event.target.value as UserStatus,
                    }));
                  }}
                  value={formValues.status}
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </FieldError>
            ) : null}
            <div className="flex items-end gap-2 lg:col-span-2">
              <button
                className="inline-flex h-10 items-center border border-[var(--orion-border-strong)] px-4 text-sm font-semibold outline-none hover:border-[var(--orion-accent)] focus:ring-2 focus:ring-[var(--orion-focus)] disabled:opacity-60"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </button>
              <button
                className="inline-flex h-10 items-center border border-[var(--orion-border)] px-4 text-sm font-semibold text-[var(--orion-muted)] outline-none hover:text-[var(--orion-text)] focus:ring-2 focus:ring-[var(--orion-focus)]"
                onClick={() => {
                  setFormMode("closed");
                  setEditingUserId(null);
                }}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="border border-[var(--orion-border)] bg-[var(--orion-panel)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--orion-border)] p-4">
          <p className="text-sm text-[var(--orion-muted)]">
            {loadError && users.length === 0
              ? "Consulta indisponivel"
              : `${pagination.total} usuario(s) encontrado(s)`}
          </p>
          <button
            aria-label="Atualizar usuarios"
            className="inline-flex h-9 w-9 items-center justify-center border border-[var(--orion-border)] text-[var(--orion-muted)] outline-none hover:text-[var(--orion-text)] focus:ring-2 focus:ring-[var(--orion-focus)]"
            onClick={() => {
              setFilters((current) => ({ ...current }));
              void loadOptions();
            }}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={16} />
          </button>
        </div>

        {isLoading ? (
          <p className="p-5 text-sm text-[var(--orion-muted)]" role="status">
            Carregando usuarios...
          </p>
        ) : loadError && users.length === 0 ? (
          <p className="p-5 text-sm text-[var(--orion-muted)]">
            Os usuarios nao puderam ser carregados.
          </p>
        ) : users.length === 0 ? (
          <p className="p-5 text-sm text-[var(--orion-muted)]">Nenhum usuario encontrado.</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-[var(--orion-border)] text-xs uppercase text-[var(--orion-muted)]">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Setor</th>
                    <th className="px-4 py-3">Cargo</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Criado em</th>
                    <th className="px-4 py-3">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <UserRow
                      canChangeStatus={permissions.canChangeStatus}
                      canUpdate={permissions.canUpdate}
                      currentUserId={currentUser.id}
                      key={user.id}
                      onChangeStatus={changeStatus}
                      onEdit={openEditForm}
                      user={user}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-4 lg:hidden">
              {users.map((user) => (
                <UserCard
                  canChangeStatus={permissions.canChangeStatus}
                  canUpdate={permissions.canUpdate}
                  currentUserId={currentUser.id}
                  key={user.id}
                  onChangeStatus={changeStatus}
                  onEdit={openEditForm}
                  user={user}
                />
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-[var(--orion-border)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--orion-muted)]">
            Pagina {pagination.page} de {pagination.pageCount}
          </p>
          <div className="flex gap-2">
            <button
              className="h-9 border border-[var(--orion-border)] px-3 text-sm font-semibold disabled:opacity-50"
              disabled={filters.page <= 1}
              onClick={() => {
                setFilters((current) => ({ ...current, page: current.page - 1 }));
              }}
              type="button"
            >
              Anterior
            </button>
            <button
              className="h-9 border border-[var(--orion-border)] px-3 text-sm font-semibold disabled:opacity-50"
              disabled={filters.page >= pagination.pageCount}
              onClick={() => {
                setFilters((current) => ({ ...current, page: current.page + 1 }));
              }}
              type="button"
            >
              Proxima
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

type FieldErrorProps = {
  children: ReactNode;
  error?: string;
  errorId: string;
  label: string;
};

function FieldError({ children, error, errorId, label }: FieldErrorProps) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-[var(--orion-text)]">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-[var(--orion-danger)]" id={errorId}>
          {error}
        </span>
      ) : null}
    </label>
  );
}

type UserItemProps = {
  canChangeStatus: boolean;
  canUpdate: boolean;
  currentUserId: string;
  onChangeStatus: (user: AdminUser, nextStatus: UserStatus) => void;
  onEdit: (user: AdminUser) => void;
  user: AdminUser;
};

function UserRow(props: UserItemProps) {
  const { canChangeStatus, canUpdate, currentUserId, onChangeStatus, onEdit, user } = props;

  return (
    <tr className="border-b border-[var(--orion-border)] last:border-0">
      <td className="px-4 py-3">
        <p className="font-semibold text-[var(--orion-text)]">{user.name}</p>
        <p className="text-xs text-[var(--orion-muted)]">{user.email}</p>
      </td>
      <td className="px-4 py-3">{user.sector?.name ?? "Sem setor"}</td>
      <td className="px-4 py-3">{user.role.name}</td>
      <td className="px-4 py-3">{statusLabel(user.status)}</td>
      <td className="px-4 py-3">{formatDate(user.createdAt)}</td>
      <td className="px-4 py-3">
        <UserActions
          canChangeStatus={canChangeStatus}
          canUpdate={canUpdate}
          currentUserId={currentUserId}
          onChangeStatus={onChangeStatus}
          onEdit={onEdit}
          user={user}
        />
      </td>
    </tr>
  );
}

function UserCard(props: UserItemProps) {
  const { canChangeStatus, canUpdate, currentUserId, onChangeStatus, onEdit, user } = props;

  return (
    <article className="border border-[var(--orion-border)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[var(--orion-text)]">{user.name}</h2>
          <p className="text-sm text-[var(--orion-muted)]">{user.email}</p>
        </div>
        <span className="text-sm font-semibold">{statusLabel(user.status)}</span>
      </div>
      <dl className="mt-4 grid gap-2 text-sm">
        <div>
          <dt className="text-[var(--orion-muted)]">Setor</dt>
          <dd>{user.sector?.name ?? "Sem setor"}</dd>
        </div>
        <div>
          <dt className="text-[var(--orion-muted)]">Cargo</dt>
          <dd>{user.role.name}</dd>
        </div>
        <div>
          <dt className="text-[var(--orion-muted)]">Criado em</dt>
          <dd>{formatDate(user.createdAt)}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <UserActions
          canChangeStatus={canChangeStatus}
          canUpdate={canUpdate}
          currentUserId={currentUserId}
          onChangeStatus={onChangeStatus}
          onEdit={onEdit}
          user={user}
        />
      </div>
    </article>
  );
}

function UserActions(props: UserItemProps) {
  const { canChangeStatus, canUpdate, currentUserId, onChangeStatus, onEdit, user } = props;
  const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  return (
    <div className="flex flex-wrap gap-2">
      {canUpdate ? (
        <button
          className="inline-flex h-9 items-center gap-2 border border-[var(--orion-border)] px-3 text-sm font-semibold outline-none hover:border-[var(--orion-accent)] focus:ring-2 focus:ring-[var(--orion-focus)]"
          onClick={() => onEdit(user)}
          type="button"
        >
          <Edit2 aria-hidden="true" size={15} />
          Editar
        </button>
      ) : null}
      {canChangeStatus ? (
        <button
          className="inline-flex h-9 items-center gap-2 border border-[var(--orion-border)] px-3 text-sm font-semibold outline-none hover:border-[var(--orion-accent)] focus:ring-2 focus:ring-[var(--orion-focus)] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={user.id === currentUserId && nextStatus === "INACTIVE"}
          onClick={() => onChangeStatus(user, nextStatus)}
          type="button"
        >
          {nextStatus === "ACTIVE" ? (
            <UserCheck aria-hidden="true" size={15} />
          ) : (
            <UserX aria-hidden="true" size={15} />
          )}
          {nextStatus === "ACTIVE" ? "Ativar" : "Desativar"}
        </button>
      ) : null}
    </div>
  );
}
