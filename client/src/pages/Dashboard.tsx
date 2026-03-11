import { useState, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BarChart, Bar, PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { Streamdown } from "streamdown";
import {
  LogOut, Download, RefreshCw, Sparkles, Users, CheckCircle2,
  BarChart2, FileText, Table2, X, Eye, EyeOff, Calendar,
  Search, TrendingUp, MessageSquare, ChevronLeft, ChevronRight,
  Award, Brain, Globe, Lightbulb, Target,
} from "lucide-react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const ORT_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_white_aefdc03d.png";
const COLORS = ["#003087","#00a651","#4f8ef7","#f59e0b","#e11d48","#8b5cf6","#06b6d4","#f97316"];
const DARK_BG = "#070b14";
const COUNTRY_MARKER_COORDS: Record<string, { x: number; y: number }> = {
  AR: { x: 25, y: 66 },
  UY: { x: 26, y: 67 },
  CL: { x: 22, y: 65 },
  BR: { x: 30, y: 58 },
  PY: { x: 28, y: 62 },
  BO: { x: 27, y: 60 },
  PE: { x: 24, y: 58 },
  CO: { x: 22, y: 53 },
  MX: { x: 16, y: 43 },
  US: { x: 18, y: 36 },
  ES: { x: 49, y: 36 },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ResponseRow {
  sessionId: string;
  studentName: string | null;
  country: string | null;
  countryCode: string | null;
  completedAt: Date | null;
  createdAt: Date;
  lat: string | null;
  lng: string | null;
  city: string | null;
  ipAddress: string | null;
  interaction1: string | null;
  interaction2: string[] | null;
  interaction3: string | null;
  interaction4Opinion: string | null;
  interaction4Text: string | null;
  interaction5: string[] | null;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 text-sm"
      style={{ background: "rgba(10,16,30,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
      <p className="text-white/60 text-xs mb-1">{label}</p>
      <p className="font-bold text-white">{payload[0].value} respuestas</p>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
      <div className="flex-1">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</p>
          {sub && <p className="text-white/30 text-xs">{sub}</p>}
        </div>
      </div>
      <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1.5px solid ${color}35` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
  );
}

// ─── Drill-down Modal ─────────────────────────────────────────────────────────
function DrillDownModal({ title, data, rows, onClose }: {
  title: string;
  data: { name: string; value: number }[];
  rows: ResponseRow[];
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const filteredRows = selected
    ? rows.filter(r => {
        const vals = [r.interaction1, r.interaction3, r.interaction4Opinion, ...(r.interaction2 ?? [])];
        return vals.includes(selected);
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
        style={{ background: "#0d1424", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-white font-bold text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-white/40 text-sm mb-4">Hacé clic en una opción para ver quién la eligió:</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {data.map((d, i) => (
              <button key={d.name} onClick={() => setSelected(selected === d.name ? null : d.name)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: selected === d.name ? `${COLORS[i % COLORS.length]}30` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${selected === d.name ? COLORS[i % COLORS.length] : "rgba(255,255,255,0.1)"}`,
                  color: selected === d.name ? COLORS[i % COLORS.length] : "rgba(255,255,255,0.6)",
                }}>
                {d.name} ({d.value})
              </button>
            ))}
          </div>
          {selected && (
            <div>
              <p className="text-white/60 text-sm mb-3 font-semibold">{filteredRows.length} alumno(s) eligieron: <span className="text-white">"{selected}"</span></p>
              <div className="space-y-2">
                {filteredRows.map(r => (
                  <div key={r.sessionId} className="rounded-xl px-4 py-3 flex items-center justify-between"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-white font-medium text-sm">{r.studentName ?? "Anónimo"}</span>
                    <span className="text-white/30 text-xs">{r.completedAt ? new Date(r.completedAt).toLocaleDateString("es-AR") : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Report Section ───────────────────────────────────────────────────────────
function ReportSection({
  rows, int1Data, int2Data, int3Data, int4Data, int5Data,
  totalResponses, completedResponses, completionRate, withOpinion,
}: {
  rows: ResponseRow[];
  int1Data: { name: string; value: number }[];
  int2Data: { name: string; value: number }[];
  int3Data: { name: string; value: number }[];
  int4Data: { name: string; value: number }[];
  int5Data: { name: string; value: number }[];
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  withOpinion: number;
}) {
  const reportRef = useRef<HTMLDivElement>(null);
  const generateReport = trpc.admin.generateReport.useMutation();
   const [reportContent, setReportContent] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [fodaData, setFodaData] = useState<{ fortalezas: string[]; oportunidades: string[]; debilidades: string[]; amenazas: string[] } | null>(null);
  const handleGenerateReport = () => {
    generateReport.mutate(undefined, {
      onSuccess: (data) => {
        setReportContent(typeof data.report === "string" ? data.report : String(data.report));
        setReportDate(data.generatedAt);
        if (data.foda) setFodaData(data.foda as { fortalezas: string[]; oportunidades: string[]; debilidades: string[]; amenazas: string[] });
        toast.success("Informe ejecutivo generado con IA");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleExportPDF = useCallback(async () => {
    if (!reportContent || !reportRef.current) {
      toast.error("Primero generá el informe con IA");
      return;
    }
    setIsExportingPdf(true);
    try {
      const [{ default: html2canvas }, jspdfModule] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const JsPDF = (jspdfModule as { jsPDF?: typeof import("jspdf")["jsPDF"]; default?: typeof import("jspdf")["jsPDF"] }).jsPDF
        ?? (jspdfModule as { default: typeof import("jspdf")["jsPDF"] }).default;

      // Temporarily expand the container so nothing is clipped
      const el = reportRef.current;
      const prevOverflow = el.style.overflow;
      el.style.overflow = "visible";

      const canvas = await html2canvas(el, {
        backgroundColor: "#070b14",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      el.style.overflow = prevOverflow;

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let yPos = margin;
      let remainingHeight = imgHeight;
      let sourceY = 0;

      // Slice the canvas across multiple pages
      while (remainingHeight > 0) {
        const sliceHeight = Math.min(remainingHeight, pageHeight - margin * 2);
        const sliceCanvas = document.createElement("canvas");
        const slicePixelHeight = Math.round((sliceHeight / imgHeight) * canvas.height);
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = slicePixelHeight;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, sourceY, canvas.width, slicePixelHeight, 0, 0, canvas.width, slicePixelHeight);
        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
        pdf.addImage(sliceData, "JPEG", margin, yPos, imgWidth, sliceHeight);
        remainingHeight -= sliceHeight;
        sourceY += slicePixelHeight;
        if (remainingHeight > 0) {
          pdf.addPage();
          yPos = margin;
        }
      }

      pdf.save(`informe_universidad2040_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF descargado correctamente");
    } catch (e) {
      console.error("PDF error:", e);
      toast.error("Error al generar el PDF: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsExportingPdf(false);
    }
  }, [reportContent, reportRef]);

  const handleExportMD = () => {
    if (!reportContent) return;
    const blob = new Blob([reportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `informe_universidad2040_${new Date().toISOString().slice(0, 10)}.md`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Markdown descargado");
  };

  const topInt1 = int1Data[0]?.name ?? "—";
  const topInt3 = int3Data[0]?.name ?? "—";
  const topInt5 = int5Data[0]?.name ?? "—";
  const topOpinion = int4Data.sort((a, b) => b.value - a.value)[0]?.name ?? "—";

  return (
    <div>
      {/* Header actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-bold text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>Informe Ejecutivo</h2>
          <p className="text-white/40 text-sm mt-1">Análisis visual + narrativo generado con IA</p>
        </div>
        <div className="flex items-center gap-2">
          {reportContent && (
            <>
              <button onClick={handleExportMD}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "rgba(0,166,81,0.1)", border: "1px solid rgba(0,166,81,0.25)", color: "#00a651" }}>
                <FileText className="w-3.5 h-3.5" /> .md
              </button>
              <button onClick={handleExportPDF} disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", color: "#f87171" }}>
                <Download className={`w-3.5 h-3.5 ${isExportingPdf ? "animate-bounce" : ""}`} />
                {isExportingPdf ? "Generando PDF..." : "Descargar PDF"}
              </button>
            </>
          )}
          <button onClick={handleGenerateReport} disabled={generateReport.isPending || rows.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #003087, #00a651)", color: "white", boxShadow: "0 4px 20px rgba(0,48,135,0.4)" }}>
            <Sparkles className={`w-4 h-4 ${generateReport.isPending ? "animate-spin" : ""}`} />
            {generateReport.isPending ? "Generando..." : reportContent ? "Regenerar" : "Generar con IA"}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!reportContent && !generateReport.isPending && (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>
          <Sparkles className="w-14 h-14 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 font-semibold text-lg mb-2">Informe ejecutivo con IA</p>
          <p className="text-white/25 text-sm max-w-md mx-auto leading-relaxed">
            Hacé clic en "Generar con IA" para crear un análisis ejecutivo completo con insights, tendencias y recomendaciones estratégicas basadas en las respuestas de los alumnos.
          </p>
          {rows.length === 0 && <p className="text-amber-400/60 text-xs mt-4">Necesitás al menos una respuesta para generar el informe.</p>}
        </div>
      )}

      {/* Loading */}
      {generateReport.isPending && (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: "rgba(0,48,135,0.05)", border: "1px solid rgba(0,48,135,0.15)" }}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-white/60 font-medium">Analizando {rows.length} respuestas con IA...</span>
          </div>
          <p className="text-white/30 text-sm">Esto puede tomar 15–30 segundos.</p>
        </div>
      )}

      {/* Full visual report */}
      {reportContent && !generateReport.isPending && (
        <div ref={reportRef} className="space-y-6">
          {/* Report header */}
          <div className="rounded-3xl p-8 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, rgba(0,48,135,0.4) 0%, rgba(0,166,81,0.2) 100%)", border: "1px solid rgba(0,166,81,0.2)" }}>
            <div className="absolute inset-0 opacity-5"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #003087 0%, transparent 50%), radial-gradient(circle at 80% 50%, #00a651 0%, transparent 50%)" }} />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img src={ORT_LOGO} alt="ORT" className="h-8 object-contain" />
                  <div className="h-6 w-px bg-white/20" />
                  <span className="text-white/50 text-sm font-medium">Universidad 2040</span>
                </div>
                <h1 className="text-white text-3xl font-black mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Informe Ejecutivo
                </h1>
                <p className="text-white/50 text-sm">
                  Generado el {reportDate ? new Date(reportDate).toLocaleString("es-AR") : "—"} · {rows.length} respuestas analizadas
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-5xl font-black text-white/10" style={{ fontFamily: "'Syne', sans-serif" }}>2040</div>
              </div>
            </div>
          </div>

          {/* KPI summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(0,48,135,0.15)", border: "1px solid rgba(0,48,135,0.3)" }}>
              <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{totalResponses}</div>
              <div className="text-white/50 text-xs font-semibold uppercase tracking-widest">Respuestas totales</div>
            </div>
            <div className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(0,166,81,0.15)", border: "1px solid rgba(0,166,81,0.3)" }}>
              <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{completionRate}%</div>
              <div className="text-white/50 text-xs font-semibold uppercase tracking-widest">Tasa de completado</div>
            </div>
            <div className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.3)" }}>
              <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{withOpinion}</div>
              <div className="text-white/50 text-xs font-semibold uppercase tracking-widest">Con sugerencias</div>
            </div>
            <div className="rounded-2xl p-5 text-center"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <div className="text-4xl font-black text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{completedResponses}</div>
              <div className="text-white/50 text-xs font-semibold uppercase tracking-widest">Completadas</div>
            </div>
          </div>

          {/* Top insights */}
          <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              <Target className="w-5 h-5 text-green-400" /> Hallazgos Principales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Globe, label: "Principal fuerza disruptiva", value: topInt1, color: "#003087" },
                { icon: Brain, label: "Habilidad más valorada", value: topInt3, color: "#00a651" },
                { icon: Award, label: "Prioridad universitaria #1", value: topInt5, color: "#4f8ef7" },
                { icon: Lightbulb, label: "Opinión sobre modelo actual", value: topOpinion, color: "#f59e0b" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-start gap-3 rounded-xl p-4"
                  style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}20` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-white font-bold text-sm leading-tight">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Int 1 - Pie */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-white font-bold mb-1 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Interacción 1: Fuerza Disruptiva</h4>
              <p className="text-white/30 text-xs mb-4">¿Qué impactará más en las profesiones?</p>
              {int1Data.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={int1Data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {int1Data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-white/20 text-sm">Sin datos</div>}
              <div className="flex flex-wrap gap-2 mt-3">
                {int1Data.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="truncate max-w-28">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Int 3 - Pie */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-white font-bold mb-1 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Interacción 3: Habilidad Clave</h4>
              <p className="text-white/30 text-xs mb-4">¿Cuál es la habilidad más importante?</p>
              {int3Data.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={int3Data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {int3Data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-white/20 text-sm">Sin datos</div>}
              <div className="flex flex-wrap gap-2 mt-3">
                {int3Data.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="truncate max-w-28">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Int 2 - Horizontal bars */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-white font-bold mb-1 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Interacción 2: Diseño de Universidad</h4>
              <p className="text-white/30 text-xs mb-4">Elementos más elegidos (top 3 de 8)</p>
              {int2Data.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={int2Data.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                      tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {int2Data.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-white/20 text-sm">Sin datos</div>}
            </div>

            {/* Int 4 - Opinion donut */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-white font-bold mb-1 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Interacción 4: Modelo Actual</h4>
              <p className="text-white/30 text-xs mb-4">¿Está preparado el modelo universitario?</p>
              {int4Data.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={int4Data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {int4Data.map((_, i) => <Cell key={i} fill={["#00a651","#f59e0b","#e11d48"][i % 3]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-48 flex items-center justify-center text-white/20 text-sm">Sin datos</div>}
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {int4Data.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: ["#00a651","#f59e0b","#e11d48"][i % 3] }} />
                    <span>{d.name.split(",")[0]}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Int 5 - Radar */}
          {int5Data.length > 0 && (
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-white font-bold mb-1 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Interacción 5: Prioridades Universitarias</h4>
              <p className="text-white/30 text-xs mb-4">Ranking ponderado de los 8 elementos (mayor puntaje = mayor prioridad)</p>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={int5Data.map(d => ({ subject: d.name.length > 20 ? d.name.slice(0, 20) + "…" : d.name, value: d.value }))}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8 }} />
                  <Radar name="Puntaje" dataKey="value" stroke="#003087" fill="#003087" fillOpacity={0.3} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Sugerencias abiertas */}
          {rows.filter(r => r.interaction4Text?.trim()).length > 0 && (
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-white font-bold mb-4 text-sm flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                <MessageSquare className="w-4 h-4 text-blue-400" />
                Sugerencias de los Alumnos
              </h4>
              <div className="space-y-3">
                {rows.filter(r => r.interaction4Text?.trim()).map(r => (
                  <div key={r.sessionId} className="rounded-xl p-4"
                    style={{ background: "rgba(0,48,135,0.1)", border: "1px solid rgba(0,48,135,0.2)" }}>
                    <p className="text-white/70 text-sm italic leading-relaxed">"{r.interaction4Text}"</p>
                    <p className="text-white/30 text-xs mt-2">— {r.studentName ?? "Anónimo"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FODA Analysis */}
          {fodaData && (
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h4 className="text-white font-bold mb-5 text-sm flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                <span className="text-lg">⊞</span>
                Análisis FODA — Universidad 2040
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {/* Fortalezas */}
                <div className="rounded-xl p-4" style={{ background: "rgba(0,166,81,0.08)", border: "1px solid rgba(0,166,81,0.25)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Fortalezas</span>
                  </div>
                  <ul className="space-y-1.5">
                    {fodaData.fortalezas.map((item, i) => (
                      <li key={i} className="text-white/70 text-xs leading-relaxed flex gap-2">
                        <span className="text-green-500 mt-0.5 shrink-0">+</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Oportunidades */}
                <div className="rounded-xl p-4" style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Oportunidades</span>
                  </div>
                  <ul className="space-y-1.5">
                    {fodaData.oportunidades.map((item, i) => (
                      <li key={i} className="text-white/70 text-xs leading-relaxed flex gap-2">
                        <span className="text-blue-400 mt-0.5 shrink-0">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Debilidades */}
                <div className="rounded-xl p-4" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Debilidades</span>
                  </div>
                  <ul className="space-y-1.5">
                    {fodaData.debilidades.map((item, i) => (
                      <li key={i} className="text-white/70 text-xs leading-relaxed flex gap-2">
                        <span className="text-amber-400 mt-0.5 shrink-0">−</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Amenazas */}
                <div className="rounded-xl p-4" style={{ background: "rgba(225,29,72,0.08)", border: "1px solid rgba(225,29,72,0.25)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Amenazas</span>
                  </div>
                  <ul className="space-y-1.5">
                    {fodaData.amenazas.map((item, i) => (
                      <li key={i} className="text-white/70 text-xs leading-relaxed flex gap-2">
                        <span className="text-red-400 mt-0.5 shrink-0">!</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* AI narrative */}
          <div className="rounded-2xl p-8" style={{ background: "rgba(0,48,135,0.08)", border: "1px solid rgba(0,48,135,0.2)" }}>
            <h4 className="text-white font-bold mb-4 text-sm flex items-center gap-2" style={{ fontFamily: "'Syne', sans-serif" }}>
              <Sparkles className="w-4 h-4 text-blue-400" />
              Análisis Narrativo con IA
            </h4>
            <div className="prose prose-invert prose-sm max-w-none text-white/70">
              <Streamdown>{reportContent}</Streamdown>
            </div>
          </div>

          {/* Footer */}
          <div className="rounded-2xl p-5 flex items-center justify-between"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-3">
              <img src={ORT_LOGO} alt="ORT" className="h-6 object-contain opacity-60" />
              <span className="text-white/20 text-xs">Universidad 2040 · Cápsula Interactiva</span>
            </div>
            <span className="text-white/20 text-xs">{reportDate ? new Date(reportDate).toLocaleDateString("es-AR") : "—"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const login = trpc.admin.login.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate({ username, password }, {
      onSuccess: (data) => {
        if (data.token) localStorage.setItem("u2040_admin_token", data.token);
        utils.admin.me.invalidate();
      },
      onError: (err) => setError(err.message),
    });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#060a18" }}>
      {/* Left: Globe visualization */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(135deg, #060a18 0%, #0a1228 50%, #060a18 100%)" }}>
        {/* Grid dots pattern */}
        <div className="absolute inset-0 z-0" style={{
          backgroundImage: "radial-gradient(rgba(0,120,255,0.15) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        {/* Globe glow */}
        <div className="absolute z-0" style={{
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,80,220,0.25) 0%, rgba(0,200,120,0.08) 40%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          filter: "blur(30px)",
        }} />
        {/* Globe SVG illustration */}
        <div className="relative z-10" style={{ width: "420px", height: "420px" }}>
          <svg viewBox="0 0 420 420" className="w-full h-full">
            {/* Globe circle */}
            <circle cx="210" cy="210" r="160" fill="none" stroke="rgba(0,100,220,0.3)" strokeWidth="1.5" />
            <circle cx="210" cy="210" r="160" fill="url(#globeGrad)" opacity="0.15" />
            {/* Latitude lines */}
            <ellipse cx="210" cy="210" rx="160" ry="40" fill="none" stroke="rgba(0,120,255,0.15)" strokeWidth="0.8" />
            <ellipse cx="210" cy="180" rx="150" ry="60" fill="none" stroke="rgba(0,120,255,0.12)" strokeWidth="0.8" />
            <ellipse cx="210" cy="240" rx="150" ry="60" fill="none" stroke="rgba(0,120,255,0.12)" strokeWidth="0.8" />
            <ellipse cx="210" cy="150" rx="130" ry="80" fill="none" stroke="rgba(0,120,255,0.08)" strokeWidth="0.8" />
            <ellipse cx="210" cy="270" rx="130" ry="80" fill="none" stroke="rgba(0,120,255,0.08)" strokeWidth="0.8" />
            {/* Longitude lines */}
            <ellipse cx="210" cy="210" rx="40" ry="160" fill="none" stroke="rgba(0,120,255,0.15)" strokeWidth="0.8" />
            <ellipse cx="210" cy="210" rx="80" ry="160" fill="none" stroke="rgba(0,120,255,0.12)" strokeWidth="0.8" />
            <ellipse cx="210" cy="210" rx="120" ry="160" fill="none" stroke="rgba(0,120,255,0.10)" strokeWidth="0.8" />
            {/* Connection lines */}
            <line x1="120" y1="140" x2="180" y2="180" stroke="rgba(0,200,120,0.4)" strokeWidth="1" />
            <line x1="180" y1="180" x2="260" y2="160" stroke="rgba(0,200,120,0.3)" strokeWidth="1" />
            <line x1="260" y1="160" x2="310" y2="220" stroke="rgba(0,150,255,0.35)" strokeWidth="1" />
            <line x1="310" y1="220" x2="280" y2="290" stroke="rgba(0,200,120,0.25)" strokeWidth="1" />
            <line x1="180" y1="180" x2="150" y2="260" stroke="rgba(0,150,255,0.3)" strokeWidth="1" />
            <line x1="150" y1="260" x2="240" y2="280" stroke="rgba(0,200,120,0.25)" strokeWidth="1" />
            <line x1="240" y1="280" x2="310" y2="220" stroke="rgba(0,150,255,0.2)" strokeWidth="1" />
            {/* Nodes */}
            {[
              { x:120, y:140, c:"#00c8ff", s:5 }, { x:180, y:180, c:"#00e87a", s:6 },
              { x:260, y:160, c:"#00c8ff", s:5 }, { x:310, y:220, c:"#00e87a", s:4 },
              { x:150, y:260, c:"#00c8ff", s:5 }, { x:240, y:280, c:"#00e87a", s:4 },
              { x:280, y:290, c:"#00c8ff", s:3 }, { x:100, y:200, c:"#00e87a", s:3 },
              { x:330, y:170, c:"#00c8ff", s:3 }, { x:200, y:130, c:"#00e87a", s:4 },
            ].map((n, i) => (
              <g key={i}>
                <circle cx={n.x} cy={n.y} r={n.s + 4} fill={n.c} opacity="0.15" />
                <circle cx={n.x} cy={n.y} r={n.s} fill={n.c} opacity="0.8" />
                <circle cx={n.x} cy={n.y} r={n.s - 1.5} fill="#fff" opacity="0.6" />
              </g>
            ))}
            <defs>
              <radialGradient id="globeGrad" cx="40%" cy="35%">
                <stop offset="0%" stopColor="#1060ff" />
                <stop offset="100%" stopColor="#003087" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>
        {/* Floating particles */}
        {[
          { x:"15%", y:"20%", c:"rgba(0,200,255,0.5)", s:3 },
          { x:"80%", y:"15%", c:"rgba(0,220,120,0.4)", s:2.5 },
          { x:"10%", y:"75%", c:"rgba(0,180,255,0.3)", s:2 },
          { x:"85%", y:"70%", c:"rgba(0,220,120,0.35)", s:3 },
          { x:"30%", y:"85%", c:"rgba(0,180,255,0.25)", s:2 },
          { x:"70%", y:"30%", c:"rgba(0,200,255,0.3)", s:2.5 },
        ].map((p, i) => (
          <div key={i} className="absolute rounded-full float-anim" style={{
            width: `${p.s}px`, height: `${p.s}px`,
            background: p.c, left: p.x, top: p.y,
            animationDelay: `${i * 0.7}s`,
            boxShadow: `0 0 8px ${p.c}`,
          }} />
        ))}
      </div>

      {/* Right: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, #0a1228 0%, #0d1830 50%, #0a1228 100%)" }}>
        {/* Subtle grid dots on right side */}
        <div className="absolute inset-0 z-0 opacity-30" style={{
          backgroundImage: "radial-gradient(rgba(0,120,255,0.12) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }} />
        {/* Glow behind card */}
        <div className="absolute z-0" style={{
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,80,200,0.15) 0%, rgba(0,120,255,0.05) 50%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          filter: "blur(40px)",
        }} />
        <div className="relative z-10 w-full max-w-md px-8">
          {/* Card */}
          <div className="rounded-2xl px-8 pt-10 pb-8" style={{
            background: "rgba(10,18,38,0.75)",
            border: "1px solid rgba(0,100,220,0.2)",
            boxShadow: "0 0 60px rgba(0,60,180,0.12), 0 8px 40px rgba(0,0,0,0.6)",
            backdropFilter: "blur(24px)",
          }}>
            {/* ORT Logo */}
            <div className="mb-8">
              <img src={ORT_LOGO} alt="ORT" className="h-12 object-contain" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.7)", letterSpacing: "0.15em" }}>Usuario</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  placeholder="Usuario" autoComplete="username" required
                  className="w-full px-4 py-3.5 rounded-lg text-white text-sm outline-none transition-all placeholder:text-white/25"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onFocus={e => { e.target.style.border = "1px solid rgba(0,120,255,0.5)"; e.target.style.boxShadow = "0 0 20px rgba(0,100,220,0.15)"; }}
                  onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.12)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: "rgba(255,255,255,0.7)", letterSpacing: "0.15em" }}>Contraseña</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Contraseña" autoComplete="current-password" required
                    className="w-full px-4 py-3.5 rounded-lg text-white text-sm outline-none transition-all placeholder:text-white/25 pr-10"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                    onFocus={e => { e.target.style.border = "1px solid rgba(0,120,255,0.5)"; e.target.style.boxShadow = "0 0 20px rgba(0,100,220,0.15)"; }}
                    onBlur={e => { e.target.style.border = "1px solid rgba(255,255,255,0.12)"; e.target.style.boxShadow = "none"; }}
                  />
                  <button type="button" onClick={() => setShowPwd(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="rounded-lg px-4 py-3 text-sm"
                  style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={login.isPending}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: login.isPending
                    ? "rgba(30,80,220,0.4)"
                    : "linear-gradient(90deg, #1855d4 0%, #2070ff 50%, #1855d4 100%)",
                  color: "#fff",
                  boxShadow: login.isPending ? "none" : "0 4px 24px rgba(20,80,255,0.4)",
                }}>
                {login.isPending ? "Verificando..." : <>Ingresar <ChevronRight className="w-4 h-4" /></>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const adminMe = trpc.admin.me.useQuery();
  const logout = trpc.admin.logout.useMutation();
  const utils = trpc.useUtils();
  const responsesQuery = trpc.admin.getAllResponses.useQuery(undefined, { enabled: !!adminMe.data });

  const contactsQuery = trpc.admin.getContactInterests.useQuery(undefined, { enabled: !!adminMe.data });
  const [activeTab, setActiveTab] = useState<"overview" | "table" | "report" | "contacts">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInt1, setFilterInt1] = useState("");
  const [filterInt3, setFilterInt3] = useState("");
  const [filterInt4, setFilterInt4] = useState("");
  const [filterCompleted, setFilterCompleted] = useState<"all" | "completed" | "partial">("all");
  const [filterDateRange, setFilterDateRange] = useState<"all" | "today" | "week">("all");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [drillDown, setDrillDown] = useState<{ title: string; data: { name: string; value: number }[] } | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("u2040_admin_token");
    logout.mutate(undefined, { onSuccess: () => utils.admin.me.invalidate() });
  };

  const rows: ResponseRow[] = useMemo(() => {
    if (!responsesQuery.data) return [];
    return (responsesQuery.data as ResponseRow[]).map(r => ({
      ...r,
      country: r.country ?? null,
      countryCode: r.countryCode ?? null,
      interaction2: r.interaction2 ? (typeof r.interaction2 === "string" ? JSON.parse(r.interaction2) : r.interaction2) : null,
      interaction5: r.interaction5 ? (typeof r.interaction5 === "string" ? JSON.parse(r.interaction5) : r.interaction5) : null,
    }));
  }, [responsesQuery.data]);

  const filteredRows = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    return rows.filter(r => {
      if (searchTerm && !r.studentName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterInt1) {
        const val = r.interaction1;
        if (!val) return false;
        try {
          const arr: string[] = typeof val === "string" ? JSON.parse(val) : (val as unknown as string[]);
          if (!Array.isArray(arr) || !arr.includes(filterInt1)) return false;
        } catch {
          if (val !== filterInt1) return false;
        }
      }
      if (filterInt3 && r.interaction3 !== filterInt3) return false;
      if (filterInt4 && r.interaction4Opinion !== filterInt4) return false;
      if (filterCompleted === "completed" && !r.completedAt) return false;
      if (filterCompleted === "partial" && r.completedAt) return false;
      if (filterDateRange === "today") {
        const d = new Date(r.completedAt ?? r.createdAt);
        if (d < todayStart) return false;
      }
      if (filterDateRange === "week") {
        const d = new Date(r.completedAt ?? r.createdAt);
        if (d < weekStart) return false;
      }
      return true;
    });
  }, [rows, searchTerm, filterInt1, filterInt3, filterInt4, filterCompleted, filterDateRange]);

  const totalResponses = rows.length;
  const completedResponses = rows.filter(r => r.completedAt).length;
  const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;
  const withOpinion = rows.filter(r => r.interaction4Text?.trim()).length;

  const int1Data = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach(r => {
      // interaction1 is now an array of up to 2 selections
      const val = r.interaction1;
      if (!val) return;
      try {
        const arr: string[] = typeof val === "string" ? JSON.parse(val) : val as unknown as string[];
        if (Array.isArray(arr)) arr.forEach(v => { if (v) counts[v] = (counts[v] ?? 0) + 1; });
        else if (typeof val === "string") counts[val] = (counts[val] ?? 0) + 1;
      } catch { if (typeof val === "string") counts[val] = (counts[val] ?? 0) + 1; }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const int2Data = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach(r => { r.interaction2?.forEach(item => { counts[item] = (counts[item] ?? 0) + 1; }); });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const int3Data = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach(r => { if (r.interaction3) counts[r.interaction3] = (counts[r.interaction3] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const int4Data = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach(r => { if (r.interaction4Opinion) counts[r.interaction4Opinion] = (counts[r.interaction4Opinion] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rows]);

  const int5Data = useMemo(() => {
    const scores: Record<string, number> = {};
    rows.forEach(r => {
      r.interaction5?.forEach((item, idx) => {
        const score = (r.interaction5?.length ?? 8) - idx;
        scores[item] = (scores[item] ?? 0) + score;
      });
    });
    return Object.entries(scores).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rows]);

  const countryDistribution = useMemo(() => {
    const counts: Record<string, { label: string; count: number }> = {};
    rows.forEach(r => {
      const key = (r.countryCode ?? "UN").toUpperCase();
      const label = r.country ?? (key !== "UN" ? key : "No informado");
      if (!counts[key]) counts[key] = { label, count: 0 };
      counts[key].count += 1;
    });
    return Object.entries(counts)
      .map(([code, value]) => ({ code, ...value }))
      .sort((a, b) => b.count - a.count);
  }, [rows]);

  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const wsData = [
        ["Nombre", "Sesión", "Completado", "Fecha", "Int.1 (2 opciones)", "Int.2 (elementos elegidos)", "Int.3 (habilidad)", "Int.4 Opinión", "Int.4 Sugerencias", "Int.5 Ranking"],
        ...filteredRows.map(r => [
          r.studentName ?? "Anónimo",
          r.sessionId,
          r.completedAt ? "Sí" : "No",
          r.completedAt ? new Date(r.completedAt).toLocaleDateString("es-AR") : new Date(r.createdAt).toLocaleDateString("es-AR"),
          (() => { try { const v = r.interaction1; if (!v) return ""; const arr = typeof v === "string" ? JSON.parse(v) : v; return Array.isArray(arr) ? arr.join(" | ") : String(v); } catch { return String(r.interaction1 ?? ""); } })(),
          r.interaction2?.join(" | ") ?? "",
          r.interaction3 ?? "",
          r.interaction4Opinion ?? "",
          r.interaction4Text ?? "",
          r.interaction5?.join(" > ") ?? "",
        ]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      // Column widths
      ws["!cols"] = [20,30,12,14,35,45,30,15,50,50].map(w => ({ wch: w }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Respuestas");
      // Summary sheet
      const summaryData = [
        ["Resumen Universidad 2040"],
        [""],
        ["Total respuestas", totalResponses],
        ["Completadas", completedResponses],
        ["Tasa de completado", `${completionRate}%`],
        ["Con opinión abierta", withOpinion],
        [""],
        ["Top Int.1 (fuerza disruptiva)", int1Data[0]?.name ?? "-"],
        ["Top Int.3 (habilidad clave)", int3Data[0]?.name ?? "-"],
        ["Top Int.5 (prioridad)", int5Data[0]?.name ?? "-"],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary["!cols"] = [{ wch: 30 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");
      XLSX.writeFile(wb, `universidad2040_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success("✅ Excel exportado correctamente");
    } catch (e) {
      toast.error("Error al exportar Excel");
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredRows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `universidad2040_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("JSON exportado correctamente");
  };

  if (adminMe.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: DARK_BG }}>
        <div className="text-white/40 text-sm">Verificando sesión...</div>
      </div>
    );
  }

  if (!adminMe.data) return <LoginScreen />;

  const tabs = [
    { id: "overview" as const, label: "Infografía", icon: BarChart2 },
    { id: "table" as const, label: "Tabla + Filtros", icon: Table2 },
    { id: "report" as const, label: "Informe Ejecutivo", icon: Sparkles },
    { id: "contacts" as const, label: "Contactos Interesados", icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: DARK_BG }}>
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="grid-overlay" /><div className="noise-overlay" />

      {/* Header */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(7,11,20,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-4">
          <img src={ORT_LOGO} alt="ORT Argentina" className="h-9 object-contain" />
          <div className="hidden sm:block h-6 w-px" style={{ background: "rgba(255,255,255,0.1)" }} />
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Dashboard Administrative</p>
            <p className="text-white/35 text-xs">Universidad 2040 · Respuestas en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => responsesQuery.refetch()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", color: "#f87171" }}>
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>

      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users} label="Total respuestas" value={totalResponses} color="#003087" />
          <StatCard icon={CheckCircle2} label="Completadas" value={completedResponses} sub={`${completionRate}% tasa`} color="#00a651" />
          <StatCard icon={TrendingUp} label="En progreso" value={totalResponses - completedResponses} color="#4f8ef7" />
          <StatCard icon={MessageSquare} label="Con opinión" value={withOpinion} sub="respuestas abiertas" color="#f59e0b" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                background: activeTab === id ? "linear-gradient(135deg, rgba(0,48,135,0.5), rgba(0,166,81,0.2))" : "transparent",
                border: activeTab === id ? "1px solid rgba(0,166,81,0.25)" : "1px solid transparent",
                color: activeTab === id ? "#ffffff" : "rgba(255,255,255,0.4)",
              }}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB (Infografía) ─────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {responsesQuery.isLoading ? (
              <div className="text-center py-20 text-white/30">Cargando datos...</div>
            ) : rows.length === 0 ? (
              <div className="text-center py-20 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <Users className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-white/30">Aún no hay respuestas registradas</p>
              </div>
            ) : (
              <>
                {/* Row 1: 3 columns — Int1 donut, Int3 donut, World map */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Int 1 — Donut */}
                  <div className="rounded-2xl p-5 cursor-pointer hover:border-blue-500/30 transition-all"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onClick={() => setDrillDown({ title: "Interacción 1: Fuerza Disruptiva", data: int1Data })}>
                    <h4 className="text-white font-bold mb-0.5 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Interacción 1: Fuerza Disruptiva
                    </h4>
                    <p className="text-white/30 text-xs mb-3">¿Qué impactará más en las profesiones?</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={int1Data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {int1Data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {int1Data.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="truncate max-w-24">{d.name.length > 16 ? d.name.slice(0, 16) + "…" : d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Int 3 — Donut */}
                  <div className="rounded-2xl p-5 cursor-pointer hover:border-green-500/30 transition-all"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onClick={() => setDrillDown({ title: "Interacción 3: Habilidad Clave", data: int3Data })}>
                    <h4 className="text-white font-bold mb-0.5 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Interacción 3: Habilidad Clave
                    </h4>
                    <p className="text-white/30 text-xs mb-3">¿Cuál es la habilidad más importante?</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={int3Data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value"
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {int3Data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      {int3Data.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="truncate max-w-24">{d.name.length > 16 ? d.name.slice(0, 16) + "…" : d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* World Map — Origen de las Respuestas (real IP geolocation) */}
                  <div className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <h4 className="text-white font-bold mb-0.5 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Mapa Global: Origen de las Respuestas
                    </h4>
                    <p className="text-white/30 text-xs mb-3">Distribución geográfica por IP</p>
                    <div className="relative w-full" style={{ height: "180px" }}>
                      {/* SVG World Map — Equirectangular projection (lat: -90 to 90, lng: -180 to 180) */}
                      <svg viewBox="0 0 360 180" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                        {/* Ocean background */}
                        <rect width="360" height="180" fill="rgba(0,20,60,0.6)" rx="8" />
                        {/* Continents — simplified paths in equirectangular projection */}
                        {/* North America */}
                        <path d="M30,20 L75,18 L85,25 L90,35 L80,50 L70,55 L55,60 L45,55 L35,45 L28,35Z" fill="rgba(30,80,180,0.55)" />
                        {/* Central America */}
                        <path d="M55,60 L70,55 L72,65 L65,72 L58,68Z" fill="rgba(30,80,180,0.45)" />
                        {/* South America */}
                        <path d="M65,72 L80,68 L88,75 L90,90 L85,110 L75,125 L65,120 L58,105 L55,88 L60,78Z" fill="rgba(30,80,180,0.55)" />
                        {/* Europe */}
                        <path d="M155,20 L175,18 L180,25 L178,35 L168,38 L158,35 L152,28Z" fill="rgba(30,80,180,0.55)" />
                        {/* Africa */}
                        <path d="M158,38 L178,35 L185,45 L188,65 L182,90 L170,100 L158,95 L150,75 L152,55 L155,42Z" fill="rgba(30,80,180,0.55)" />
                        {/* Asia */}
                        <path d="M178,18 L260,15 L275,25 L280,40 L265,55 L240,58 L215,55 L195,50 L185,40 L180,28Z" fill="rgba(30,80,180,0.55)" />
                        {/* Southeast Asia */}
                        <path d="M240,58 L265,55 L270,68 L258,75 L245,70Z" fill="rgba(30,80,180,0.45)" />
                        {/* Australia */}
                        <path d="M255,95 L285,90 L295,100 L292,118 L278,125 L260,120 L252,108Z" fill="rgba(30,80,180,0.5)" />
                        {/* Grid lines */}
                        <line x1="0" y1="90" x2="360" y2="90" stroke="rgba(0,150,255,0.08)" strokeWidth="0.5" />
                        <line x1="180" y1="0" x2="180" y2="180" stroke="rgba(0,150,255,0.08)" strokeWidth="0.5" />
                      </svg>
                      {/* Response dots — real lat/lng coordinates (preferred) or country coords fallback */}
                      {rows.filter(r => r.lat && r.lng).map((row, i) => {
                        const lat = parseFloat(row.lat!);
                        const lng = parseFloat(row.lng!);
                        const x = ((lng + 180) / 360) * 100;
                        const y = ((90 - lat) / 180) * 100;
                        const colors = ["rgba(255,160,0,0.9)","rgba(0,220,120,0.9)","rgba(0,160,255,0.9)","rgba(255,80,120,0.9)","rgba(180,100,255,0.9)"];
                        const color = colors[i % colors.length];
                        return (
                          <div key={row.sessionId} className="absolute rounded-full" title={`${row.city || ""}, ${row.country || ""}`}
                            style={{
                              width: "9px", height: "9px",
                              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
                              boxShadow: `0 0 8px ${color}, 0 0 16px ${color.replace("0.9","0.3")}`,
                              left: `${x}%`, top: `${y}%`,
                              transform: "translate(-50%, -50%)",
                              cursor: "pointer",
                            }}
                          />
                        );
                      })}
                      {/* Fallback: show dots in Argentina area if no geo data */}
                      {rows.filter(r => !r.lat || !r.lng).slice(0, 8).map((_, i) => (
                        <div key={`fallback-${i}`} className="absolute rounded-full"
                          style={{
                            width: "7px", height: "7px",
                            background: "radial-gradient(circle, rgba(255,140,0,0.8) 0%, transparent 70%)",
                            boxShadow: "0 0 6px rgba(255,140,0,0.4)",
                            left: `${28 + (Math.sin(i * 2.3) * 3)}%`,
                            top: `${72 + (Math.cos(i * 1.7) * 5)}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        />
                      ))}
                    </div>
                    {/* Country breakdown */}
                    {rows.filter(r => r.country).length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
                        {Object.entries(
                          rows.filter(r => r.country).reduce((acc, r) => {
                            acc[r.country!] = (acc[r.country!] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([country, count]) => (
                          <div key={country} className="flex items-center gap-1.5 text-xs text-white/50">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
                            <span>{country} ({count})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: 2 columns — Int2 horizontal bars, Int5 radar */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Int 2 — Horizontal bar chart */}
                  <div className="rounded-2xl p-5 cursor-pointer hover:border-yellow-500/30 transition-all"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onClick={() => setDrillDown({ title: "Interacción 2: Diseño de Universidad", data: int2Data })}>
                    <h4 className="text-white font-bold mb-0.5 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Interacción 2: Diseño de Universidad
                    </h4>
                    <p className="text-white/30 text-xs mb-3">Elementos más elegidos (top 3 de 8)</p>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={int2Data.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                          tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + "…" : v} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {int2Data.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Int 5 — Radar */}
                  {int5Data.length > 0 && (
                    <div className="rounded-2xl p-5"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <h4 className="text-white font-bold mb-0.5 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Interacción 5: Prioridades Universitarias
                      </h4>
                      <p className="text-white/30 text-xs mb-3">Ranking ponderado de los 8 elementos</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={int5Data.map(d => ({ subject: d.name.length > 15 ? d.name.slice(0, 15) + "…" : d.name, value: d.value }))}>
                          <PolarGrid stroke="rgba(255,255,255,0.08)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9 }} />
                          <PolarRadiusAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8 }} />
                          <Radar name="Puntaje" dataKey="value" stroke="#003087" fill="#003087" fillOpacity={0.3} />
                          <Tooltip content={<CustomTooltip />} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Int 4 — Opinion (full width) */}
                <div className="rounded-2xl p-5 cursor-pointer hover:border-red-500/30 transition-all"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onClick={() => setDrillDown({ title: "Interacción 4: Modelo Actual", data: int4Data })}>
                  <h4 className="text-white font-bold mb-0.5 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
                    Interacción 4: Modelo Actual
                  </h4>
                  <p className="text-white/30 text-xs mb-3">¿Está preparado el modelo universitario?</p>
                  <div className="flex items-center gap-8">
                    <div className="flex-shrink-0" style={{ width: "180px" }}>
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={int4Data} cx="50%" cy="50%" innerRadius={40} outerRadius={68} dataKey="value"
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {int4Data.map((_, i) => <Cell key={i} fill={["#00a651","#f59e0b","#e11d48"][i % 3]} />)}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {int4Data.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: ["#00a651","#f59e0b","#e11d48"][i % 3] }} />
                          <span className="text-white/60">{d.name.split(",")[0]}</span>
                          <span className="font-bold text-white">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TABLE TAB ────────────────────────────────────────────── */}
        {activeTab === "table" && (
          <div className="space-y-4">
            {/* Top Filter Bar — chip-style quick filters */}
            <div className="space-y-3">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-widest">Top Filter Bar</p>
              <div className="flex flex-wrap items-center gap-2">
                {/* Status chips */}
                <button onClick={() => setFilterCompleted(filterCompleted === "completed" ? "all" : "completed")}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: filterCompleted === "completed" ? "rgba(0,166,81,0.2)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${filterCompleted === "completed" ? "rgba(0,166,81,0.5)" : "rgba(255,255,255,0.1)"}`,
                    color: filterCompleted === "completed" ? "#00a651" : "rgba(255,255,255,0.5)",
                  }}>
                  Completadas
                </button>
                <button onClick={() => setFilterCompleted(filterCompleted === "partial" ? "all" : "partial")}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: filterCompleted === "partial" ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${filterCompleted === "partial" ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.1)"}`,
                    color: filterCompleted === "partial" ? "#f59e0b" : "rgba(255,255,255,0.5)",
                  }}>
                  En progreso
                </button>
                {/* Date chips */}
                <button onClick={() => setFilterDateRange(filterDateRange === "today" ? "all" : "today")}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: filterDateRange === "today" ? "rgba(0,48,135,0.25)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${filterDateRange === "today" ? "rgba(0,48,135,0.5)" : "rgba(255,255,255,0.1)"}`,
                    color: filterDateRange === "today" ? "#4f8ef7" : "rgba(255,255,255,0.5)",
                  }}>
                  Hoy
                </button>
                <button onClick={() => setFilterDateRange(filterDateRange === "week" ? "all" : "week")}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: filterDateRange === "week" ? "rgba(0,48,135,0.25)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${filterDateRange === "week" ? "rgba(0,48,135,0.5)" : "rgba(255,255,255,0.1)"}`,
                    color: filterDateRange === "week" ? "#4f8ef7" : "rgba(255,255,255,0.5)",
                  }}>
                  Esta semana
                </button>
                {/* Interaction filter chips */}
                {filterInt1 && (
                  <span className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    style={{ background: "rgba(0,48,135,0.2)", border: "1px solid rgba(0,48,135,0.4)", color: "#a0b8ff" }}>
                    Int.1: [ {filterInt1} ]
                    <button onClick={() => setFilterInt1("")} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filterInt3 && (
                  <span className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    style={{ background: "rgba(0,166,81,0.15)", border: "1px solid rgba(0,166,81,0.4)", color: "#6ee7b7" }}>
                    Int.3: {filterInt3.length > 20 ? filterInt3.slice(0, 20) + "…" : filterInt3}
                    <button onClick={() => setFilterInt3("")} className="hover:text-white"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {/* More Filters dropdown */}
                <div className="relative">
                  <button onClick={() => setShowMoreFilters(v => !v)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                    <Search className="w-3 h-3" /> More Filters <ChevronRight className="w-3 h-3" style={{ transform: showMoreFilters ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                  </button>
                  {showMoreFilters && (
                    <div className="absolute top-full left-0 mt-2 w-72 rounded-xl p-4 z-20 space-y-3"
                      style={{ background: "rgba(10,16,30,0.97)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(20px)" }}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                          className="ort-input pl-9 text-sm py-2" />
                      </div>
                      <select value={filterInt1} onChange={e => setFilterInt1(e.target.value)} className="ort-input text-sm py-2">
                        <option value="">Int.1: Todos</option>
                        {["Inteligencia artificial","Cambio climático","Nuevas formas de trabajo","Globalización del conocimiento"].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <select value={filterInt3} onChange={e => setFilterInt3(e.target.value)} className="ort-input text-sm py-2">
                        <option value="">Int.3: Todos</option>
                        {["Resolver problemas complejos","Adaptarse a cambios rápidos","Trabajar con tecnología avanzada","Colaborar con personas diversas"].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <select value={filterInt4} onChange={e => setFilterInt4(e.target.value)} className="ort-input text-sm py-2">
                        <option value="">Int.4: Todos</option>
                        {["Sí, está bien encaminado","Parcialmente, necesita cambios","No, requiere una transformación profunda"].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      {(searchTerm || filterInt1 || filterInt3 || filterInt4 || filterCompleted !== "all" || filterDateRange !== "all") && (
                        <button onClick={() => { setSearchTerm(""); setFilterInt1(""); setFilterInt3(""); setFilterInt4(""); setFilterCompleted("all"); setFilterDateRange("all"); setShowMoreFilters(false); }}
                          className="w-full text-xs py-2 rounded-lg transition-colors"
                          style={{ background: "rgba(220,38,38,0.1)", color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}>
                          Limpiar todos los filtros
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {/* Export buttons — pushed to the right */}
                <div className="ml-auto flex gap-2">
                  <button onClick={exportExcel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(0,166,81,0.15)", border: "1px solid rgba(0,166,81,0.3)", color: "#00a651" }}>
                    Excel
                  </button>
                  <button onClick={exportJSON} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(0,48,135,0.15)", border: "1px solid rgba(0,48,135,0.3)", color: "#4f8ef7" }}>
                    JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Result count */}
            <p className="text-white/30 text-xs">{filteredRows.length} de {rows.length} respuestas</p>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(0,48,135,0.15)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {["Nombre","País","Estado","Fecha","Int.1","Int.2 (top)","Int.3","Int.4 Opinión","Sugerencia"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-white/40">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-12 text-center text-white/30">No hay respuestas con los filtros aplicados</td></tr>
                    ) : filteredRows.map((r, i) => (
                      <tr key={r.sessionId}
                        style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3 text-white font-semibold">{r.studentName ?? "Anónimo"}</td>
                        <td className="px-4 py-3 text-white/55 text-xs whitespace-nowrap">
                          {r.country ?? r.countryCode ?? "No informado"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                            style={r.completedAt
                              ? { background: "rgba(0,166,81,0.15)", color: "#00a651", border: "1px solid rgba(0,166,81,0.3)" }
                              : { background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>
                            {r.completedAt ? "Completada" : "En progreso"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                          {r.completedAt ? new Date(r.completedAt).toLocaleDateString("es-AR") : new Date(r.createdAt).toLocaleDateString("es-AR")}
                        </td>
                        <td className="px-4 py-3 text-white/60 text-xs max-w-32 truncate">{r.interaction1 ?? "—"}</td>
                        <td className="px-4 py-3 text-white/60 text-xs max-w-40 truncate">{r.interaction2?.slice(0,2).join(", ") ?? "—"}</td>
                        <td className="px-4 py-3 text-white/60 text-xs max-w-32 truncate">{r.interaction3 ?? "—"}</td>
                        <td className="px-4 py-3 text-white/60 text-xs max-w-32 truncate">{r.interaction4Opinion ?? "—"}</td>
                        <td className="px-4 py-3 text-white/50 text-xs max-w-40 truncate italic">{r.interaction4Text ? `"${r.interaction4Text}"` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── REPORT TAB ───────────────────────────────────────────── */}
        {activeTab === "report" && (
          <ReportSection
            rows={rows}
            int1Data={int1Data}
            int2Data={int2Data}
            int3Data={int3Data}
            int4Data={int4Data}
            int5Data={int5Data}
            totalResponses={totalResponses}
            completedResponses={completedResponses}
            completionRate={completionRate}
            withOpinion={withOpinion}
          />
        )}

        {/* ── CONTACTS TAB ─────────────────────────────────────────── */}
        {activeTab === "contacts" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white font-bold text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>Contactos Interesados</h2>
                <p className="text-white/40 text-sm mt-1">Alumnos que quieren sumarse al encuentro presencial</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl text-sm font-bold"
                  style={{ background: "rgba(0,166,81,0.15)", border: "1px solid rgba(0,166,81,0.3)", color: "#00a651" }}>
                  {contactsQuery.data?.length ?? 0} interesados
                </div>
                <button
                  onClick={() => {
                    const data = contactsQuery.data ?? [];
                    const header = "Nombre,Email,Teléfono,Mensaje,Fecha";
                    const csvRows = data.map(c =>
                      [c.studentName ?? "", c.email ?? "", c.phone ?? "", (c.message ?? "").replace(/,/g, ";"), new Date(c.createdAt).toLocaleString("es-AR")].join(",")
                    );
                    const csv = [header, ...csvRows].join("\n");
                    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `contactos_interesados_${new Date().toISOString().slice(0,10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                  style={{ background: "rgba(0,48,135,0.3)", border: "1px solid rgba(0,48,135,0.5)", color: "#4f8ef7" }}>
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </button>
              </div>
            </div>
            {contactsQuery.isLoading ? (
              <div className="text-white/40 text-center py-12">Cargando contactos...</div>
            ) : !contactsQuery.data?.length ? (
              <div className="text-center py-16">
                <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-white/40 font-semibold">Aún no hay contactos registrados</p>
                <p className="text-white/25 text-sm mt-1">Los alumnos que elijan "Sí, me interesa" aparecerán aquí</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      {["Nombre", "Email", "Teléfono", "Mensaje", "Fecha"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {contactsQuery.data.map((c, i) => (
                      <tr key={c.id} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3 text-white font-medium">{c.studentName ?? <span className="text-white/25 italic">Sin nombre</span>}</td>
                        <td className="px-4 py-3">
                          {c.email ? (
                            <a href={`mailto:${c.email}`} className="hover:underline" style={{ color: "#4f8ef7" }}>{c.email}</a>
                          ) : <span className="text-white/25 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-white/70">{c.phone ?? <span className="text-white/25 italic">—</span>}</td>
                        <td className="px-4 py-3 text-white/60 max-w-xs truncate">{c.message ?? <span className="text-white/25 italic">—</span>}</td>
                        <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{new Date(c.createdAt).toLocaleString("es-AR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Drill-down modal */}
      {drillDown && (
        <DrillDownModal title={drillDown.title} data={drillDown.data} rows={rows} onClose={() => setDrillDown(null)} />
      )}
    </div>
  );
}
