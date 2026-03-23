// Standard API response shape
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data?:   T;
  errors?: unknown;
}

// Auth tokens returned after login/register
export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

// Auth response — tokens + user data
export interface AuthResponse<T> {
  user:   T;
  tokens: AuthTokens;
}

// Pagination params
export interface PaginationParams {
  page:  number;
  limit: number;
}

// Paginated result
export interface PaginatedResult<T> {
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}