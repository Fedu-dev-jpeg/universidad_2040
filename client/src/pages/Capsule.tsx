import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronRight, GripVertical, CheckCircle2, Volume2, VolumeX, Pause, Play } from "lucide-react";

// ─── ORT Brand ────────────────────────────────────────────────────────────────
const ORT_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_f0152d62.webp";

const SCENE_IMAGES = {
  scene1: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene1_ai-RmBvavYKyWJ3KKvaesV2ih.webp",
  scene2: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene2_climate-4mTTLLwMkFbExdWohyKrot.webp",
  scene3: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene3_robots-CrDC32VGuCoSH94E4PjgvJ.webp",
  scene4: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene4_university-R3xoCy8EKTMJuTqT97d9md.webp",
  scene5: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene5_global-Myk7EcWD3r8C7QVs3ZbuGn.webp",
};

const TOTAL_STEPS = 12;

interface Answers {
  interaction1: string;
  interaction2: string[];
  interaction3: string;
  interaction4Opinion: string;
  interaction4Text: string;
  interaction5: string[];
}

// ─── TTS Hook ─────────────────────────────────────────────────────────────────
function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    utteranceRef.current = null;
  }, [supported]);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "es-AR";
    utter.rate = 0.88;
    utter.pitch = 1.05;
    utter.volume = 1.0;

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const esAR = voices.find(v => v.lang === "es-AR");
      const esES = voices.find(v => v.lang === "es-ES");
      const esAny = voices.find(v => v.lang.startsWith("es"));
      const chosen = esAR ?? esES ?? esAny ?? null;
      if (chosen) utter.voice = chosen;
      utter.onstart = () => { setSpeaking(true); setPaused(false); };
      utter.onend = () => { setSpeaking(false); setPaused(false); utteranceRef.current = null; };
      utter.onerror = () => { setSpeaking(false); setPaused(false); utteranceRef.current = null; };
      utteranceRef.current = utter;
      window.speechSynthesis.speak(utter);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => { trySpeak(); window.speechSynthesis.onvoiceschanged = null; };
    } else {
      trySpeak();
    }
  }, [supported]);

  const togglePause = useCallback(() => {
    if (!supported) return;
    if (paused) { window.speechSynthesis.resume(); setPaused(false); }
    else { window.speechSynthesis.pause(); setPaused(true); }
  }, [supported, paused]);

  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);

  return { speak, stop, togglePause, speaking, paused, supported };
}

// ─── Voice Button ─────────────────────────────────────────────────────────────
function VoiceButton({ text, tts }: { text: string; tts: ReturnType<typeof useTTS> }) {
  if (!tts.supported) return null;
  return (
    <div className="flex items-center gap-2 mb-3">
      <button
        onClick={() => tts.speaking ? tts.stop() : tts.speak(text)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
        style={{ background: tts.speaking ? "rgba(0,166,81,0.2)" : "rgba(0,48,135,0.15)", border: "1px solid rgba(0,48,135,0.3)", color: "#003087" }}
      >
        {tts.speaking ? <Volume2 className="w-3.5 h-3.5 text-green-600 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-blue-800/60" />}
        <span>{tts.speaking ? "Leyendo..." : "Escuchar"}</span>
      </button>
      {tts.speaking && (
        <button
          onClick={tts.togglePause}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
          style={{ background: "rgba(0,48,135,0.1)", border: "1px solid rgba(0,48,135,0.25)", color: "#003087" }}
        >
          {tts.paused ? <Play className="w-3.5 h-3.5 text-green-600" /> : <Pause className="w-3.5 h-3.5 text-orange-500" />}
          <span>{tts.paused ? "Reanudar" : "Pausar"}</span>
        </button>
      )}
    </div>
  );
}

// ─── Animated Step ────────────────────────────────────────────────────────────
function AnimatedStep({ stepKey, children }: { stepKey: number; children: React.ReactNode }) {
  const [phase, setPhase] = useState<"hidden" | "visible">("hidden");
  useEffect(() => {
    const t = setTimeout(() => setPhase("visible"), 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      opacity: phase === "visible" ? 1 : 0,
      transform: phase === "visible" ? "translateY(0px)" : "translateY(24px)",
      transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
      willChange: "opacity, transform",
    }}>
      {children}
    </div>
  );
}

// ─── ORT Header ───────────────────────────────────────────────────────────────
function OrtHeader({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div style={{ background: "#003087", borderBottom: "3px solid #00a651" }} className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-4 py-2 max-w-4xl mx-auto">
        <img src={ORT_LOGO} alt="ORT Argentina" className="h-9 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-xs font-medium hidden sm:block">Universidad 2040</span>
          <div className="w-32 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#00a651", transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
          </div>
          <span className="text-white text-xs font-bold">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Access Screen ────────────────────────────────────────────────────────────
function AccessScreen({ onAccess }: { onAccess: (sessionId: string, name: string) => void }) {
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const verify = trpc.capsule.verifyPassword.useMutation();
  const isAdmin = name.trim() === "/admin";

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && isAdmin) { e.preventDefault(); navigate("/dashboard"); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) { navigate("/dashboard"); return; }
    setError("");
    if (!password.trim()) { setError("Por favor ingresá la contraseña de acceso."); return; }
    verify.mutate(
      { password: password.trim(), studentName: name.trim() },
      {
        onSuccess: (result) => onAccess(result.sessionId, name.trim()),
        onError: () => setError("Contraseña incorrecta. Verificá que estés usando la contraseña correcta e intentá de nuevo."),
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#003087" }}>
      {/* Top bar */}
      <div style={{ background: "#001f5c", borderBottom: "3px solid #00a651" }} className="px-6 py-3 flex items-center justify-between">
        <img src={ORT_LOGO} alt="ORT Argentina" className="h-10 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
        <span className="text-white/60 text-xs hidden sm:block">Cápsula Interactiva · Acceso exclusivo</span>
      </div>

      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background image with strong overlay */}
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${SCENE_IMAGES.scene1})` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(0,31,92,0.95) 0%, rgba(0,48,135,0.9) 100%)" }} />

        <AnimatedStep stepKey={0}>
          <div className="relative z-10 w-full max-w-md">
            {/* Card */}
            <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "rgba(255,255,255,0.97)", border: "1px solid rgba(255,255,255,0.3)" }}>
              {/* Card header */}
              <div style={{ background: "#003087", padding: "28px 32px 24px" }} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ background: "rgba(0,166,81,0.2)", border: "2px solid #00a651" }}>
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#00a651" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>Universidad 2040</h1>
                <p className="text-white/70 text-sm">Cápsula Interactiva</p>
              </div>

              {/* Card body */}
              <div className="p-8">
                <p className="text-gray-600 text-sm text-center mb-6 leading-relaxed">
                  Ingresá tu nombre y la contraseña de acceso para participar de esta experiencia interactiva.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tu nombre</label>
                    <input
                      type="text"
                      placeholder="Nombre y apellido"
                      value={name}
                      onChange={e => { setName(e.target.value); setError(""); }}
                      onKeyDown={handleNameKeyDown}
                      className="ort-input"
                    />
                  </div>
                  {!isAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Contraseña de acceso</label>
                      <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="ort-input"
                      />
                    </div>
                  )}
                  {isAdmin && (
                    <div className="rounded-lg px-4 py-3 text-sm font-semibold text-center" style={{ background: "#e8f8f0", border: "1px solid #00a651", color: "#007a3d" }}>
                      Acceso admin detectado — presioná Enter o el botón
                    </div>
                  )}
                  {error && (
                    <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "#fff0f0", border: "1px solid #fca5a5", color: "#dc2626" }}>
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={verify.isPending}
                    className="ort-btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontSize: "1rem", padding: "14px 28px" }}
                  >
                    {verify.isPending ? "Verificando..." : "Ingresar a la cápsula →"}
                  </button>
                </form>
                <p className="mt-5 text-gray-400 text-xs text-center">Duración estimada: 6 minutos</p>
              </div>
            </div>

            {/* ORT footer */}
            <p className="text-center text-white/40 text-xs mt-5">© ORT Argentina · Educando para la vida</p>
          </div>
        </AnimatedStep>
      </div>
    </div>
  );
}

// ─── Scene Wrapper ────────────────────────────────────────────────────────────
// Split layout: left = image, right = content (desktop) / stacked (mobile)
function SceneWrapper({ image, children, step }: { image: string; children: React.ReactNode; step: number }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f5f7fa" }}>
      <OrtHeader step={step} total={TOTAL_STEPS - 1} />
      <div className="flex-1 flex flex-col lg:flex-row pt-14">
        {/* Image panel */}
        <div className="lg:w-2/5 h-56 lg:h-auto relative flex-shrink-0">
          <img src={image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 60%, #f5f7fa 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 lg:hidden h-16" style={{ background: "linear-gradient(to top, #f5f7fa, transparent)" }} />
        </div>
        {/* Content panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-12">
          <AnimatedStep stepKey={step}>
            <div className="w-full max-w-xl">
              {children}
            </div>
          </AnimatedStep>
        </div>
      </div>
    </div>
  );
}

// ─── Narration Block ──────────────────────────────────────────────────────────
function Narration({ title, text, tts }: { title: string; text: string; tts: ReturnType<typeof useTTS> }) {
  useEffect(() => {
    const t = setTimeout(() => tts.speak(`${title}. ${text}`), 900);
    return () => { clearTimeout(t); tts.stop(); };
  }, [title, text]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mb-8">
      <div className="mb-4">
        <VoiceButton text={`${title}. ${text}`} tts={tts} />
      </div>
      <div className="ort-divider mb-5" style={{ width: "48px" }} />
      <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "#003087", fontFamily: "'Montserrat', sans-serif", lineHeight: 1.2 }}>
        {title}
      </h2>
      <p className="text-gray-600 text-base leading-relaxed">
        {text}
      </p>
    </div>
  );
}

// ─── Interaction Header ───────────────────────────────────────────────────────
function InteractionHeader({ num, question, subtitle, tts }: {
  num: string; question: string; subtitle?: string; tts: ReturnType<typeof useTTS>;
}) {
  const fullText = subtitle ? `${question}. ${subtitle}` : question;
  useEffect(() => {
    const t = setTimeout(() => tts.speak(fullText), 900);
    return () => { clearTimeout(t); tts.stop(); };
  }, [question]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mb-6">
      <span className="ort-badge mb-3 inline-block">{num}</span>
      <div className="mb-2">
        <VoiceButton text={fullText} tts={tts} />
      </div>
      <div className="ort-divider mb-4" style={{ width: "40px" }} />
      <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "#003087", fontFamily: "'Montserrat', sans-serif" }}>
        {question}
      </h2>
      {subtitle && <p className="text-gray-500 text-sm font-medium">{subtitle}</p>}
    </div>
  );
}

// ─── Option Card ──────────────────────────────────────────────────────────────
function OptionCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="option-card w-full text-left px-5 py-4 rounded-xl font-semibold text-base"
      style={{
        background: selected ? "#e8f0ff" : "#ffffff",
        border: selected ? "2px solid #003087" : "2px solid #e8ecf0",
        color: selected ? "#003087" : "#1a202c",
        boxShadow: selected ? "0 2px 8px rgba(0,48,135,0.15)" : "0 1px 3px rgba(0,0,0,0.06)",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <span
        className="inline-block w-4 h-4 rounded-full border-2 mr-3 align-middle flex-shrink-0"
        style={{
          display: "inline-block",
          background: selected ? "#003087" : "transparent",
          borderColor: selected ? "#003087" : "#cbd5e0",
          transition: "all 0.2s ease",
        }}
      />
      {label}
    </button>
  );
}

// ─── Checkbox Card ────────────────────────────────────────────────────────────
function CheckboxCard({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled && !checked}
      className="option-card w-full text-left px-4 py-3.5 rounded-xl font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: checked ? "#e8f0ff" : "#ffffff",
        border: checked ? "2px solid #003087" : "2px solid #e8ecf0",
        color: checked ? "#003087" : "#1a202c",
        boxShadow: checked ? "0 2px 8px rgba(0,48,135,0.15)" : "0 1px 3px rgba(0,0,0,0.06)",
        transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded border-2 mr-3 align-middle flex-shrink-0"
        style={{
          display: "inline-flex",
          background: checked ? "#003087" : "transparent",
          borderColor: checked ? "#003087" : "#cbd5e0",
          transition: "all 0.2s ease",
        }}
      >
        {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
      </span>
      {label}
    </button>
  );
}

// ─── Ranking List ─────────────────────────────────────────────────────────────
function RankingList({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const onDragStart = (i: number) => { dragIndex.current = i; };
  const onDragEnter = (i: number) => { setDragOver(i); };
  const onDragEnd = () => {
    if (dragIndex.current !== null && dragOver !== null && dragIndex.current !== dragOver) {
      const next = [...items];
      const [moved] = next.splice(dragIndex.current, 1);
      next.splice(dragOver, 0, moved);
      onChange(next);
    }
    dragIndex.current = null;
    setDragOver(null);
  };

  return (
    <div className="space-y-2 w-full">
      {items.map((item, i) => (
        <div
          key={item}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragEnter={() => onDragEnter(i)}
          onDragOver={e => e.preventDefault()}
          onDragEnd={onDragEnd}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm"
          style={{
            background: dragOver === i ? "#e8f8f0" : "#ffffff",
            border: dragOver === i ? "2px solid #00a651" : "2px solid #e8ecf0",
            color: "#1a202c",
            cursor: "grab",
            userSelect: "none",
            boxShadow: dragOver === i ? "0 2px 8px rgba(0,166,81,0.2)" : "0 1px 3px rgba(0,0,0,0.06)",
            transition: "all 0.2s ease",
          }}
        >
          <span className="font-bold text-base w-6 text-center flex-shrink-0" style={{ color: "#003087" }}>{i + 1}</span>
          <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: "#a0aec0" }} />
          <span className="flex-1">{item}</span>
        </div>
      ))}
      <p className="text-gray-400 text-xs text-center mt-2 font-medium">Arrastrá para reordenar</p>
    </div>
  );
}

// ─── Continue Button ──────────────────────────────────────────────────────────
function ContinueBtn({ disabled = false, label = "Continuar", onClick, loading = false }: { disabled?: boolean; label?: string; onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="ort-btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
      style={{ fontSize: "0.95rem" }}
    >
      {loading ? "Guardando..." : label}
      {!loading && <ChevronRight className="w-4 h-4" />}
    </button>
  );
}

// ─── Final Screen ─────────────────────────────────────────────────────────────
function FinalScreen({ name, tts }: { name: string; tts: ReturnType<typeof useTTS> }) {
  const msg = `¡Gracias${name ? `, ${name}` : ""}! Completaste la cápsula interactiva Universidad 2040. Tus respuestas son valiosas para diseñar la universidad del futuro.`;

  useEffect(() => {
    const t = setTimeout(() => tts.speak(msg), 800);
    return () => { clearTimeout(t); tts.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#003087" }}>
      {/* Header */}
      <div style={{ background: "#001f5c", borderBottom: "3px solid #00a651" }} className="px-6 py-3">
        <img src={ORT_LOGO} alt="ORT Argentina" className="h-9 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${SCENE_IMAGES.scene5})` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(0,31,92,0.95), rgba(0,48,135,0.9))" }} />

        <AnimatedStep stepKey={99}>
          <div className="relative z-10 max-w-2xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ background: "rgba(0,166,81,0.2)", border: "2px solid #00a651" }}>
              <CheckCircle2 className="w-10 h-10" style={{ color: "#00a651" }} />
            </div>
            <div className="flex justify-center mb-4">
              <VoiceButton text={msg} tts={tts} />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              ¡Gracias{name ? `, ${name}` : ""}!
            </h1>
            <div className="ort-divider mx-auto mb-6" style={{ width: "60px" }} />
            <p className="text-white text-lg leading-relaxed mb-3 font-medium">
              Completaste la cápsula interactiva <strong>Universidad 2040</strong>.
            </p>
            <p className="text-white/75 text-base leading-relaxed mb-8">
              Tus respuestas son valiosas para diseñar la universidad del futuro. El equipo las analizará para construir un modelo educativo que responda a los desafíos globales.
            </p>
            <div className="rounded-xl px-6 py-5" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <p className="text-white/85 text-sm italic leading-relaxed">
                "La universidad del futuro no es solo un lugar donde se transmite conocimiento. Es un espacio donde se crea, se experimenta y se construyen soluciones para los desafíos del mundo."
              </p>
            </div>
            <img src={ORT_LOGO} alt="ORT Argentina" className="h-10 object-contain mx-auto mt-8 opacity-60" style={{ filter: "brightness(0) invert(1)" }} />
          </div>
        </AnimatedStep>
      </div>
    </div>
  );
}

// ─── Main Capsule ─────────────────────────────────────────────────────────────
export default function Capsule() {
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [answers, setAnswers] = useState<Answers>({
    interaction1: "",
    interaction2: [],
    interaction3: "",
    interaction4Opinion: "",
    interaction4Text: "",
    interaction5: [
      "Tecnología avanzada",
      "Pensamiento crítico",
      "Aprendizaje práctico",
      "Innovación y emprendimiento",
      "Experiencia internacional",
      "Trabajo interdisciplinario",
      "Ética y responsabilidad social",
      "Aprendizaje permanente",
    ],
  });

  const tts = useTTS();
  const saveResponse = trpc.capsule.saveResponse.useMutation();
  const complete = trpc.capsule.complete.useMutation();

  const handleAccess = useCallback((sid: string, name: string) => {
    setSessionId(sid);
    setStudentName(name);
    setStep(1);
  }, []);

  const next = useCallback(async () => {
    if (!sessionId) return;
    tts.stop();
    await saveResponse.mutateAsync({ sessionId, ...answers }).catch(() => {});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sessionId, answers, saveResponse, tts]);

  const handleComplete = useCallback(async () => {
    if (!sessionId) return;
    tts.stop();
    try {
      await complete.mutateAsync({ sessionId, studentName, ...answers });
      setStep(TOTAL_STEPS);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Error al guardar respuestas. Por favor, intentá de nuevo.");
    }
  }, [sessionId, studentName, answers, complete, tts]);

  const updateAnswer = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  if (step === 0) return <AccessScreen onAccess={handleAccess} />;
  if (step >= TOTAL_STEPS) return <FinalScreen name={studentName} tts={tts} />;

  return (
    <>
      {/* Step 1: Scene 1 */}
      {step === 1 && (
        <SceneWrapper image={SCENE_IMAGES.scene1} step={step}>
          <Narration tts={tts} title="El mundo que viene"
            text="Imaginá que estamos en el año 2040. La inteligencia artificial transformó casi todas las profesiones. Las economías cambiaron. Los desafíos ambientales se volvieron urgentes. El conocimiento se produce en redes globales. En este mundo, una pregunta se volvió central: ¿Cómo deben formarse los profesionales del futuro?" />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {/* Step 2: Interaction 1 */}
      {step === 2 && (
        <SceneWrapper image={SCENE_IMAGES.scene1} step={step}>
          <InteractionHeader tts={tts} num="Interacción 1 de 5"
            question="¿Cuál de estos cambios creés que impactará más en las profesiones?"
            subtitle="No hay respuesta correcta: buscamos reflexión." />
          <div className="space-y-3">
            {["Inteligencia artificial", "Cambio climático", "Nuevas formas de trabajo", "Globalización del conocimiento"].map(opt => (
              <OptionCard key={opt} label={opt} selected={answers.interaction1 === opt} onClick={() => updateAnswer("interaction1", opt)} />
            ))}
          </div>
          <ContinueBtn disabled={!answers.interaction1} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {/* Step 3: Scene 2 */}
      {step === 3 && (
        <SceneWrapper image={SCENE_IMAGES.scene2} step={step}>
          <Narration tts={tts} title="La universidad del futuro"
            text="Las universidades también tuvieron que transformarse. Ya no alcanzaba con transmitir conocimiento. Las nuevas generaciones necesitaban aprender a resolver problemas complejos, trabajar en equipos interdisciplinarios, innovar y adaptarse a contextos cambiantes. Entonces surge una nueva pregunta: ¿Cómo debería ser una universidad preparada para este mundo?" />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {/* Step 4: Interaction 2 */}
      {step === 4 && (
        <SceneWrapper image={SCENE_IMAGES.scene2} step={step}>
          <InteractionHeader tts={tts} num="Interacción 2 de 5"
            question="Diseñá tu universidad"
            subtitle={`Elegí los 3 elementos que no podrían faltar. (${answers.interaction2.length}/3 seleccionados)`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {["Proyectos interdisciplinarios", "Prácticas en empresas", "Investigación", "Intercambio internacional",
              "Laboratorios tecnológicos", "Mentorías docentes", "Emprendimientos", "Cursos virtuales flexibles"].map(opt => (
              <CheckboxCard key={opt} label={opt} checked={answers.interaction2.includes(opt)}
                disabled={answers.interaction2.length >= 3}
                onChange={() => {
                  const cur = answers.interaction2;
                  if (cur.includes(opt)) updateAnswer("interaction2", cur.filter(x => x !== opt));
                  else if (cur.length < 3) updateAnswer("interaction2", [...cur, opt]);
                }} />
            ))}
          </div>
          <ContinueBtn disabled={answers.interaction2.length !== 3} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {/* Step 5: Scene 3 */}
      {step === 5 && (
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step}>
          <Narration tts={tts} title="El profesional que necesita el mundo"
            text="Hoy muchas investigaciones coinciden en algo: los profesionales del futuro no solo necesitarán conocimientos técnicos. También necesitarán desarrollar capacidades como pensamiento crítico, creatividad, trabajo en equipo, aprendizaje permanente y responsabilidad ética. La formación universitaria deberá integrar tecnología, práctica y desarrollo humano." />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {/* Step 6: Interaction 3 */}
      {step === 6 && (
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step}>
          <InteractionHeader tts={tts} num="Interacción 3 de 5"
            question="¿Qué habilidad creés que será más importante para el futuro?" />
          <div className="space-y-3">
            {["Resolver problemas complejos", "Adaptarse al cambio", "Trabajar con tecnología", "Trabajar con otras personas"].map(opt => (
              <OptionCard key={opt} label={opt} selected={answers.interaction3 === opt} onClick={() => updateAnswer("interaction3", opt)} />
            ))}
          </div>
          <ContinueBtn disabled={!answers.interaction3} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {/* Step 7: Scene 4 */}
      {step === 7 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step}>
          <Narration tts={tts} title="Un posible modelo de universidad"
            text="Muchas universidades innovadoras están avanzando hacia modelos educativos que combinan formación tecnológica avanzada, aprendizaje basado en proyectos, trabajo con empresas y organizaciones, experiencias internacionales, trayectorias flexibles y desarrollo de habilidades humanas. Este tipo de modelo busca responder a los desafíos del mundo actual." />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {/* Step 8: Interaction 4 */}
      {step === 8 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step}>
          <InteractionHeader tts={tts} num="Interacción 4 de 5"
            question="¿Creés que este modelo responde a los desafíos globales?" />
          <div className="flex gap-3 mb-6 flex-wrap">
            {["Sí", "Parcialmente", "No"].map(opt => (
              <button key={opt} onClick={() => updateAnswer("interaction4Opinion", opt)}
                className="px-6 py-3 rounded-xl font-bold text-base transition-all"
                style={{
                  background: answers.interaction4Opinion === opt ? "#003087" : "#ffffff",
                  border: answers.interaction4Opinion === opt ? "2px solid #003087" : "2px solid #e8ecf0",
                  color: answers.interaction4Opinion === opt ? "#ffffff" : "#1a202c",
                  boxShadow: answers.interaction4Opinion === opt ? "0 2px 8px rgba(0,48,135,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}>
                {opt}
              </button>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2" style={{ color: "#4a5568" }}>¿Qué agregarías? (opcional)</label>
            <Textarea
              placeholder="Escribí tu sugerencia aquí..."
              value={answers.interaction4Text}
              onChange={e => updateAnswer("interaction4Text", e.target.value)}
              rows={3}
              className="ort-input"
              style={{ resize: "none", border: "2px solid #e8ecf0", borderRadius: "8px", color: "#1a202c", background: "#ffffff" }}
            />
          </div>
          <ContinueBtn disabled={!answers.interaction4Opinion} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {/* Step 9: Scene 5 */}
      {step === 9 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <Narration tts={tts} title="Priorizar lo importante"
            text="Si tuvieras que elegir los elementos más importantes para la universidad del futuro… ¿Cuáles serían? En la siguiente pantalla podrás ordenarlos según tu criterio." />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {/* Step 10: Interaction 5 */}
      {step === 10 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <InteractionHeader tts={tts} num="Interacción 5 de 5"
            question="Ranking de prioridades"
            subtitle="Arrastrá los elementos para ordenarlos de más a menos importante." />
          <RankingList items={answers.interaction5} onChange={items => updateAnswer("interaction5", items)} />
          <ContinueBtn onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {/* Step 11: Closing scene */}
      {step === 11 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <Narration tts={tts} title="La universidad del futuro empieza hoy"
            text="Los desafíos globales están transformando profundamente la educación superior. Las universidades que quieran formar profesionales para el futuro deberán repensar cómo enseñan, qué enseñan, y cómo se vinculan con el mundo." />
          <ContinueBtn
            label={complete.isPending ? "Guardando respuestas..." : "Enviar mis respuestas"}
            onClick={handleComplete}
            disabled={complete.isPending}
            loading={complete.isPending}
          />
        </SceneWrapper>
      )}
    </>
  );
}
