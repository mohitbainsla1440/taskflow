const API_BASE_URL = "http://localhost:3001/api";
const TOKEN_KEY = "taskflow_token";

export type TaskStatus = "todo" | "in_progress" | "done";

export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  userId: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
}

export interface MoveTaskInput {
  status: TaskStatus;
  order: number;
}

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body } = options;
  const headers: Record<string, string> = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
  setToken(result.token);
  return result;
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const result = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
  setToken(result.token);
  return result;
}

export function logout(): void {
  clearToken();
}

export async function getTasks(): Promise<Task[]> {
  return request<Task[]>("/tasks");
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return request<Task>("/tasks", { method: "POST", body: input });
}

export async function updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
  return request<Task>(`/tasks/${id}`, { method: "PATCH", body: input });
}

export async function moveTask(id: number, input: MoveTaskInput): Promise<Task> {
  return request<Task>(`/tasks/${id}/move`, { method: "PATCH", body: input });
}

export async function deleteTask(id: number): Promise<void> {
  await request<void>(`/tasks/${id}`, { method: "DELETE" });
}
