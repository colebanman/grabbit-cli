import { getConfig, getApiUrl } from "./config.js";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit & { baseUrl?: string } = {}
): Promise<T> {
  const config = getConfig();
  const url = `${options.baseUrl || getApiUrl()}${path}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const formDataCtor =
    typeof (globalThis as unknown as { FormData?: unknown }).FormData === "function"
      ? ((globalThis as unknown as { FormData: { new (): unknown } }).FormData as {
          new (): unknown;
        })
      : null;
  const isFormData = !!formDataCtor && options.body instanceof formDataCtor;

  // Only add Content-Type if we have a body and it's not already set
  if (options.body && !headers["Content-Type"] && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (config?.token) {
    headers["Authorization"] = `Bearer ${config.token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let errorMessage = `Request failed: ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      errorMessage = body.error || errorMessage;
    } catch (e) {
      // Ignore parse error, stick with status message
    }
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

export async function validateToken(): Promise<{
  valid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const result = await apiRequest<{
      valid: boolean;
      userId?: string;
      error?: string;
    }>("/api/cli/tokens/validate");
    return result;
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function exchangeCode(
  code: string,
  baseUrl?: string
): Promise<{ token: string; userId: string }> {
  return apiRequest("/api/cli/auth/exchange", {
    method: "POST",
    body: JSON.stringify({ code }),
    baseUrl,
  });
}

export async function submitTask(
  harContent: string | Uint8Array,
  prompt: string,
  model?: string,
  options?: {
    compression?: "gzip";
    transport?: "json" | "multipart";
    agentSteps?: string[];
  }
): Promise<{ taskId: string; status: string }> {
  const useMultipart =
    options?.transport === "multipart" ||
    (typeof harContent !== "string" && options?.transport !== "json");

  if (useMultipart) {
    const FormDataCtor =
      typeof (globalThis as unknown as { FormData?: unknown }).FormData === "function"
        ? ((globalThis as unknown as { FormData: { new (): unknown } }).FormData as {
            new (): { append: (name: string, value: unknown, filename?: string) => void };
          })
        : null;
    const BlobCtor =
      typeof (globalThis as unknown as { Blob?: unknown }).Blob === "function"
        ? ((globalThis as unknown as { Blob: { new (parts: unknown[], options?: { type?: string }): unknown } }).Blob as {
            new (parts: unknown[], options?: { type?: string }): unknown;
          })
        : null;

    if (!FormDataCtor || !BlobCtor) {
      throw new Error("Multipart upload not supported in this runtime");
    }

    const form = new FormDataCtor();
    const payload = typeof harContent === "string" ? new TextEncoder().encode(harContent) : harContent;
    const blob = new BlobCtor([payload], { type: "application/gzip" });

    form.append("har", blob, "capture.har.gz");
    form.append("prompt", prompt);
    if (model) form.append("model", model);
    if (options?.compression) form.append("compression", options.compression);
    if (options?.agentSteps?.length) form.append("agentSteps", JSON.stringify(options.agentSteps));

    return apiRequest("/api/cli/tasks", {
      method: "POST",
      body: form as unknown as RequestInit["body"],
    });
  }

  return apiRequest("/api/cli/tasks", {
    method: "POST",
    body: JSON.stringify({
      harContent,
      prompt,
      model,
      compression: options?.compression,
      agentSteps: options?.agentSteps,
    }),
  });
}

export interface TaskStatus {
  taskId: string;
  status: "pending" | "processing" | "completed" | "error";
  createdAt?: string;
  startedAt?: string;
  completedAt?: string;
  workflowId?: string;
  workflow?: string;
  steps?: number;
  testOutput?: string;
  curl?: string;
  inputs?: Array<{
    name: string;
    type: string;
    description?: string;
    default?: unknown;
  }>;
  outputs?: Array<{ name: string; type: string; description?: string }>;
  error?: string;
  skillMd?: string;
  addCommand?: string;
}

export async function checkTask(taskId: string): Promise<TaskStatus> {
  return apiRequest(`/api/cli/tasks/${taskId}`);
}

export interface WorkflowListItem {
  id: string;
  title?: string;
  description?: string;
}

export async function listWorkflows(): Promise<WorkflowListItem[]> {
  const workflows = await apiRequest<Array<{ id: string; goal?: string; metadata?: any }>>("/api/workflows");
  return workflows.map((w) => ({
    id: w.id,
    title: w.metadata?.name || w.goal || "Untitled",
    description: w.metadata?.description || "",
  }));
}
