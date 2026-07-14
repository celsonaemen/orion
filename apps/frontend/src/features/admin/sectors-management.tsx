"use client";

import { Edit2, Plus, RefreshCw, Search, ShieldAlert } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAuthenticatedUser } from "@/components/app-shell/authenticated-user-context";
import { PageHeader } from "@/components/app-shell/page-header";

import { apiRequest } from "./api";
import { canCreateSectors, canReadSectors, canUpdateSectors } from "./permissions";
import { buildSectorsQuery } from "./query";
import type {
  AdminSector,
  PaginatedResponse,
  Pagination,
  SectorFilters,
  SectorFormValues,
} from "./types";
import { createSectorPayload, updateSectorPayload, validateSectorForm } from "./validation";

const defaultPagination: Pagination = {
  page: 1,
  pageCount: 1,
  pageSize: 10,
  total: 0,
};

const initialFilters: SectorFilters = {
  page: 1,
  pageSize: 10,
  sortBy: "name",
  sortDirection: "asc",
};

const emptySectorForm: SectorFormValues = {
  description: "",
  isActive: true,
  name: "",
  slug: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(value));
}

export function SectorsManagement() {
  const currentUser = useAuthenticatedUser();
  const permissions = useMemo(
    () => ({
      canCreate: canCreateSectors(currentUser),
      canRead: canReadSectors(currentUser),
      canUpdate: canUpdateSectors(currentUser),
    }),
    [currentUser],
  );
  const [filters, setFilters] = useState<SectorFilters>(initialFilters);
  const [searchDraft, setSearchDraft] = useState("");
  const [sectors, setSectors] = useState<AdminSector[]>([]);
  const [pagination, setPagination] = useState<Pagination>(defaultPagination);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<"closed" | "create" | "edit">("closed");
  const [editingSectorId, setEditingSectorId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<SectorFormValues>(emptySectorForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
  const sectorsRequestId = useRef(0);

  const loadSectors = useCallback(async () => {
    if (!permissions.canRead) {
      sectorsRequestId.current += 1;
      return;
    }

    const requestId = ++sectorsRequestId.current;
    setIsLoading(true);
    setLoadError(null);

    const query = buildSectorsQuery(filters);
    const result = await apiRequest<PaginatedResponse<AdminSector>>(`/api/sectors?${query}`);

    if (requestId !== sectorsRequestId.current) {
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

      setSectors(result.data.data);
      setPagination(result.data.pagination);
    } else {
      setLoadError(result.message);
    }

    setIsLoading(false);
  }, [filters, permissions.canRead]);

  useEffect(() => {
    void loadSectors();
  }, [loadSectors]);

  useEffect(() => {
    if (formMode !== "closed") {
      formHeadingRef.current?.focus();
    }
  }, [formMode]);

  if (!permissions.canRead) {
    return (
      <>
        <PageHeader
          description="Seu usuario autenticado nao possui permissao para visualizar setores."
          title="Setores"
        />
        <section className="border border-[var(--orion-border)] bg-[var(--orion-panel)] p-6 text-sm text-[var(--orion-muted)]">
          <ShieldAlert aria-hidden="true" className="mb-3 text-[var(--orion-accent)]" />
          Acesso negado para administracao de setores.
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
    setEditingSectorId(null);
    setFormErrors({});
    setMessage(null);
    setError(null);
    setFormValues(emptySectorForm);
    setFormMode("create");
  }

  function openEditForm(sector: AdminSector) {
    setEditingSectorId(sector.id);
    setFormErrors({});
    setMessage(null);
    setError(null);
    setFormValues({
      description: sector.description ?? "",
      isActive: sector.isActive,
      name: sector.name,
      slug: sector.slug,
    });
    setFormMode("edit");
  }

  async function submitSectorForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setFormErrors({});
    setMessage(null);

    const validation = validateSectorForm(formValues);

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setIsSaving(false);
      return;
    }

    if (formMode === "create") {
      const result = await apiRequest<{ sector: AdminSector }>("/api/sectors", {
        body: JSON.stringify(createSectorPayload(validation.values)),
        method: "POST",
      });

      if (result.ok) {
        setMessage("Setor criado com sucesso.");
        setFormMode("closed");
        setFormValues(emptySectorForm);
        setFilters((current) => ({ ...current }));
      } else {
        setError(result.message);
      }
    }

    if (formMode === "edit" && editingSectorId) {
      const result = await apiRequest<{ sector: AdminSector }>(`/api/sectors/${editingSectorId}`, {
        body: JSON.stringify(updateSectorPayload(validation.values)),
        method: "PATCH",
      });

      if (result.ok) {
        setMessage("Setor atualizado com sucesso.");
        setFormMode("closed");
        setEditingSectorId(null);
        setFilters((current) => ({ ...current }));
      } else {
        setError(result.message);
      }
    }

    setIsSaving(false);
  }

  return (
    <>
      <PageHeader
        description="Gerencie setores internos, status operacional e vinculos com usuarios."
        title="Setores"
      />

      <section className="mb-5 border border-[var(--orion-border)] bg-[var(--orion-panel)] p-4">
        <form
          className="grid gap-3 xl:grid-cols-[1fr_10rem_12rem_10rem_auto]"
          onSubmit={submitFilters}
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[var(--orion-text)]">Busca</span>
            <input
              className="h-10 w-full border border-[var(--orion-border)] bg-transparent px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
              onChange={(event) => {
                setSearchDraft(event.target.value);
              }}
              placeholder="Nome ou slug"
              value={searchDraft}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[var(--orion-text)]">Status</span>
            <select
              className="h-10 w-full border border-[var(--orion-border)] bg-[var(--orion-panel)] px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
              onChange={(event) => {
                const value = event.target.value;
                setFilters((current) => ({
                  ...current,
                  isActive: value === "" ? undefined : value === "true",
                  page: 1,
                }));
              }}
              value={filters.isActive === undefined ? "" : String(filters.isActive)}
            >
              <option value="">Todos</option>
              <option value="true">Ativos</option>
              <option value="false">Inativos</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[var(--orion-text)]">Ordenar por</span>
            <select
              className="h-10 w-full border border-[var(--orion-border)] bg-[var(--orion-panel)] px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  sortBy: event.target.value as "name" | "createdAt",
                }));
              }}
              value={filters.sortBy}
            >
              <option value="name">Nome</option>
              <option value="createdAt">Criacao</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-[var(--orion-text)]">Direcao</span>
            <select
              className="h-10 w-full border border-[var(--orion-border)] bg-[var(--orion-panel)] px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
              onChange={(event) => {
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  sortDirection: event.target.value as "asc" | "desc",
                }));
              }}
              value={filters.sortDirection}
            >
              <option value="asc">Crescente</option>
              <option value="desc">Decrescente</option>
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
                className="inline-flex h-10 items-center gap-2 bg-[var(--orion-accent)] px-3 text-sm font-semibold text-[var(--orion-accent-contrast)] outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                onClick={openCreateForm}
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

      {formMode !== "closed" ? (
        <section className="mb-5 border border-[var(--orion-border)] bg-[var(--orion-panel)] p-4">
          <h2
            className="text-lg font-semibold text-[var(--orion-text)] outline-none"
            ref={formHeadingRef}
            tabIndex={-1}
          >
            {formMode === "create" ? "Criar setor" : "Editar setor"}
          </h2>
          <form className="mt-4 grid gap-4 lg:grid-cols-2" onSubmit={submitSectorForm}>
            <FieldError error={formErrors.name} errorId="sector-name-error" label="Nome">
              <input
                aria-describedby={formErrors.name ? "sector-name-error" : undefined}
                aria-invalid={Boolean(formErrors.name)}
                className="h-10 w-full border border-[var(--orion-border)] bg-transparent px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                onChange={(event) => {
                  setFormValues((current) => ({ ...current, name: event.target.value }));
                }}
                value={formValues.name}
              />
            </FieldError>
            {formMode === "create" ? (
              <FieldError error={formErrors.slug} errorId="sector-slug-error" label="Slug">
                <input
                  aria-describedby={formErrors.slug ? "sector-slug-error" : undefined}
                  aria-invalid={Boolean(formErrors.slug)}
                  className="h-10 w-full border border-[var(--orion-border)] bg-transparent px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                  onChange={(event) => {
                    setFormValues((current) => ({ ...current, slug: event.target.value }));
                  }}
                  placeholder="gerado pelo nome se ficar vazio"
                  value={formValues.slug}
                />
              </FieldError>
            ) : (
              <label className="text-sm">
                <span className="mb-1 block font-medium text-[var(--orion-text)]">Slug</span>
                <input
                  className="h-10 w-full border border-[var(--orion-border)] bg-[var(--orion-panel-muted)] px-3 text-[var(--orion-muted)]"
                  disabled
                  value={formValues.slug}
                />
              </label>
            )}
            <FieldError
              error={formErrors.description}
              errorId="sector-description-error"
              label="Descricao"
            >
              <input
                aria-describedby={formErrors.description ? "sector-description-error" : undefined}
                aria-invalid={Boolean(formErrors.description)}
                className="h-10 w-full border border-[var(--orion-border)] bg-transparent px-3 outline-none focus:ring-2 focus:ring-[var(--orion-focus)]"
                onChange={(event) => {
                  setFormValues((current) => ({ ...current, description: event.target.value }));
                }}
                value={formValues.description}
              />
            </FieldError>
            <label className="flex items-end gap-3 text-sm">
              <input
                checked={formValues.isActive}
                className="h-4 w-4"
                onChange={(event) => {
                  setFormValues((current) => ({ ...current, isActive: event.target.checked }));
                }}
                type="checkbox"
              />
              <span className="pb-2 font-medium text-[var(--orion-text)]">Setor ativo</span>
            </label>
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
                  setEditingSectorId(null);
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
            {loadError && sectors.length === 0
              ? "Consulta indisponivel"
              : `${pagination.total} setor(es) encontrado(s)`}
          </p>
          <button
            aria-label="Atualizar setores"
            className="inline-flex h-9 w-9 items-center justify-center border border-[var(--orion-border)] text-[var(--orion-muted)] outline-none hover:text-[var(--orion-text)] focus:ring-2 focus:ring-[var(--orion-focus)]"
            onClick={() => setFilters((current) => ({ ...current }))}
            type="button"
          >
            <RefreshCw aria-hidden="true" size={16} />
          </button>
        </div>

        {isLoading ? (
          <p className="p-5 text-sm text-[var(--orion-muted)]" role="status">
            Carregando setores...
          </p>
        ) : loadError && sectors.length === 0 ? (
          <p className="p-5 text-sm text-[var(--orion-muted)]">
            Os setores nao puderam ser carregados.
          </p>
        ) : sectors.length === 0 ? (
          <p className="p-5 text-sm text-[var(--orion-muted)]">Nenhum setor encontrado.</p>
        ) : (
          <div className="grid gap-3 p-4 xl:grid-cols-2">
            {sectors.map((sector) => (
              <article className="border border-[var(--orion-border)] p-4" key={sector.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--orion-text)]">
                      {sector.name}
                    </h2>
                    <p className="text-sm text-[var(--orion-muted)]">{sector.slug}</p>
                  </div>
                  <span className="w-fit border border-[var(--orion-border)] px-2 py-1 text-xs font-semibold uppercase text-[var(--orion-muted)]">
                    {sector.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-[var(--orion-muted)]">Usuarios</dt>
                    <dd>{sector.userCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--orion-muted)]">Criado em</dt>
                    <dd>{formatDate(sector.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--orion-muted)]">Descricao</dt>
                    <dd>{sector.description || "-"}</dd>
                  </div>
                </dl>
                {permissions.canUpdate ? (
                  <button
                    className="mt-4 inline-flex h-9 items-center gap-2 border border-[var(--orion-border)] px-3 text-sm font-semibold outline-none hover:border-[var(--orion-accent)] focus:ring-2 focus:ring-[var(--orion-focus)]"
                    onClick={() => openEditForm(sector)}
                    type="button"
                  >
                    <Edit2 aria-hidden="true" size={15} />
                    Editar
                  </button>
                ) : null}
              </article>
            ))}
          </div>
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
