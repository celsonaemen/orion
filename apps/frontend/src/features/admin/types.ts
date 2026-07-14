export type UserStatus = "ACTIVE" | "INACTIVE";

export type AdminRole = {
  hierarchyLevel: number;
  id: string;
  isActive: boolean;
  name: string;
  slug: string;
};

export type AdminSectorOption = {
  id: string;
  isActive: boolean;
  name: string;
  slug: string;
};

export type AdminUser = {
  createdAt: string;
  email: string;
  id: string;
  lastLoginAt: string | null;
  name: string;
  role: AdminRole;
  sector: AdminSectorOption | null;
  status: UserStatus;
  updatedAt: string;
};

export type AdminSector = {
  createdAt: string;
  description: string | null;
  id: string;
  isActive: boolean;
  name: string;
  slug: string;
  updatedAt: string;
  userCount: number;
};

export type Pagination = {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: Pagination;
};

export type UserOptionsResponse = {
  roles: AdminRole[];
  sectors: AdminSectorOption[];
};

export type UserFilters = {
  page: number;
  pageSize: number;
  roleId?: string;
  search?: string;
  sectorId?: string;
  status?: UserStatus;
};

export type SectorFilters = {
  isActive?: boolean;
  page: number;
  pageSize: number;
  search?: string;
  sortBy: "name" | "createdAt";
  sortDirection: "asc" | "desc";
};

export type CreateUserFormValues = {
  email: string;
  name: string;
  password: string;
  roleId: string;
  sectorId: string;
  status: UserStatus;
};

export type UpdateUserFormValues = Omit<CreateUserFormValues, "password">;

export type SectorFormValues = {
  description: string;
  isActive: boolean;
  name: string;
  slug: string;
};

export type ValidationResult<T> =
  | {
      errors: Record<string, never>;
      isValid: true;
      values: T;
    }
  | {
      errors: Record<string, string>;
      isValid: false;
      values: T;
    };
