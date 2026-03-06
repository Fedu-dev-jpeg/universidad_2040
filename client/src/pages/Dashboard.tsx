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
const ORT_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_nobg_40c8928c.png";
const COLORS = ["#003087","#00a651","#4f8ef7","#f59e0b","#e11d48","#8b5cf6","#06b6d4","#f97316"];
const DARK_BG = "#070b14";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ResponseRow {
  sessionId: string;
  studentName: string | null;
  completedAt: Date | null;
  createdAt: Date;
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
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</p>
        {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
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

  const handleGenerateReport = () => {
    generateReport.mutate(undefined, {
      onSuccess: (data) => {
        setReportContent(typeof data.report === "string" ? data.report : String(data.report));
        setReportDate(data.generatedAt);
        toast.success("Informe ejecutivo generado con IA");
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleExportPDF = useCallback(async () => {
    if (!reportRef.current) return;
    setIsExportingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0d1424",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`informe_universidad2040_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF descargado correctamente");
    } catch (e) {
      toast.error("Error al generar el PDF");
    } finally {
      setIsExportingPdf(false);
    }
  }, []);

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
      onSuccess: () => utils.admin.me.invalidate(),
      onError: (err) => setError(err.message),
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: DARK_BG }}>
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="grid-overlay" /><div className="noise-overlay" />
      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="rounded-3xl p-8 space-y-6"
          style={{ background: "rgba(13,20,36,0.9)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
          <div className="text-center">
            <img src={ORT_LOGO} alt="ORT Argentina" className="h-12 object-contain mx-auto mb-6" />
            <h1 className="text-white text-2xl font-black mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Dashboard Admin</h1>
            <p className="text-white/35 text-sm">Universidad 2040 · Acceso restringido</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-semibold uppercase tracking-widest">Usuario</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin" className="ort-input" autoComplete="username" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-semibold uppercase tracking-widest">Contraseña</label>
              <div className="relative">
                <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••" className="ort-input pr-10" autoComplete="current-password" required />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm"
                style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={login.isPending} className="ort-btn-primary w-full disabled:opacity-50">
              {login.isPending ? "Ingresando..." : "Ingresar al dashboard →"}
            </button>
          </form>
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

  const [activeTab, setActiveTab] = useState<"overview" | "table" | "report">("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterInt1, setFilterInt1] = useState("");
  const [filterInt3, setFilterInt3] = useState("");
  const [filterInt4, setFilterInt4] = useState("");
  const [filterCompleted, setFilterCompleted] = useState<"all" | "completed" | "partial">("all");
  const [drillDown, setDrillDown] = useState<{ title: string; data: { name: string; value: number }[] } | null>(null);

  const handleLogout = () => {
    logout.mutate(undefined, { onSuccess: () => utils.admin.me.invalidate() });
  };

  const rows: ResponseRow[] = useMemo(() => {
    if (!responsesQuery.data) return [];
    return (responsesQuery.data as ResponseRow[]).map(r => ({
      ...r,
      interaction2: r.interaction2 ? (typeof r.interaction2 === "string" ? JSON.parse(r.interaction2) : r.interaction2) : null,
      interaction5: r.interaction5 ? (typeof r.interaction5 === "string" ? JSON.parse(r.interaction5) : r.interaction5) : null,
    }));
  }, [responsesQuery.data]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (searchTerm && !r.studentName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (filterInt1 && r.interaction1 !== filterInt1) return false;
      if (filterInt3 && r.interaction3 !== filterInt3) return false;
      if (filterInt4 && r.interaction4Opinion !== filterInt4) return false;
      if (filterCompleted === "completed" && !r.completedAt) return false;
      if (filterCompleted === "partial" && r.completedAt) return false;
      return true;
    });
  }, [rows, searchTerm, filterInt1, filterInt3, filterInt4, filterCompleted]);

  const totalResponses = rows.length;
  const completedResponses = rows.filter(r => r.completedAt).length;
  const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;
  const withOpinion = rows.filter(r => r.interaction4Text?.trim()).length;

  const int1Data = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach(r => { if (r.interaction1) counts[r.interaction1] = (counts[r.interaction1] ?? 0) + 1; });
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

  const exportCSV = () => {
    const headers = ["Nombre","Sesión","Completado","Fecha","Int.1","Int.2","Int.3","Int.4 Opinión","Int.4 Texto","Int.5 Ranking"];
    const csvRows = filteredRows.map(r => [
      r.studentName ?? "Anónimo", r.sessionId,
      r.completedAt ? "Sí" : "No",
      r.completedAt ? new Date(r.completedAt).toLocaleDateString("es-AR") : new Date(r.createdAt).toLocaleDateString("es-AR"),
      r.interaction1 ?? "", r.interaction2?.join(" | ") ?? "",
      r.interaction3 ?? "", r.interaction4Opinion ?? "",
      r.interaction4Text ?? "", r.interaction5?.join(" > ") ?? "",
    ]);
    const csv = [headers, ...csvRows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `universidad2040_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exportado correctamente");
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
            <p className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Dashboard Administrativo</p>
            <p className="text-white/35 text-xs">Universidad 2040 · Respuestas en tiempo real</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => responsesQuery.refetch()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
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

        {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Int 1 */}
                  <div className="rounded-2xl p-6 cursor-pointer hover:border-blue-500/30 transition-all"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onClick={() => setDrillDown({ title: "Interacción 1: Fuerza Disruptiva", data: int1Data })}>
                    <h4 className="text-white font-bold mb-1 text-sm flex items-center justify-between" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Interacción 1: Fuerza Disruptiva
                      <span className="text-white/20 text-xs font-normal">Clic para detalle →</span>
                    </h4>
                    <p className="text-white/30 text-xs mb-4">¿Qué impactará más en las profesiones?</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={int1Data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {int1Data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {int1Data.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="truncate max-w-28">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Int 3 */}
                  <div className="rounded-2xl p-6 cursor-pointer hover:border-green-500/30 transition-all"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onClick={() => setDrillDown({ title: "Interacción 3: Habilidad Clave", data: int3Data })}>
                    <h4 className="text-white font-bold mb-1 text-sm flex items-center justify-between" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Interacción 3: Habilidad Clave
                      <span className="text-white/20 text-xs font-normal">Clic para detalle →</span>
                    </h4>
                    <p className="text-white/30 text-xs mb-4">¿Cuál es la habilidad más importante?</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={int3Data} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {int3Data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {int3Data.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-xs text-white/50">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="truncate max-w-28">{d.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Int 2 */}
                  <div className="rounded-2xl p-6 cursor-pointer hover:border-yellow-500/30 transition-all"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onClick={() => setDrillDown({ title: "Interacción 2: Diseño de Universidad", data: int2Data })}>
                    <h4 className="text-white font-bold mb-1 text-sm flex items-center justify-between" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Interacción 2: Diseño de Universidad
                      <span className="text-white/20 text-xs font-normal">Clic para detalle →</span>
                    </h4>
                    <p className="text-white/30 text-xs mb-4">Elementos más elegidos (top 3 de 8)</p>
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

                  {/* Int 4 */}
                  <div className="rounded-2xl p-6 cursor-pointer hover:border-red-500/30 transition-all"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onClick={() => setDrillDown({ title: "Interacción 4: Modelo Actual", data: int4Data })}>
                    <h4 className="text-white font-bold mb-1 text-sm flex items-center justify-between" style={{ fontFamily: "'Syne', sans-serif" }}>
                      Interacción 4: Modelo Actual
                      <span className="text-white/20 text-xs font-normal">Clic para detalle →</span>
                    </h4>
                    <p className="text-white/30 text-xs mb-4">¿Está preparado el modelo universitario?</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={int4Data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {int4Data.map((_, i) => <Cell key={i} fill={["#00a651","#f59e0b","#e11d48"][i % 3]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
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

                {/* Int 5 Radar */}
                {int5Data.length > 0 && (
                  <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <h4 className="text-white font-bold mb-1 text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Interacción 5: Prioridades Universitarias</h4>
                    <p className="text-white/30 text-xs mb-4">Ranking ponderado de los 8 elementos</p>
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
              </>
            )}
          </div>
        )}

        {/* ── TABLE TAB ────────────────────────────────────────────── */}
        {activeTab === "table" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="rounded-2xl p-5 space-y-4"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-white/30" />
                <span className="text-white/50 text-sm font-semibold">Filtros</span>
                {(searchTerm || filterInt1 || filterInt3 || filterInt4 || filterCompleted !== "all") && (
                  <button onClick={() => { setSearchTerm(""); setFilterInt1(""); setFilterInt3(""); setFilterInt4(""); setFilterCompleted("all"); }}
                    className="ml-auto text-xs px-2 py-1 rounded-lg transition-colors"
                    style={{ background: "rgba(220,38,38,0.1)", color: "#f87171", border: "1px solid rgba(220,38,38,0.2)" }}>
                    Limpiar filtros
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input type="text" placeholder="Buscar por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="ort-input pl-9 text-sm py-2.5" />
                </div>
                <select value={filterInt1} onChange={e => setFilterInt1(e.target.value)} className="ort-input text-sm py-2.5">
                  <option value="">Int.1: Todos</option>
                  {["Inteligencia artificial","Cambio climático","Nuevas formas de trabajo","Globalización del conocimiento"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={filterInt3} onChange={e => setFilterInt3(e.target.value)} className="ort-input text-sm py-2.5">
                  <option value="">Int.3: Todos</option>
                  {["Resolver problemas complejos","Adaptarse a cambios rápidos","Trabajar con tecnología avanzada","Colaborar con personas diversas"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={filterInt4} onChange={e => setFilterInt4(e.target.value)} className="ort-input text-sm py-2.5">
                  <option value="">Int.4: Todos</option>
                  {["Sí, está bien encaminado","Parcialmente, necesita cambios","No, requiere una transformación profunda"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <select value={filterCompleted} onChange={e => setFilterCompleted(e.target.value as "all" | "completed" | "partial")} className="ort-input text-sm py-2.5">
                  <option value="all">Estado: Todos</option>
                  <option value="completed">Completadas</option>
                  <option value="partial">En progreso</option>
                </select>
              </div>
            </div>

            {/* Export buttons */}
            <div className="flex items-center justify-between">
              <p className="text-white/40 text-sm">{filteredRows.length} de {rows.length} respuestas</p>
              <div className="flex gap-2">
                <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: "rgba(0,166,81,0.15)", border: "1px solid rgba(0,166,81,0.3)", color: "#00a651" }}>
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={exportJSON} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: "rgba(0,48,135,0.15)", border: "1px solid rgba(0,48,135,0.3)", color: "#4f8ef7" }}>
                  <Download className="w-3.5 h-3.5" /> JSON
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(0,48,135,0.2)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {["Nombre","Estado","Fecha","Int.1","Int.2 (top)","Int.3","Int.4 Opinión","Sugerencia"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-white/50">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-12 text-center text-white/30">No hay respuestas con los filtros aplicados</td></tr>
                    ) : filteredRows.map((r, i) => (
                      <tr key={r.sessionId}
                        style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3 text-white font-semibold">{r.studentName ?? "Anónimo"}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full font-semibold"
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
      </div>

      {/* Drill-down modal */}
      {drillDown && (
        <DrillDownModal title={drillDown.title} data={drillDown.data} rows={rows} onClose={() => setDrillDown(null)} />
      )}
    </div>
  );
}
