import { JobResult } from "@repo/shared";

const globalForStore = globalThis as unknown as { jobStore?: Map<string, JobResult> };
export const store = globalForStore.jobStore ?? (globalForStore.jobStore = new Map<string, JobResult>());

export function getJob(jobId: string): JobResult | undefined {
  return store.get(jobId);
}

export function setJob(jobId: string, job: JobResult): void {
  store.set(jobId, job);
}

export function updateJob(jobId: string, updates: Partial<JobResult>): JobResult | undefined {
  const current = store.get(jobId);
  if (!current) return undefined;
  const updated: JobResult = { ...current, ...updates };
  store.set(jobId, updated);
  return updated;
}
