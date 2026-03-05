import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  createCapsuleSession,
  completeCapsuleSession,
  saveResponse,
  getResponseBySession,
  getAllResponsesWithSessions,
  getAllSessions,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";
import { SignJWT, jwtVerify } from "jose";

const CAPSULE_PASSWORD = "ORT";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Formate-1780";
const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "universidad2040-admin-secret-key"
);
const ADMIN_COOKIE = "u2040_admin_session";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  capsule: router({
    // Verificar contraseña y crear sesión
    verifyPassword: publicProcedure
      .input(z.object({ password: z.string(), studentName: z.string().optional() }))
      .mutation(async ({ input }) => {
        if (input.password.toUpperCase() !== CAPSULE_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Contraseña incorrecta" });
        }
        const sessionId = nanoid(32);
        await createCapsuleSession({
          sessionId,
          studentName: input.studentName ?? null,
        });
        return { sessionId };
      }),

    // Guardar respuestas parciales o completas
    saveResponse: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        interaction1: z.string().optional(),
        interaction2: z.array(z.string()).optional(),
        interaction3: z.string().optional(),
        interaction4Opinion: z.string().optional(),
        interaction4Text: z.string().optional(),
        interaction5: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { sessionId, ...rest } = input;
        await saveResponse({ sessionId, ...rest });
        return { success: true };
      }),

    // Completar cápsula y enviar notificación
    complete: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        studentName: z.string().optional(),
        interaction1: z.string().optional(),
        interaction2: z.array(z.string()).optional(),
        interaction3: z.string().optional(),
        interaction4Opinion: z.string().optional(),
        interaction4Text: z.string().optional(),
        interaction5: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { sessionId, ...rest } = input;
        await saveResponse({ sessionId, ...rest });
        await completeCapsuleSession(sessionId);

        // Notificar al propietario
        const summary = `
Alumno: ${rest.studentName ?? "Anónimo"}
Sesión: ${sessionId}

Interacción 1 (Impacto en profesiones): ${rest.interaction1 ?? "-"}
Interacción 2 (Diseñar universidad): ${rest.interaction2?.join(", ") ?? "-"}
Interacción 3 (Habilidad más importante): ${rest.interaction3 ?? "-"}
Interacción 4 (Opinión sobre modelo): ${rest.interaction4Opinion ?? "-"}
Interacción 4 (Sugerencias): ${rest.interaction4Text ?? "-"}
Interacción 5 (Ranking): ${rest.interaction5?.join(" > ") ?? "-"}
        `.trim();

        await notifyOwner({
          title: `Nueva respuesta completada - ${rest.studentName ?? "Alumno anónimo"}`,
          content: summary,
        });

        return { success: true };
      }),

    // Obtener respuesta de una sesión
    getResponse: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return getResponseBySession(input.sessionId);
      }),
  }),

  // Dashboard administrativo - login propio con usuario/contraseña
  admin: router({
    // Login con credenciales propias (independiente de OAuth)
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (input.username !== ADMIN_USERNAME || input.password !== ADMIN_PASSWORD) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Credenciales incorrectas" });
        }
        const token = await new SignJWT({ role: "admin", sub: "admin" })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("24h")
          .sign(ADMIN_JWT_SECRET);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(ADMIN_COOKIE, token, { ...cookieOptions, maxAge: 86400 });
        return { success: true };
      }),

    // Logout del dashboard
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(ADMIN_COOKIE, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    // Verificar sesión admin
    me: publicProcedure.query(async ({ ctx }) => {
      const token = ctx.req.cookies?.[ADMIN_COOKIE];
      if (!token) return null;
      try {
        await jwtVerify(token, ADMIN_JWT_SECRET);
        return { username: ADMIN_USERNAME, role: "admin" };
      } catch {
        return null;
      }
    }),

    getAllResponses: publicProcedure
      .query(async ({ ctx }) => {
        const token = ctx.req.cookies?.[ADMIN_COOKIE];
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "No autenticado" });
        try {
          await jwtVerify(token, ADMIN_JWT_SECRET);
        } catch {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión expirada" });
        }
        return getAllResponsesWithSessions();
      }),

    getAllSessions: publicProcedure
      .query(async ({ ctx }) => {
        const token = ctx.req.cookies?.[ADMIN_COOKIE];
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "No autenticado" });
        try {
          await jwtVerify(token, ADMIN_JWT_SECRET);
        } catch {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión expirada" });
        }
        return getAllSessions();
      }),
  }),
});

export type AppRouter = typeof appRouter;
