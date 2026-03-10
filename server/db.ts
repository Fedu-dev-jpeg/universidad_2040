import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, capsuleSessions, capsuleResponses, InsertCapsuleSession, InsertCapsuleResponse, contactInterests, InsertContactInterest } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

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
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ---- Capsule Sessions ----

export async function createCapsuleSession(data: InsertCapsuleSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(capsuleSessions).values(data);
  const result = await db.select().from(capsuleSessions).where(eq(capsuleSessions.sessionId, data.sessionId)).limit(1);
  return result[0];
}

export async function completeCapsuleSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(capsuleSessions).set({ completedAt: new Date() }).where(eq(capsuleSessions.sessionId, sessionId));
}

export async function getAllSessions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(capsuleSessions).orderBy(desc(capsuleSessions.createdAt));
}

// ---- Capsule Responses ----

export async function saveResponse(data: Omit<InsertCapsuleResponse, 'interaction1'> & { interaction1?: string[] | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Serialize interaction1 array as JSON string for storage
  const serialized: InsertCapsuleResponse = {
    ...data,
    interaction1: data.interaction1 ? JSON.stringify(data.interaction1) : null,
  };
  const existing = await db.select().from(capsuleResponses).where(eq(capsuleResponses.sessionId, data.sessionId)).limit(1);
  if (existing.length > 0) {
    await db.update(capsuleResponses).set(serialized).where(eq(capsuleResponses.sessionId, data.sessionId));
  } else {
    await db.insert(capsuleResponses).values(serialized);
  }
}

export async function getResponseBySession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(capsuleResponses).where(eq(capsuleResponses.sessionId, sessionId)).limit(1);
  return result[0] ?? null;
}

export async function getAllResponsesWithSessions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select({
      sessionId: capsuleSessions.sessionId,
      studentName: capsuleSessions.studentName,
      completedAt: capsuleSessions.completedAt,
      createdAt: capsuleSessions.createdAt,
      interaction1: capsuleResponses.interaction1,
      interaction2: capsuleResponses.interaction2,
      interaction3: capsuleResponses.interaction3,
      interaction4Opinion: capsuleResponses.interaction4Opinion,
      interaction4Text: capsuleResponses.interaction4Text,
      interaction5: capsuleResponses.interaction5,
    })
    .from(capsuleSessions)
    .leftJoin(capsuleResponses, eq(capsuleSessions.sessionId, capsuleResponses.sessionId))
    .orderBy(desc(capsuleSessions.createdAt));
}

export async function saveContactInterest(data: InsertContactInterest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contactInterests).values(data);
}

export async function getAllContactInterests() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(contactInterests).orderBy(desc(contactInterests.createdAt));
}
