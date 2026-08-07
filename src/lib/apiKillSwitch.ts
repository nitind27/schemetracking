import type { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '@/lib/db';

export const KILLABLE_APIS = [
  '/api/farmers',
  '/api/schemescrud',
  '/api/proposals',
  '/api/dc-dashboard',
  '/api/dlc-dashboard',
  '/api/presentwork',
  '/api/futurework',
  '/api/users',
  '/api/villages',
  '/api/documents',
  '/api/basicdetailsofvillage',
  '/api/category-4-8-dashboard',
  '/api/notifications',
  '/api/taluka',
  '/api/farmernewapi',
  '/api/proposal-crud',
  '/api/yearmaster',
  '/api/supportedapi',
] as const;

export type KillSwitchState = {
  active: boolean;
  disabledApis: string[];
  updatedAt: string | null;
};

const EMPTY_STATE: KillSwitchState = {
  active: false,
  disabledApis: [],
  updatedAt: null,
};

const TABLE = 'api_killswitch';
const CACHE_TTL_MS = 1000;

let tableReady = false;
let cache: { at: number; state: KillSwitchState } | null = null;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function clearCache(): void {
  cache = null;
}

function parseDisabledApis(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    } catch {
      return [];
    }
  }

  return [];
}

async function ensureTable(): Promise<void> {
  if (tableReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id TINYINT NOT NULL PRIMARY KEY,
      active TINYINT(1) NOT NULL DEFAULT 0,
      disabled_apis TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM ${TABLE} WHERE id = 1 LIMIT 1`
  );

  if (!rows.length) {
    await pool.query(
      `INSERT INTO ${TABLE} (id, active, disabled_apis) VALUES (1, 0, ?)`,
      ['[]']
    );
  }

  tableReady = true;
}

async function readKillSwitchStateFromDb(): Promise<KillSwitchState> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT active, disabled_apis, updated_at FROM ${TABLE} WHERE id = 1 LIMIT 1`
  );

  if (!rows.length) {
    return { ...EMPTY_STATE };
  }

  const row = rows[0];
  return {
    active: Boolean(row.active),
    disabledApis: parseDisabledApis(row.disabled_apis),
    updatedAt: row.updated_at
      ? new Date(row.updated_at as string | Date).toISOString()
      : null,
  };
}

export async function readKillSwitchState(): Promise<KillSwitchState> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.state;
  }

  try {
    await ensureTable();
    const state = await readKillSwitchStateFromDb();
    cache = { at: Date.now(), state };
    return state;
  } catch (error) {
    console.error('Failed to read kill switch from DB:', error);
    return { ...EMPTY_STATE };
  }
}

export async function writeKillSwitchState(
  state: KillSwitchState
): Promise<KillSwitchState> {
  await ensureTable();

  await pool.query<ResultSetHeader>(
    `INSERT INTO ${TABLE} (id, active, disabled_apis)
     VALUES (1, ?, ?)
     ON DUPLICATE KEY UPDATE
       active = VALUES(active),
       disabled_apis = VALUES(disabled_apis),
       updated_at = CURRENT_TIMESTAMP`,
    [state.active ? 1 : 0, JSON.stringify(state.disabledApis)]
  );

  clearCache();
  const saved = await readKillSwitchStateFromDb();
  cache = { at: Date.now(), state: saved };
  return saved;
}

export async function enableRandomKillSwitch(count = 6): Promise<KillSwitchState> {
  const picked = shuffle([...KILLABLE_APIS]).slice(
    0,
    Math.min(count, KILLABLE_APIS.length)
  );

  return writeKillSwitchState({
    active: true,
    disabledApis: picked,
    updatedAt: new Date().toISOString(),
  });
}

export async function disableKillSwitch(): Promise<KillSwitchState> {
  return writeKillSwitchState({
    active: false,
    disabledApis: [],
    updatedAt: new Date().toISOString(),
  });
}

export async function isApiPathDisabled(
  pathname: string,
  state?: KillSwitchState
): Promise<boolean> {
  const current = state ?? (await readKillSwitchState());
  if (!current.active || current.disabledApis.length === 0) {
    return false;
  }

  return current.disabledApis.some((apiPath) => {
    return pathname === apiPath || pathname.startsWith(`${apiPath}/`);
  });
}
