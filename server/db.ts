import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  type InsertCapsuleResponse,
  type InsertContactInterest,
  type InsertUser,
  type User,
  capsuleResponses,
  capsuleSessions,
  contactInterests,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

type DbClient = ReturnType<typeof drizzle>;
type JsonObject = Record<string, unknown>;

type CreateCapsuleSessionInput = {
  sessionId: string;
  studentName?: string | null;
  country?: string | null;
  countryCode?: string | null;
  ipAddress?: string | null;
  lat?: string | null;
  lng?: string | null;
  city?: string | null;
};

type SupabaseRequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  params?: Record<string, string>;
  body?: unknown;
  prefer?: string;
};

type SupabaseUserRow = {
  id: number;
  open_id: string;
  name: string | null;
  email: string | null;
  login_method: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
  last_signed_in: string;
};

type SupabaseCapsuleSessionRow = {
  session_id: string;
  student_name: string | null;
  country: string | null;
  country_code: string | null;
  completed_at: string | null;
  created_at: string;
};

type SupabaseCapsuleResponseRow = {
  session_id: string;
  interaction1: string[] | string | null;
  interaction2: string[] | null;
  interaction3: string | null;
  interaction4_opinion: string | null;
  interaction4_text: string | null;
  interaction5: string[] | null;
  created_at: string;
};

type SupabaseSessionWithResponse = SupabaseCapsuleSessionRow & {
  capsule_responses: SupabaseCapsuleResponseRow[] | SupabaseCapsuleResponseRow | null;
};

type SupabaseContactInterestRow = {
  id: number;
  session_id: string;
  student_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  created_at: string;
};

const SUPABASE_TIMEOUT_MS = 15_000;
const SUPABASE_URL = ENV.supabaseUrl.trim();
const SUPABASE_SERVICE_ROLE_KEY = ENV.supabaseServiceRoleKey.trim();
const HAS_SUPABASE = SUPABASE_URL.length > 0 && SUPABASE_SERVICE_ROLE_KEY.length > 0;

let _db: DbClient | null = null;

function withTimeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

function logSupabaseError(operation: string, error: unknown) {
  console.warn(`[Supabase] ${operation} failed:`, error);
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeInteraction1(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return JSON.stringify(value.filter((item): item is string => typeof item === "string"));
  }
  return null;
}

function mapSupabaseUserToUser(row: SupabaseUserRow): User {
  return {
    id: row.id,
    openId: row.open_id,
    name: row.name,
    email: row.email,
    loginMethod: row.login_method,
    role: row.role === "admin" ? "admin" : "user",
    createdAt: toDate(row.created_at) ?? new Date(),
    updatedAt: toDate(row.updated_at) ?? new Date(),
    lastSignedIn: toDate(row.last_signed_in) ?? new Date(),
  };
}

function buildSupabaseUrl(table: string, params: Record<string, string>): string {
  const url = new URL(`/rest/v1/${table}`, SUPABASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

function getSupabaseHeaders(prefer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

async function supabaseRequest<T>(
  table: string,
  { method = "GET", params = {}, body, prefer }: SupabaseRequestOptions = {}
): Promise<T> {
  if (!HAS_SUPABASE) {
    throw new Error("Supabase is not configured");
  }

  const response = await fetch(buildSupabaseUrl(table, params), {
    method,
    headers: getSupabaseHeaders(prefer),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: withTimeoutSignal(SUPABASE_TIMEOUT_MS),
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`[${response.status}] ${response.statusText}: ${raw}`);
  }
  if (!raw) return [] as T;
  return JSON.parse(raw) as T;
}

function canUseMysqlFallback(): boolean {
  return ENV.databaseUrl.trim().length > 0;
}

export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  if (HAS_SUPABASE) {
    try {
      const payload: JsonObject = {
        open_id: user.openId,
        last_signed_in:
          user.lastSignedIn instanceof Date
            ? user.lastSignedIn.toISOString()
            : new Date().toISOString(),
      };
      if (user.name !== undefined) payload.name = user.name ?? null;
      if (user.email !== undefined) payload.email = user.email ?? null;
      if (user.loginMethod !== undefined) payload.login_method = user.loginMethod ?? null;
      if (user.role !== undefined) payload.role = user.role;
      else if (user.openId === ENV.ownerOpenId) payload.role = "admin";

      await supabaseRequest<unknown>("users", {
        method: "POST",
        params: { on_conflict: "open_id" },
        prefer: "resolution=merge-duplicates,return=minimal",
        body: payload,
      });
      return;
    } catch (error) {
      logSupabaseError("upsertUser", error);
      if (!canUseMysqlFallback()) throw error;
    }
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  if (HAS_SUPABASE) {
    try {
      const rows = await supabaseRequest<SupabaseUserRow[]>("users", {
        params: {
          select:
            "id,open_id,name,email,login_method,role,created_at,updated_at,last_signed_in",
          open_id: `eq.${openId}`,
          limit: "1",
        },
      });
      if (rows.length > 0) {
        return mapSupabaseUserToUser(rows[0]);
      }
      if (!canUseMysqlFallback()) return undefined;
    } catch (error) {
      logSupabaseError("getUserByOpenId", error);
      if (!canUseMysqlFallback()) throw error;
    }
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Capsule Sessions ----

export async function createCapsuleSession(data: CreateCapsuleSessionInput) {
  if (HAS_SUPABASE) {
    try {
      const rows = await supabaseRequest<SupabaseCapsuleSessionRow[]>("capsule_sessions", {
        method: "POST",
        prefer: "return=representation",
        body: {
          session_id: data.sessionId,
          student_name: data.studentName ?? null,
          country: data.country ?? null,
          country_code: data.countryCode ?? null,
        },
      });
      const row = rows[0];
      if (!row) throw new Error("No row returned after creating session");
      return {
        sessionId: row.session_id,
        studentName: row.student_name,
        country: row.country,
        countryCode: row.country_code,
        completedAt: toDate(row.completed_at),
        createdAt: toDate(row.created_at) ?? new Date(),
      };
    } catch (error) {
      logSupabaseError("createCapsuleSession", error);
      if (!canUseMysqlFallback()) throw error;
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(capsuleSessions).values({
    sessionId: data.sessionId,
    studentName: data.studentName ?? null,
  });
  const result = await db
    .select()
    .from(capsuleSessions)
    .where(eq(capsuleSessions.sessionId, data.sessionId))
    .limit(1);
  return result[0];
}

export async function completeCapsuleSession(sessionId: string) {
  if (HAS_SUPABASE) {
    try {
      await supabaseRequest<unknown>("capsule_sessions", {
        method: "PATCH",
        params: { session_id: `eq.${sessionId}` },
        prefer: "return=minimal",
        body: { completed_at: new Date().toISOString() },
      });
      return;
    } catch (error) {
      logSupabaseError("completeCapsuleSession", error);
      if (!canUseMysqlFallback()) throw error;
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(capsuleSessions)
    .set({ completedAt: new Date() })
    .where(eq(capsuleSessions.sessionId, sessionId));
}

export async function getAllSessions() {
  if (HAS_SUPABASE) {
    try {
      const rows = await supabaseRequest<SupabaseCapsuleSessionRow[]>("capsule_sessions", {
        params: {
          select: "session_id,student_name,country,country_code,completed_at,created_at",
          order: "created_at.desc",
        },
      });
      return rows.map(row => ({
        sessionId: row.session_id,
        studentName: row.student_name,
        country: row.country,
        countryCode: row.country_code,
        completedAt: toDate(row.completed_at),
        createdAt: toDate(row.created_at) ?? new Date(),
      }));
    } catch (error) {
      logSupabaseError("getAllSessions", error);
      if (!canUseMysqlFallback()) throw error;
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(capsuleSessions).orderBy(desc(capsuleSessions.createdAt));
}

// ---- Capsule Responses ----

export async function saveResponse(
  data: Omit<InsertCapsuleResponse, "interaction1"> & { interaction1?: string[] | null }
) {
  if (HAS_SUPABASE) {
    try {
      const payload: JsonObject = { session_id: data.sessionId };
      if (data.interaction1 !== undefined) payload.interaction1 = data.interaction1 ?? null;
      if (data.interaction2 !== undefined) payload.interaction2 = data.interaction2 ?? null;
      if (data.interaction3 !== undefined) payload.interaction3 = data.interaction3 ?? null;
      if (data.interaction4Opinion !== undefined) {
        payload.interaction4_opinion = data.interaction4Opinion ?? null;
      }
      if (data.interaction4Text !== undefined) {
        payload.interaction4_text = data.interaction4Text ?? null;
      }
      if (data.interaction5 !== undefined) payload.interaction5 = data.interaction5 ?? null;
      if (data.interaction5b !== undefined) payload.interaction5b = data.interaction5b ?? null;
      if (data.interactionSocio !== undefined) payload.interaction_socio = data.interactionSocio ?? null;

      await supabaseRequest<unknown>("capsule_responses", {
        method: "POST",
        params: { on_conflict: "session_id" },
        prefer: "resolution=merge-duplicates,return=minimal",
        body: payload,
      });
      return;
    } catch (error) {
      logSupabaseError("saveResponse", error);
      if (!canUseMysqlFallback()) throw error;
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const serialized: Partial<InsertCapsuleResponse> = {
    sessionId: data.sessionId,
  };
  if (data.interaction1 !== undefined) {
    serialized.interaction1 = data.interaction1 ? JSON.stringify(data.interaction1) : null;
  }
  if (data.interaction2 !== undefined) serialized.interaction2 = data.interaction2 ?? null;
  if (data.interaction3 !== undefined) serialized.interaction3 = data.interaction3 ?? null;
  if (data.interaction4Opinion !== undefined) {
    serialized.interaction4Opinion = data.interaction4Opinion ?? null;
  }
  if (data.interaction4Text !== undefined) serialized.interaction4Text = data.interaction4Text ?? null;
  if (data.interaction5 !== undefined) serialized.interaction5 = data.interaction5 ?? null;
  if (data.interaction5b !== undefined) serialized.interaction5b = data.interaction5b ?? null;
  if (data.interactionSocio !== undefined) serialized.interactionSocio = data.interactionSocio ?? null;

  const existing = await db
    .select()
    .from(capsuleResponses)
    .where(eq(capsuleResponses.sessionId, data.sessionId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(capsuleResponses)
      .set(serialized)
      .where(eq(capsuleResponses.sessionId, data.sessionId));
  } else {
    await db.insert(capsuleResponses).values(serialized as InsertCapsuleResponse);
  }
}

export async function getResponseBySession(sessionId: string) {
  if (HAS_SUPABASE) {
    try {
      const rows = await supabaseRequest<SupabaseCapsuleResponseRow[]>("capsule_responses", {
        params: {
          select:
            "session_id,interaction1,interaction2,interaction3,interaction4_opinion,interaction4_text,interaction5,created_at",
          session_id: `eq.${sessionId}`,
          limit: "1",
        },
      });
      const row = rows[0];
      if (!row) return null;
      return {
        sessionId: row.session_id,
        interaction1: normalizeInteraction1(row.interaction1),
        interaction2: row.interaction2,
        interaction3: row.interaction3,
        interaction4Opinion: row.interaction4_opinion,
        interaction4Text: row.interaction4_text,
        interaction5: row.interaction5,
        createdAt: toDate(row.created_at) ?? new Date(),
      };
    } catch (error) {
      logSupabaseError("getResponseBySession", error);
      if (!canUseMysqlFallback()) throw error;
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(capsuleResponses)
    .where(eq(capsuleResponses.sessionId, sessionId))
    .limit(1);
  return result[0] ?? null;
}

export async function getAllResponsesWithSessions() {
  if (HAS_SUPABASE) {
    try {
      const rows = await supabaseRequest<SupabaseSessionWithResponse[]>("capsule_sessions", {
        params: {
          select:
            "session_id,student_name,country,country_code,completed_at,created_at,capsule_responses(session_id,interaction1,interaction2,interaction3,interaction4_opinion,interaction4_text,interaction5,created_at)",
          order: "created_at.desc",
        },
      });
      return rows.map(row => {
        const nested = Array.isArray(row.capsule_responses)
          ? row.capsule_responses[0]
          : row.capsule_responses;
        return {
          sessionId: row.session_id,
          studentName: row.student_name,
          country: row.country,
          countryCode: row.country_code,
          completedAt: toDate(row.completed_at),
          createdAt: toDate(row.created_at) ?? new Date(),
          interaction1: normalizeInteraction1(nested?.interaction1),
          interaction2: nested?.interaction2 ?? null,
          interaction3: nested?.interaction3 ?? null,
          interaction4Opinion: nested?.interaction4_opinion ?? null,
          interaction4Text: nested?.interaction4_text ?? null,
          interaction5: nested?.interaction5 ?? null,
          interaction5b: (nested as { interaction5b?: string[] | null } | undefined)?.interaction5b ?? null,
          interactionSocio: (nested as { interaction_socio?: string[] | null } | undefined)?.interaction_socio ?? null,
        };
      });
    } catch (error) {
      logSupabaseError("getAllResponsesWithSessions", error);
      if (!canUseMysqlFallback()) throw error;
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const rows = await db
    .select({
      sessionId: capsuleSessions.sessionId,
      studentName: capsuleSessions.studentName,
      completedAt: capsuleSessions.completedAt,
      createdAt: capsuleSessions.createdAt,
      lat: capsuleSessions.lat,
      lng: capsuleSessions.lng,
      country: capsuleSessions.country,
      city: capsuleSessions.city,
      ipAddress: capsuleSessions.ipAddress,
      interaction1: capsuleResponses.interaction1,
      interaction2: capsuleResponses.interaction2,
      interaction3: capsuleResponses.interaction3,
      interaction4Opinion: capsuleResponses.interaction4Opinion,
      interaction4Text: capsuleResponses.interaction4Text,
      interaction5: capsuleResponses.interaction5,
      interaction5b: capsuleResponses.interaction5b,
      interactionSocio: capsuleResponses.interactionSocio,
    })
    .from(capsuleSessions)
    .leftJoin(capsuleResponses, eq(capsuleSessions.sessionId, capsuleResponses.sessionId))
    .orderBy(desc(capsuleSessions.createdAt));

  return rows.map(row => ({
    ...row,
    country: row.country ?? null,
    countryCode: null,
  }));
}

export async function saveContactInterest(data: InsertContactInterest) {
  if (HAS_SUPABASE) {
    try {
      await supabaseRequest<unknown>("contact_interests", {
        method: "POST",
        prefer: "return=minimal",
        body: {
          session_id: data.sessionId,
          student_name: data.studentName ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          message: data.message ?? null,
        },
      });
      return;
    } catch (error) {
      logSupabaseError("saveContactInterest", error);
      if (!canUseMysqlFallback()) throw error;
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contactInterests).values(data);
}

export async function getAllContactInterests() {
  if (HAS_SUPABASE) {
    try {
      const rows = await supabaseRequest<SupabaseContactInterestRow[]>("contact_interests", {
        params: {
          select: "id,session_id,student_name,email,phone,message,created_at",
          order: "created_at.desc",
        },
      });
      return rows.map(row => ({
        id: row.id,
        sessionId: row.session_id,
        studentName: row.student_name,
        email: row.email,
        phone: row.phone,
        message: row.message,
        createdAt: toDate(row.created_at) ?? new Date(),
      }));
    } catch (error) {
      logSupabaseError("getAllContactInterests", error);
      if (!canUseMysqlFallback()) throw error;
    }
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(contactInterests).orderBy(desc(contactInterests.createdAt));
}
