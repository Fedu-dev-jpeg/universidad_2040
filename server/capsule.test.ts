import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  createCapsuleSession: vi.fn().mockResolvedValue({ sessionId: "test-session-id", studentName: "Test" }),
  completeCapsuleSession: vi.fn().mockResolvedValue(undefined),
  saveResponse: vi.fn().mockResolvedValue(undefined),
  getResponseBySession: vi.fn().mockResolvedValue(null),
  getAllResponsesWithSessions: vi.fn().mockResolvedValue([]),
  getAllSessions: vi.fn().mockResolvedValue([]),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("mock-session-id-32chars"),
}));

// Mock jose for admin JWT
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-admin-jwt-token"),
  })),
  jwtVerify: vi.fn().mockResolvedValue({ payload: { role: "admin", sub: "admin" } }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
      cookies: { u2040_admin_session: "mock-admin-jwt-token" },
    } as TrpcContext["req"],
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-open-id",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("capsule.verifyPassword", () => {
  it("should return sessionId when password is correct (ORT)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.capsule.verifyPassword({
      password: "ORT",
      studentName: "Juan Pérez",
    });
    expect(result).toHaveProperty("sessionId");
    expect(typeof result.sessionId).toBe("string");
  });

  it("should reject password if it is not exact uppercase ORT", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.capsule.verifyPassword({ password: "ort", studentName: "Ana López" })
    ).rejects.toThrow();
  });

  it("should require full name (name + lastname)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.capsule.verifyPassword({ password: "ORT", studentName: "Juan" })
    ).rejects.toThrow();
  });

  it("should throw UNAUTHORIZED for wrong password", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.capsule.verifyPassword({ password: "wrong", studentName: "Juan Pérez" })
    ).rejects.toThrow();
  });
});

describe("capsule.saveResponse", () => {
  it("should save partial response without error", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.capsule.saveResponse({
      sessionId: "test-session",
      interaction1: ["Inteligencia artificial", "Ciencia de datos"],
    });
    expect(result.success).toBe(true);
  });
});

describe("capsule.complete", () => {
  it("should complete session and return success", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.capsule.complete({
      sessionId: "test-session",
      studentName: "María",
      interaction1: ["Inteligencia artificial", "Ciencia de datos"],
      interaction2: ["Investigación", "Laboratorios tecnológicos", "Intercambio internacional"],
      interaction3: "Resolver problemas complejos",
      interaction4Opinion: "Sí",
      interaction4Text: "Agregaría más énfasis en ética",
      interaction5: ["Tecnología avanzada", "Pensamiento crítico", "Aprendizaje práctico"],
    });
    expect(result.success).toBe(true);
  });
});

describe("admin.getAllResponses", () => {
  it("should return data for admin users", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.getAllResponses();
    expect(Array.isArray(result)).toBe(true);
  });

  it("should throw FORBIDDEN for non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getAllResponses()).rejects.toThrow();
  });

  it("should throw for unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getAllResponses()).rejects.toThrow();
  });
});

describe("auth.logout", () => {
  it("should clear session cookie and return success", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
