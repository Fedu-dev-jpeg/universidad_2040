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

const CAPSULE_PASSWORD = "ORT";

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

  // Dashboard administrativo - solo para usuarios autenticados con rol admin
  admin: router({
    getAllResponses: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acceso denegado" });
        }
        return next({ ctx });
      })
      .query(async () => {
        return getAllResponsesWithSessions();
      }),

    getAllSessions: protectedProcedure
      .use(({ ctx, next }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acceso denegado" });
        }
        return next({ ctx });
      })
      .query(async () => {
        return getAllSessions();
      }),
  }),
});

export type AppRouter = typeof appRouter;
