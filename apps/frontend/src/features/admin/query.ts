import type { SectorFilters, UserFilters } from "./types";

function appendIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | number | boolean | undefined,
) {
  if (value === undefined || value === "") {
    return;
  }

  params.set(key, String(value));
}

export function buildUsersQuery(filters: UserFilters) {
  const params = new URLSearchParams();

  appendIfPresent(params, "page", filters.page);
  appendIfPresent(params, "pageSize", filters.pageSize);
  appendIfPresent(params, "search", filters.search?.trim());
  appendIfPresent(params, "status", filters.status);
  appendIfPresent(params, "sectorId", filters.sectorId);
  appendIfPresent(params, "roleId", filters.roleId);

  return params.toString();
}

export function buildSectorsQuery(filters: SectorFilters) {
  const params = new URLSearchParams();

  appendIfPresent(params, "page", filters.page);
  appendIfPresent(params, "pageSize", filters.pageSize);
  appendIfPresent(params, "search", filters.search?.trim());
  appendIfPresent(params, "isActive", filters.isActive);
  appendIfPresent(params, "sortBy", filters.sortBy);
  appendIfPresent(params, "sortDirection", filters.sortDirection);

  return params.toString();
}
