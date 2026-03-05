import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Download, Search, Users, CheckCircle2, Clock, BarChart3, LogOut, Lock,
  Eye, EyeOff, TrendingUp, MessageSquare, Award,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ─── ORT Brand ────────────────────────────────────────────────────────────────
const ORT_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_f0152d62.webp";

// ORT color palette for charts
const ORT_COLORS = ["#003087", "#00a651", "#1a4a8a", "#007a3d", "#2563eb", "#059669", "#1d4ed8", "#065f46"];

type ResponseRow = {
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
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function countBy(arr: (string | null)[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  arr.forEach(v => { if (v) map[v] = (map[v] ?? 0) + 1; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
}

function countMulti(arr: (string[] | null)[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  arr.forEach(items => { items?.forEach(v => { map[v] = (map[v] ?? 0) + 1; }); });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
}

function countRankingTop3(arr: (string[] | null)[]): { name: string; value: number }[] {
  const map: Record<string, number> = {};
  arr.forEach(items => { items?.slice(0, 3).forEach((v, i) => { map[v] = (map[v] ?? 0) + (3 - i); }); });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-sm font-medium shadow-lg" style={{ background: "#003087", border: "1px solid #00a651", color: "white" }}>
      <p>{payload[0].name}: <strong>{payload[0].value}</strong></p>
    </div>
  );
}

// ─── Infographic Section ──────────────────────────────────────────────────────
function InfographicSection({ responses }: { responses: ResponseRow[] }) {
  const completed = responses.filter(r => r.completedAt);
  const data1 = countBy(completed.map(r => r.interaction1));
  const data2 = countMulti(completed.map(r => r.interaction2));
  const data3 = countBy(completed.map(r => r.interaction3));
  const data4Opinion = countBy(completed.map(r => r.interaction4Opinion));
  const data5 = countRankingTop3(completed.map(r => r.interaction5));
  const suggestions = completed.filter(r => r.interaction4Text?.trim()).map(r => r.interaction4Text!);

  if (completed.length === 0) {
    return (
      <div className="ort-card rounded-2xl p-10 text-center mb-8">
        <TrendingUp className="w-12 h-12 mx-auto mb-3" style={{ color: "#003087", opacity: 0.3 }} />
        <p className="text-gray-400 text-base">Los gráficos aparecerán cuando haya respuestas completadas.</p>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5" style={{ color: "#003087" }} />
        <h2 className="text-xl font-bold" style={{ color: "#003087", fontFamily: "'Montserrat', sans-serif" }}>
          Infografía de respuestas
        </h2>
        <span className="text-gray-400 text-sm ml-1">({completed.length} completadas)</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Int 1 — Pie */}
        <div className="ort-card rounded-2xl p-5">
          <span className="ort-badge mb-2 inline-block">Interacción 1</span>
          <h3 className="font-bold mb-4 text-sm" style={{ color: "#1a202c" }}>¿Qué cambio impactará más en las profesiones?</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data1} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data1.map((_, i) => <Cell key={i} fill={ORT_COLORS[i % ORT_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: "#4a5568", fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Int 2 — Barras */}
        <div className="ort-card rounded-2xl p-5">
          <span className="ort-badge mb-2 inline-block">Interacción 2</span>
          <h3 className="font-bold mb-4 text-sm" style={{ color: "#1a202c" }}>Elementos elegidos para la universidad</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data2} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" tick={{ fill: "#a0aec0", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#4a5568", fontSize: 10 }} axisLine={false} tickLine={false} width={140} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {data2.map((_, i) => <Cell key={i} fill={ORT_COLORS[i % ORT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Int 3 — Pie */}
        <div className="ort-card rounded-2xl p-5">
          <span className="ort-badge mb-2 inline-block">Interacción 3</span>
          <h3 className="font-bold mb-4 text-sm" style={{ color: "#1a202c" }}>Habilidad más importante para el futuro</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data3} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {data3.map((_, i) => <Cell key={i} fill={ORT_COLORS[i % ORT_COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: "#4a5568", fontSize: 11 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Int 4 — Opinión + Sugerencias */}
        <div className="ort-card rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <span className="ort-badge mb-2 inline-block">Interacción 4 · Opinión</span>
            <h3 className="font-bold mb-3 text-sm" style={{ color: "#1a202c" }}>¿El modelo responde a los desafíos globales?</h3>
            <div className="flex gap-3">
              {data4Opinion.map((d, i) => (
                <div key={d.name} className="flex-1 rounded-xl p-3 text-center" style={{ background: `${ORT_COLORS[i]}18`, border: `1px solid ${ORT_COLORS[i]}55` }}>
                  <p className="text-2xl font-bold" style={{ color: ORT_COLORS[i] }}>{d.value}</p>
                  <p className="text-gray-500 text-xs mt-1">{d.name}</p>
                </div>
              ))}
            </div>
          </div>
          {suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare className="w-3.5 h-3.5" style={{ color: "#003087" }} />
                <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#003087" }}>Sugerencias ({suggestions.length})</p>
              </div>
              <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                {suggestions.map((s, i) => (
                  <div key={i} className="rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: "#f5f7fa", border: "1px solid #e8ecf0", color: "#4a5568" }}>
                    "{s}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Int 5 — Ranking */}
        <div className="ort-card rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4 h-4" style={{ color: "#00a651" }} />
            <span className="ort-badge">Interacción 5</span>
          </div>
          <h3 className="font-bold mb-4 text-sm" style={{ color: "#1a202c" }}>Ranking ponderado de prioridades (puntos por posición)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data5} margin={{ left: 0, right: 20 }}>
              <XAxis dataKey="name" tick={{ fill: "#4a5568", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#a0aec0", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data5.map((_, i) => <Cell key={i} fill={ORT_COLORS[i % ORT_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, bg, color }: { icon: React.ElementType; label: string; value: number | string; bg: string; color: string }) {
  return (
    <div className="ort-card rounded-xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold" style={{ color: "#003087" }}>{value}</p>
      </div>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportToCSV(data: ResponseRow[]) {
  const headers = ["Sesión", "Nombre", "Completada", "Fecha", "Int.1 - Impacto", "Int.2 - Universidad", "Int.3 - Habilidad", "Int.4 - Opinión", "Int.4 - Sugerencia", "Int.5 - Ranking"];
  const rows = data.map(r => [
    r.sessionId, r.studentName ?? "Anónimo", r.completedAt ? "Sí" : "No",
    new Date(r.createdAt).toLocaleString("es-AR"), r.interaction1 ?? "",
    r.interaction2?.join(" | ") ?? "", r.interaction3 ?? "",
    r.interaction4Opinion ?? "", r.interaction4Text ?? "",
    r.interaction5?.join(" > ") ?? "",
  ]);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `universidad2040_respuestas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const login = trpc.admin.login.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login.mutateAsync({ username, password });
      onLogin();
    } catch {
      setError("Usuario o contraseña incorrectos.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#003087" }}>
      {/* Top bar */}
      <div style={{ background: "#001f5c", borderBottom: "3px solid #00a651" }} className="px-6 py-3">
        <img src={ORT_LOGO} alt="ORT Argentina" className="h-10 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(0,31,92,0.95) 0%, rgba(0,48,135,0.9) 100%)" }} />

        <div className="relative z-10 w-full max-w-sm">
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "rgba(255,255,255,0.97)" }}>
            {/* Card header */}
            <div style={{ background: "#003087", padding: "28px 32px 24px" }} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: "rgba(0,166,81,0.2)", border: "2px solid #00a651" }}>
                <Lock className="w-7 h-7" style={{ color: "#00a651" }} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>Dashboard Admin</h1>
              <p className="text-white/70 text-sm">Universidad 2040 · Panel de respuestas</p>
            </div>

            {/* Card body */}
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Usuario</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username"
                    className="ort-input" placeholder="admin" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Contraseña</label>
                  <div className="relative">
                    <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      required autoComplete="current-password" className="ort-input" style={{ paddingRight: "3rem" }} placeholder="••••••••••" />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: "#a0aec0" }}>
                      {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#fff0f0", border: "1px solid #fca5a5", color: "#dc2626" }}>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={login.isPending} className="ort-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontSize: "1rem", padding: "14px 28px" }}>
                  {login.isPending ? "Ingresando..." : "Ingresar al dashboard →"}
                </button>
              </form>
            </div>
          </div>
          <p className="text-center text-white/40 text-xs mt-5">© ORT Argentina · Educando para la vida</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCompleted, setFilterCompleted] = useState<"all" | "completed" | "pending">("all");
  const [activeTab, setActiveTab] = useState<"infografia" | "tabla">("infografia");

  const adminMe = trpc.admin.me.useQuery(undefined, { retry: false });
  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => { setIsLoggedIn(false); adminMe.refetch(); },
  });

  const isAdmin = isLoggedIn || adminMe.data?.role === "admin";

  const { data: responses, isLoading, error, refetch } = trpc.admin.getAllResponses.useQuery(undefined, {
    enabled: isAdmin,
    retry: false,
  });

  const handleLogin = () => { setIsLoggedIn(true); refetch(); adminMe.refetch(); };

  const filtered = useMemo(() => {
    if (!responses) return [];
    return (responses as ResponseRow[]).filter(r => {
      const matchSearch = !search ||
        (r.studentName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        r.sessionId.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filterCompleted === "all" ||
        (filterCompleted === "completed" && r.completedAt) ||
        (filterCompleted === "pending" && !r.completedAt);
      return matchSearch && matchFilter;
    });
  }, [responses, search, filterCompleted]);

  const stats = useMemo(() => {
    if (!responses) return { total: 0, completed: 0, pending: 0 };
    const r = responses as ResponseRow[];
    return { total: r.length, completed: r.filter(x => x.completedAt).length, pending: r.filter(x => !x.completedAt).length };
  }, [responses]);

  if (adminMe.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f5f7fa" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#003087", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!isAdmin) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen" style={{ background: "#f5f7fa" }}>
      {/* ORT Header */}
      <header style={{ background: "#003087", borderBottom: "3px solid #00a651" }} className="px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <img src={ORT_LOGO} alt="ORT Argentina" className="h-9 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
          <div className="hidden sm:block" style={{ borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: "16px" }}>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>Panel de Respuestas</span>
            </div>
            <p className="text-white/50 text-xs">Universidad 2040</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm hidden sm:block">admin</span>
          <button onClick={() => logout.mutate()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Users} label="Total de sesiones" value={stats.total} bg="rgba(0,48,135,0.1)" color="#003087" />
          <StatCard icon={CheckCircle2} label="Completadas" value={stats.completed} bg="rgba(0,166,81,0.1)" color="#00a651" />
          <StatCard icon={Clock} label="En progreso" value={stats.pending} bg="rgba(245,158,11,0.1)" color="#d97706" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["infografia", "tabla"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab ? "#003087" : "#ffffff",
                color: activeTab === tab ? "#ffffff" : "#4a5568",
                border: activeTab === tab ? "2px solid #003087" : "2px solid #e8ecf0",
                boxShadow: activeTab === tab ? "0 2px 8px rgba(0,48,135,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
              }}>
              {tab === "infografia" ? "📊 Infografía" : "📋 Tabla de respuestas"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#003087", borderTopColor: "transparent" }} />
          </div>
        ) : error ? (
          <div className="ort-card rounded-xl p-8 text-center" style={{ color: "#dc2626" }}>
            Error al cargar las respuestas. Intentá recargar la página.
          </div>
        ) : (
          <>
            {activeTab === "infografia" && <InfographicSection responses={responses as ResponseRow[] ?? []} />}

            {activeTab === "tabla" && (
              <>
                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#a0aec0" }} />
                    <input type="text" placeholder="Buscar por nombre o ID de sesión..."
                      value={search} onChange={e => setSearch(e.target.value)}
                      className="ort-input" style={{ paddingLeft: "2.5rem" }} />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(["all", "completed", "pending"] as const).map(f => (
                      <button key={f} onClick={() => setFilterCompleted(f)}
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                          background: filterCompleted === f ? "#003087" : "#ffffff",
                          color: filterCompleted === f ? "#ffffff" : "#4a5568",
                          border: filterCompleted === f ? "2px solid #003087" : "2px solid #e8ecf0",
                        }}>
                        {f === "all" ? "Todas" : f === "completed" ? "Completadas" : "En progreso"}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => filtered.length > 0 && exportToCSV(filtered)} disabled={filtered.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    style={{ background: "#00a651", color: "#ffffff", border: "none" }}>
                    <Download className="w-4 h-4" />
                    <span>Exportar CSV</span>
                  </button>
                </div>

                {filtered.length === 0 ? (
                  <div className="ort-card rounded-xl p-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "#003087", opacity: 0.2 }} />
                    <p className="text-gray-400 text-base">No hay respuestas todavía.</p>
                    <p className="text-gray-300 text-sm mt-1">Las respuestas aparecerán aquí cuando los alumnos completen la cápsula.</p>
                  </div>
                ) : (
                  <div className="ort-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr style={{ background: "#003087", borderBottom: "2px solid #00a651" }}>
                            {["Alumno", "Estado", "Fecha", "Int. 1 · Impacto", "Int. 2 · Universidad", "Int. 3 · Habilidad", "Int. 4 · Opinión", "Int. 4 · Sugerencia", "Int. 5 · Ranking (Top 3)"].map(h => (
                              <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-white">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((r, i) => (
                            <tr key={r.sessionId}
                              className="border-b transition-colors"
                              style={{ borderColor: "#e8ecf0", background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#f0f4ff")}
                              onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "#ffffff" : "#f8fafc")}>
                              <td className="px-4 py-3">
                                <div className="font-semibold" style={{ color: "#1a202c" }}>{r.studentName ?? "Anónimo"}</div>
                                <div className="text-xs font-mono" style={{ color: "#a0aec0" }}>{r.sessionId.slice(0, 8)}…</div>
                              </td>
                              <td className="px-4 py-3">
                                {r.completedAt ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(0,166,81,0.1)", color: "#00a651" }}>
                                    <CheckCircle2 className="w-3 h-3" /> Completa
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(245,158,11,0.1)", color: "#d97706" }}>
                                    <Clock className="w-3 h-3" /> En progreso
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "#4a5568" }}>
                                {new Date(r.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="px-4 py-3" style={{ color: "#1a202c" }}>{r.interaction1 ?? <span style={{ color: "#cbd5e0" }}>—</span>}</td>
                              <td className="px-4 py-3">
                                {r.interaction2 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {r.interaction2.map(x => (
                                      <span key={x} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(0,48,135,0.1)", color: "#003087" }}>{x}</span>
                                    ))}
                                  </div>
                                ) : <span style={{ color: "#cbd5e0" }}>—</span>}
                              </td>
                              <td className="px-4 py-3" style={{ color: "#1a202c" }}>{r.interaction3 ?? <span style={{ color: "#cbd5e0" }}>—</span>}</td>
                              <td className="px-4 py-3">
                                {r.interaction4Opinion ? (
                                  <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{
                                    background: r.interaction4Opinion === "Sí" ? "rgba(0,166,81,0.1)" : r.interaction4Opinion === "No" ? "rgba(220,38,38,0.1)" : "rgba(245,158,11,0.1)",
                                    color: r.interaction4Opinion === "Sí" ? "#00a651" : r.interaction4Opinion === "No" ? "#dc2626" : "#d97706",
                                  }}>{r.interaction4Opinion}</span>
                                ) : <span style={{ color: "#cbd5e0" }}>—</span>}
                              </td>
                              <td className="px-4 py-3 max-w-[200px]" style={{ color: "#4a5568" }}>
                                <div className="truncate" title={r.interaction4Text ?? ""}>{r.interaction4Text || <span style={{ color: "#cbd5e0" }}>—</span>}</div>
                              </td>
                              <td className="px-4 py-3">
                                {r.interaction5 ? (
                                  <ol className="text-xs space-y-0.5" style={{ color: "#1a202c" }}>
                                    {r.interaction5.slice(0, 3).map((x, idx) => (
                                      <li key={x}><span className="font-bold" style={{ color: "#003087" }}>{idx + 1}.</span> {x}</li>
                                    ))}
                                  </ol>
                                ) : <span style={{ color: "#cbd5e0" }}>—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid #e8ecf0", color: "#a0aec0" }}>
                      <span>Mostrando {filtered.length} de {stats.total} sesiones</span>
                      <span>Última actualización: {new Date().toLocaleTimeString("es-AR")}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Footer ORT */}
      <footer style={{ background: "#003087", borderTop: "3px solid #00a651" }} className="px-6 py-4 mt-8 text-center">
        <img src={ORT_LOGO} alt="ORT Argentina" className="h-8 object-contain mx-auto mb-1" style={{ filter: "brightness(0) invert(1)", opacity: 0.7 }} />
        <p className="text-white/40 text-xs">© ORT Argentina · Educando para la vida</p>
      </footer>
    </div>
  );
}
