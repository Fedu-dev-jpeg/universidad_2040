import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Download, Search, Users, CheckCircle2, Clock, BarChart3, LogOut, Lock, Eye, EyeOff } from "lucide-react";

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

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-white/60 text-sm">{label}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportToCSV(data: ResponseRow[]) {
  const headers = [
    "Sesión", "Nombre", "Completada", "Fecha",
    "Int.1 - Impacto", "Int.2 - Universidad", "Int.3 - Habilidad",
    "Int.4 - Opinión", "Int.4 - Sugerencia", "Int.5 - Ranking"
  ];
  const rows = data.map(r => [
    r.sessionId,
    r.studentName ?? "Anónimo",
    r.completedAt ? "Sí" : "No",
    new Date(r.createdAt).toLocaleString("es-AR"),
    r.interaction1 ?? "",
    r.interaction2?.join(" | ") ?? "",
    r.interaction3 ?? "",
    r.interaction4Opinion ?? "",
    r.interaction4Text ?? "",
    r.interaction5?.join(" > ") ?? "",
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 border border-primary/40 mb-5">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Dashboard Admin
          </h1>
          <p className="text-white/50 text-sm mb-6">Universidad 2040 · Panel de respuestas</p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-white/70 text-sm block mb-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-all"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-white/70 text-sm block mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-primary/60 transition-all"
                  placeholder="••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full py-3 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all"
            >
              {login.isPending ? "Ingresando..." : "Ingresar al dashboard"}
            </Button>
          </form>
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

  const adminMe = trpc.admin.me.useQuery(undefined, { retry: false });
  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => {
      setIsLoggedIn(false);
      adminMe.refetch();
    },
  });

  const isAdmin = isLoggedIn || adminMe.data?.role === "admin";

  const { data: responses, isLoading, error, refetch } = trpc.admin.getAllResponses.useQuery(undefined, {
    enabled: isAdmin,
    retry: false,
  });

  const handleLogin = () => {
    setIsLoggedIn(true);
    refetch();
    adminMe.refetch();
  };

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
    return {
      total: r.length,
      completed: r.filter(x => x.completedAt).length,
      pending: r.filter(x => !x.completedAt).length,
    };
  }, [responses]);

  // Show login if not authenticated
  if (adminMe.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              Universidad 2040
            </h1>
            <p className="text-white/40 text-xs">Panel de respuestas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/50 text-sm hidden sm:block">admin</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout.mutate()}
            className="gap-2 border-white/20 text-white/70 hover:text-white bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Users} label="Total de sesiones" value={stats.total} color="bg-primary/30" />
          <StatCard icon={CheckCircle2} label="Completadas" value={stats.completed} color="bg-green-500/30" />
          <StatCard icon={Clock} label="En progreso" value={stats.pending} color="bg-yellow-500/30" />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID de sesión..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-primary/60 transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "completed", "pending"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterCompleted(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterCompleted === f ? "bg-primary text-white" : "glass-card text-white/60 hover:text-white"}`}
              >
                {f === "all" ? "Todas" : f === "completed" ? "Completadas" : "En progreso"}
              </button>
            ))}
          </div>
          <Button
            onClick={() => filtered.length > 0 && exportToCSV(filtered)}
            disabled={filtered.length === 0}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="glass-card rounded-xl p-8 text-center text-red-400">
            Error al cargar las respuestas. Intentá recargar la página.
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-base">No hay respuestas todavía.</p>
            <p className="text-white/30 text-sm mt-1">Las respuestas aparecerán aquí cuando los alumnos completen la cápsula.</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/60 text-xs uppercase tracking-wider bg-white/5">
                    <th className="text-left px-4 py-3 font-semibold">Alumno</th>
                    <th className="text-left px-4 py-3 font-semibold">Estado</th>
                    <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold">Int. 1 · Impacto</th>
                    <th className="text-left px-4 py-3 font-semibold">Int. 2 · Universidad</th>
                    <th className="text-left px-4 py-3 font-semibold">Int. 3 · Habilidad</th>
                    <th className="text-left px-4 py-3 font-semibold">Int. 4 · Opinión</th>
                    <th className="text-left px-4 py-3 font-semibold">Int. 4 · Sugerencia</th>
                    <th className="text-left px-4 py-3 font-semibold">Int. 5 · Ranking (Top 3)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => (
                    <tr
                      key={r.sessionId}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{r.studentName ?? "Anónimo"}</div>
                        <div className="text-white/30 text-xs font-mono">{r.sessionId.slice(0, 8)}…</div>
                      </td>
                      <td className="px-4 py-3">
                        {r.completedAt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Completa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                            <Clock className="w-3 h-3" /> En progreso
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/70 text-xs whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString("es-AR", {
                          day: "2-digit", month: "2-digit", year: "2-digit",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </td>
                      <td className="px-4 py-3 text-white/80">{r.interaction1 ?? <span className="text-white/25">—</span>}</td>
                      <td className="px-4 py-3">
                        {r.interaction2 ? (
                          <div className="flex flex-wrap gap-1">
                            {r.interaction2.map(x => (
                              <span key={x} className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">{x}</span>
                            ))}
                          </div>
                        ) : <span className="text-white/25">—</span>}
                      </td>
                      <td className="px-4 py-3 text-white/80">{r.interaction3 ?? <span className="text-white/25">—</span>}</td>
                      <td className="px-4 py-3">
                        {r.interaction4Opinion ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            r.interaction4Opinion === "Sí" ? "bg-green-500/20 text-green-400" :
                            r.interaction4Opinion === "No" ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {r.interaction4Opinion}
                          </span>
                        ) : <span className="text-white/25">—</span>}
                      </td>
                      <td className="px-4 py-3 text-white/70 max-w-[200px]">
                        <div className="truncate" title={r.interaction4Text ?? ""}>
                          {r.interaction4Text || <span className="text-white/25">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {r.interaction5 ? (
                          <ol className="text-white/80 text-xs space-y-0.5">
                            {r.interaction5.slice(0, 3).map((x, idx) => (
                              <li key={x}><span className="text-primary font-bold">{idx + 1}.</span> {x}</li>
                            ))}
                          </ol>
                        ) : <span className="text-white/25">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-white/10 text-white/50 text-xs flex items-center justify-between">
              <span>Mostrando {filtered.length} de {stats.total} sesiones</span>
              <span className="text-white/30">Última actualización: {new Date().toLocaleTimeString("es-AR")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
