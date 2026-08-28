import { JobResult } from "@repo/shared";
import fs from "fs";
import path from "path";
import os from "os";

const globalForStore = globalThis as unknown as { jobStore?: Map<string, JobResult> };
export const store = globalForStore.jobStore ?? (globalForStore.jobStore = new Map<string, JobResult>());

function getStoreFilePath(): string {
  try {
    const tmpDir = os.tmpdir();
    return path.join(tmpDir, "vedaai_jobs_store.json");
  } catch (e) {
    return path.join(process.cwd(), ".jobs_store.json");
  }
}

function pruneOldJobs(jobsMap: Map<string, JobResult>): Map<string, JobResult> {
  const MAX_JOBS = 15;
  const TEN_MINUTES_MS = 10 * 60 * 1000; // 10 Minutes TTL
  const now = Date.now();

  const entries = Array.from(jobsMap.entries());
  let validEntries = entries.filter(([_, job]) => {
    const created = new Date(job.createdAt || now).getTime();
    return now - created < TEN_MINUTES_MS;
  });

  if (validEntries.length > MAX_JOBS) {
    validEntries.sort((a, b) => {
      const tA = new Date(a[1].createdAt || 0).getTime();
      const tB = new Date(b[1].createdAt || 0).getTime();
      return tB - tA;
    });
    validEntries = validEntries.slice(0, MAX_JOBS);
  }

  return new Map<string, JobResult>(validEntries);
}

function loadJobsFromFile(): Record<string, JobResult> {
  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    // Ignore file read error
  }
  return {};
}

function saveJobsToFile(jobsMap: Map<string, JobResult>): void {
  try {
    const prunedMap = pruneOldJobs(jobsMap);
    
    // Sync memory store with pruned entries to free RAM
    store.clear();
    prunedMap.forEach((v, k) => store.set(k, v));

    const filePath = getStoreFilePath();
    const obj: Record<string, JobResult> = {};
    prunedMap.forEach((v, k) => {
      obj[k] = v;
    });
    fs.writeFileSync(filePath, JSON.stringify(obj), "utf8");
  } catch (e) {
    // Ignore file write error
  }
}

export function getJob(jobId: string): JobResult | undefined {
  let job = store.get(jobId);
  if (!job) {
    const fileJobs = loadJobsFromFile();
    if (fileJobs[jobId]) {
      job = fileJobs[jobId];
      store.set(jobId, job);
    }
  }
  return job;
}

export function setJob(jobId: string, job: JobResult): void {
  store.set(jobId, job);
  saveJobsToFile(store);
}

export function updateJob(jobId: string, updates: Partial<JobResult>): JobResult | undefined {
  let current = getJob(jobId);
  if (!current) return undefined;
  const updated: JobResult = { ...current, ...updates };
  store.set(jobId, updated);
  saveJobsToFile(store);
  return updated;
}
