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
  saveContactInterest,
  getAllContactInterests,
} from "./db";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";
import { SignJWT, jwtVerify } from "jose";

const CAPSULE_PASSWORD = "ORT";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Formate-1780";
const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "universidad2040-admin-secret-key"
);
const ADMIN_COOKIE = "u2040_admin_session";

function getAdminToken(ctx: { req: { cookies?: Record<string, string>; headers: Record<string, string | string[] | undefined> } }): string | undefined {
  // Prefer header token (localStorage-based, more reliable across proxies)
  const headerToken = ctx.req.headers["x-admin-token"];
  if (headerToken && typeof headerToken === "string") return headerToken;
  // Fallback to cookie
  return ctx.req.cookies?.[ADMIN_COOKIE];
}

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
        interaction1: z.array(z.string()).optional(),
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
        interaction1: z.array(z.string()).optional(),
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

Interacción 1 (Impacto en profesiones): ${rest.interaction1?.join(", ") ?? "-"}
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
        // Also return the token in the response body for localStorage-based auth
        return { success: true, token };
      }),

    // Logout del dashboard
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(ADMIN_COOKIE, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

     // Verificar sesión admin
    me: publicProcedure.query(async ({ ctx }) => {
      const token = getAdminToken(ctx);
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
        const token = getAdminToken(ctx);
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
        const token = getAdminToken(ctx);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "No autenticado" });
        try {
          await jwtVerify(token, ADMIN_JWT_SECRET);
        } catch {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión expirada" });
        }
        return getAllSessions();
      }),
    // Generar informe ejecutivo con IA
    generateReport: publicProcedure
      .mutation(async ({ ctx }) => {
        const token = getAdminToken(ctx);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "No autenticado" });
        try {
          await jwtVerify(token, ADMIN_JWT_SECRET);
        } catch {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión expirada" });
        }

        const responses = await getAllResponsesWithSessions();
        if (responses.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "No hay respuestas para analizar" });
        }

        // Construir resumen estadístico para la IA
        const total = responses.length;
        const int1Counts: Record<string, number> = {};
        const int2Counts: Record<string, number> = {};
        const int3Counts: Record<string, number> = {};
        const int4Counts: Record<string, number> = {};
        const int5Scores: Record<string, number> = {};
        const openTexts: string[] = [];

        for (const r of responses) {
          // interaction1 is stored as JSON string in a text column
          if (r.interaction1) {
            try {
              const items1 = JSON.parse(r.interaction1 as unknown as string) as string[];
              for (const item of items1) int1Counts[item] = (int1Counts[item] ?? 0) + 1;
            } catch {
              // fallback: treat as plain string
              int1Counts[r.interaction1] = (int1Counts[r.interaction1] ?? 0) + 1;
            }
          }
          // interaction2 uses json() column type - already parsed by Drizzle
          if (r.interaction2) {
            const items2 = Array.isArray(r.interaction2)
              ? r.interaction2 as string[]
              : JSON.parse(r.interaction2 as unknown as string) as string[];
            for (const item of items2) int2Counts[item] = (int2Counts[item] ?? 0) + 1;
          }
          if (r.interaction3) int3Counts[r.interaction3] = (int3Counts[r.interaction3] ?? 0) + 1;
          if (r.interaction4Opinion) int4Counts[r.interaction4Opinion] = (int4Counts[r.interaction4Opinion] ?? 0) + 1;
          if (r.interaction4Text?.trim()) openTexts.push(r.interaction4Text.trim());
          // interaction5 uses json() column type - already parsed by Drizzle
          if (r.interaction5) {
            const ranking = Array.isArray(r.interaction5)
              ? r.interaction5 as string[]
              : JSON.parse(r.interaction5 as unknown as string) as string[];
            ranking.forEach((item, idx) => {
              const score = ranking.length - idx;
              int5Scores[item] = (int5Scores[item] ?? 0) + score;
            });
          }
        }

        const statsText = `
Total de respuestas: ${total}

Pregunta 1 - ¿Qué cambio impactará más en las profesiones?:
${Object.entries(int1Counts).map(([k, v]) => `  - ${k}: ${v} votos (${Math.round(v/total*100)}%)`).join('\n')}

Pregunta 2 - Elementos que no pueden faltar en la universidad (top elegidos):
${Object.entries(int2Counts).sort((a,b)=>b[1]-a[1]).map(([k, v]) => `  - ${k}: ${v} menciones`).join('\n')}

Pregunta 3 - Habilidad más importante del profesional del futuro:
${Object.entries(int3Counts).map(([k, v]) => `  - ${k}: ${v} votos (${Math.round(v/total*100)}%)`).join('\n')}

Pregunta 4 - ¿Está preparada la universidad actual?:
${Object.entries(int4Counts).map(([k, v]) => `  - ${k}: ${v} votos (${Math.round(v/total*100)}%)`).join('\n')}

Sugerencias y opiniones abiertas (${openTexts.length} respuestas):
${openTexts.slice(0, 15).map((t, i) => `  ${i+1}. "${t}"`).join('\n')}

Ranking ponderado de prioridades para la universidad del futuro:
${Object.entries(int5Scores).sort((a,b)=>b[1]-a[1]).map(([k, v], i) => `  ${i+1}. ${k} (puntaje: ${v})`).join('\n')}
        `.trim();

         // Generate FODA analysis in structured JSON
        const fodaResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Sos un analista experto en educación superior. Generá un análisis FODA (Fortalezas, Oportunidades, Debilidades, Amenazas) del sistema universitario argentino actual, basado en los datos de la encuesta. Respondé ÚNICAMENTE con un JSON válido con esta estructura exacta: {\"fortalezas\": [\"...\", ...], \"oportunidades\": [\"...\", ...], \"debilidades\": [\"...\", ...], \"amenazas\": [\"...\", ...]}. Cada array debe tener entre 4 y 6 ítems concisos (máximo 15 palabras por ítem). Sin texto adicional fuera del JSON.",
            },
            {
              role: "user",
              content: `Basándote en estos datos de la encuesta Universidad 2040 de ORT Argentina, generá el FODA:\n\n${statsText}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "foda_analysis",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  fortalezas: { type: "array", items: { type: "string" } },
                  oportunidades: { type: "array", items: { type: "string" } },
                  debilidades: { type: "array", items: { type: "string" } },
                  amenazas: { type: "array", items: { type: "string" } },
                },
                required: ["fortalezas", "oportunidades", "debilidades", "amenazas"],
                additionalProperties: false,
              },
            },
          },
        });
        let foda: { fortalezas: string[]; oportunidades: string[]; debilidades: string[]; amenazas: string[] } | null = null;
        try {
          const fodaContent = fodaResponse.choices[0]?.message?.content;
          const fodaRaw = typeof fodaContent === "string" ? fodaContent : "{}";
          foda = JSON.parse(fodaRaw);
        } catch {
          foda = null;
        }

        // Generate narrative report
        const llmResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Sos un analista experto en educación superior y transformación universitaria para América Latina. Tu tarea es generar un informe ejecutivo profesional, estratégico y accionable basado en los datos de una encuesta interactiva llamada "Universidad 2040" de ORT Argentina. El informe debe ser en español rioplatense, tener un tono académico-ejecutivo, y estar estructurado en secciones claras con insights profundos, no solo descripción de datos. Usá markdown con títulos, subtítulos, tablas y listas. Incluí: resumen ejecutivo, análisis por dimensión, insights clave, patrones emergentes, recomendaciones estratégicas y conclusión. El informe debe ser útil para la dirección académica de una universidad de alto nivel.`,
            },
            {
              role: "user",
              content: `Generá un informe ejecutivo completo basado en los siguientes datos de la encuesta Universidad 2040 de ORT Argentina:\n\n${statsText}\n\nEl informe debe ser detallado, con al menos 800 palabras, incluir análisis de tendencias, comparaciones entre respuestas, y recomendaciones concretas para el diseño curricular y la estrategia institucional.`,
            },
          ],
        });
        const reportContent = llmResponse.choices[0]?.message?.content ?? "No se pudo generar el informe.";
        return { report: reportContent, foda, generatedAt: new Date().toISOString(), totalResponses: total };
      }),
    // Guardar interés de contacto presencial
    saveContactInterest: publicProcedure
      .input(z.object({
        sessionId: z.string(),
        studentName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await saveContactInterest({
          sessionId: input.sessionId,
          studentName: input.studentName ?? null,
          email: input.email ?? null,
          phone: input.phone ?? null,
          message: input.message ?? null,
        });
        return { success: true };
      }),
    // Obtener todos los contactos interesados (admin)
    getContactInterests: publicProcedure
      .query(async ({ ctx }) => {
        const token = getAdminToken(ctx);
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "No autenticado" });
        try {
          await jwtVerify(token, ADMIN_JWT_SECRET);
        } catch {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Sesión expirada" });
        }
        return getAllContactInterests();
      }),
  }),
});

export type AppRouter = typeof appRouter;
