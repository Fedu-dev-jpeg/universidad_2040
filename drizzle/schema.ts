import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Sesiones de alumnos que acceden con contraseña ORT
export const capsuleSessions = mysqlTable("capsule_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  studentName: varchar("studentName", { length: 255 }),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CapsuleSession = typeof capsuleSessions.$inferSelect;
export type InsertCapsuleSession = typeof capsuleSessions.$inferInsert;

// Respuestas de cada alumno
export const capsuleResponses = mysqlTable("capsule_responses", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  // Interacción 1: selección múltiple (una opción)
  interaction1: varchar("interaction1", { length: 255 }),
  // Interacción 2: checkbox múltiple (JSON array de opciones elegidas)
  interaction2: json("interaction2").$type<string[]>(),
  // Interacción 3: selección múltiple (una opción)
  interaction3: varchar("interaction3", { length: 255 }),
  // Interacción 4a: escala de opinión
  interaction4Opinion: varchar("interaction4Opinion", { length: 50 }),
  // Interacción 4b: texto abierto
  interaction4Text: text("interaction4Text"),
  // Interacción 5: ranking (JSON array ordenado)
  interaction5: json("interaction5").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CapsuleResponse = typeof capsuleResponses.$inferSelect;
export type InsertCapsuleResponse = typeof capsuleResponses.$inferInsert;
