import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { AppData } from '@/lib/types';

const DB_DIR = path.join(process.cwd(), '.data');
const DB_PATH = path.join(DB_DIR, 'db.json');

const initialData: AppData = {
  users: [],
  workspaces: [],
  memberships: [],
  invites: [],
  templates: [],
  calendarEvents: [],
  auditLogs: [],
  sessions: [],
  userPreferences: [],
};

async function ensureDbFile(): Promise<void> {
  await fs.mkdir(DB_DIR, { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  }
}

export async function readData(): Promise<AppData> {
  await ensureDbFile();
  const raw = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(raw) as AppData;
}

export async function writeData(data: AppData): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export async function mutateData<T>(mutator: (data: AppData) => T): Promise<T> {
  const data = await readData();
  const result = mutator(data);
  await writeData(data);
  return result;
}
