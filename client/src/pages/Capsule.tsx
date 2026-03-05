import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ChevronRight, GripVertical, CheckCircle2, Volume2, VolumeX, Pause, Play, Sparkles } from "lucide-react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const ORT_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_nobg_40c8928c.png";

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
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={() => tts.speaking ? tts.stop() : tts.speak(text)}
        className="voice-btn"
      >
        {tts.speaking
          ? <Volume2 className="w-3.5 h-3.5 animate-pulse" />
          : <VolumeX className="w-3.5 h-3.5 opacity-60" />}
        <span>{tts.speaking ? "Leyendo..." : "Escuchar"}</span>
      </button>
      {tts.speaking && (
        <button onClick={tts.togglePause} className="voice-btn" style={{ borderColor: "rgba(255,165,0,0.3)", background: "rgba(255,165,0,0.1)", color: "#ffa500" }}>
          {tts.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
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
    const t = setTimeout(() => setPhase("visible"), 80);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      opacity: phase === "visible" ? 1 : 0,
      transform: phase === "visible" ? "translateY(0px) scale(1)" : "translateY(36px) scale(0.98)",
      filter: phase === "visible" ? "blur(0px)" : "blur(3px)",
      transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), filter 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
      willChange: "opacity, transform, filter",
    }}>
      {children}
    </div>
  );
}

// ─── Background FX ────────────────────────────────────────────────────────────
function BackgroundFX({ image }: { image?: string }) {
  return (
    <>
      {/* Deep dark base */}
      <div className="fixed inset-0 z-0" style={{ background: "#070b14" }} />
      {/* Scene image blurred as ambient */}
      {image && (
        <div className="fixed inset-0 z-0 opacity-10"
          style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(40px) saturate(1.5)" }} />
      )}
      {/* Gradient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      {/* Grid */}
      <div className="grid-overlay" />
      {/* Noise */}
      <div className="noise-overlay" />
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function OrtHeader({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="fixed top-0 left-0 right-0 z-50" style={{
      background: "rgba(7,11,20,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div className="flex items-center justify-between px-5 py-3 max-w-5xl mx-auto">
        <img src={ORT_LOGO} alt="ORT Argentina" className="h-9 object-contain" />
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs font-medium hidden sm:block tracking-widest uppercase">Universidad 2040</span>
          <div className="ort-progress-bar w-28 sm:w-40">
            <div className="ort-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-white/70 text-xs font-bold tabular-nums">{pct}%</span>
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <BackgroundFX image={SCENE_IMAGES.scene1} />

      {/* Top bar */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(7,11,20,0.6)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <img src={ORT_LOGO} alt="ORT Argentina" className="h-10 object-contain" />
        <span className="text-white/30 text-xs tracking-widest uppercase hidden sm:block">Cápsula Interactiva · Acceso exclusivo</span>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <AnimatedStep stepKey={0}>
          <div className="w-full max-w-md">
            {/* Main card */}
            <div className="hero-card overflow-hidden">
              {/* Card top */}
              <div className="px-8 pt-10 pb-8 text-center" style={{
                background: "linear-gradient(160deg, rgba(0,48,135,0.4) 0%, rgba(0,166,81,0.08) 100%)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                {/* Animated icon */}
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 float-anim"
                  style={{ background: "linear-gradient(135deg, rgba(0,48,135,0.6), rgba(0,166,81,0.3))", border: "1px solid rgba(0,166,81,0.3)", boxShadow: "0 8px 32px rgba(0,48,135,0.4)" }}>
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div className="ort-badge mb-3">Experiencia exclusiva</div>
                <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>
                  Universidad 2040
                </h1>
                <p className="text-white/50 text-sm">Cápsula Interactiva · ORT Argentina</p>
              </div>

              {/* Card body */}
              <div className="px-8 py-8">
                <p className="text-white/60 text-sm text-center mb-7 leading-relaxed">
                  Ingresá tu nombre y la contraseña de acceso para participar de esta experiencia interactiva.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">Tu nombre</label>
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
                      <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">Contraseña de acceso</label>
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
                    <div className="rounded-xl px-4 py-3 text-sm font-semibold text-center"
                      style={{ background: "rgba(0,166,81,0.1)", border: "1px solid rgba(0,166,81,0.3)", color: "#00a651" }}>
                      ✓ Acceso admin detectado — presioná Enter o el botón
                    </div>
                  )}
                  {error && (
                    <div className="rounded-xl px-4 py-3 text-sm"
                      style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}>
                      {error}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={verify.isPending}
                    className="ort-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontSize: "1rem", padding: "15px 28px", marginTop: "8px" }}
                  >
                    {verify.isPending ? "Verificando..." : "Ingresar a la cápsula →"}
                  </button>
                </form>
                <p className="mt-5 text-white/25 text-xs text-center">Duración estimada: 6 minutos</p>
              </div>
            </div>

            <p className="text-center text-white/20 text-xs mt-6">© ORT Argentina · Educando para la vida</p>
          </div>
        </AnimatedStep>
      </div>
    </div>
  );
}

// ─── Scene Wrapper ────────────────────────────────────────────────────────────
function SceneWrapper({ image, children, step }: { image: string; children: React.ReactNode; step: number }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <BackgroundFX image={image} />
      <OrtHeader step={step} total={TOTAL_STEPS - 1} />

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row pt-16">
        {/* Image panel */}
        <div className="lg:w-2/5 h-52 lg:h-auto relative flex-shrink-0 overflow-hidden">
          <img src={image} alt="" className="w-full h-full object-cover"
            style={{ filter: "saturate(1.2) brightness(0.85)" }} />
          {/* Gradient overlays */}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(7,11,20,0.3) 0%, transparent 30%, transparent 60%, rgba(7,11,20,0.7) 100%)" }} />
          <div className="absolute inset-0 hidden lg:block"
            style={{ background: "linear-gradient(to right, transparent 60%, rgba(7,11,20,0.95) 100%)" }} />
          {/* Bottom fade mobile */}
          <div className="absolute bottom-0 left-0 right-0 h-20 lg:hidden"
            style={{ background: "linear-gradient(to top, rgba(7,11,20,1), transparent)" }} />
        </div>

        {/* Content panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-14">
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
      <VoiceButton text={`${title}. ${text}`} tts={tts} />
      <div className="accent-line mb-5" />
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 glow-text"
        style={{ fontFamily: "'Syne', sans-serif", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      <p className="text-white/65 text-base leading-relaxed">
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
    <div className="mb-7">
      <div className="ort-badge mb-4 inline-block">{num}</div>
      <VoiceButton text={fullText} tts={tts} />
      <div className="accent-line mb-5" />
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2"
        style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>
        {question}
      </h2>
      {subtitle && <p className="text-white/45 text-sm font-medium mt-2">{subtitle}</p>}
    </div>
  );
}

// ─── Option Card ──────────────────────────────────────────────────────────────
function OptionCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`option-card w-full text-left px-5 py-4 ${selected ? "selected" : ""}`}
    >
      <div className="flex items-center gap-3 relative z-10">
        <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
          style={{
            borderColor: selected ? "#003087" : "rgba(255,255,255,0.2)",
            background: selected ? "#003087" : "transparent",
          }}>
          {selected && <span className="w-2 h-2 rounded-full bg-white" />}
        </span>
        <span className="font-semibold text-sm sm:text-base" style={{ color: selected ? "#ffffff" : "rgba(255,255,255,0.8)" }}>
          {label}
        </span>
      </div>
    </button>
  );
}

// ─── Checkbox Card ────────────────────────────────────────────────────────────
function CheckboxCard({ label, checked, disabled, onChange }: { label: string; checked: boolean; disabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled && !checked}
      className={`option-card w-full text-left px-4 py-3.5 disabled:opacity-30 disabled:cursor-not-allowed ${checked ? "selected-green" : ""}`}
    >
      <div className="flex items-center gap-3 relative z-10">
        <span className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200"
          style={{
            borderColor: checked ? "#00a651" : "rgba(255,255,255,0.2)",
            background: checked ? "#00a651" : "transparent",
          }}>
          {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </span>
        <span className="font-semibold text-sm" style={{ color: checked ? "#ffffff" : "rgba(255,255,255,0.75)" }}>
          {label}
        </span>
      </div>
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
          className={`drag-item flex items-center gap-3 px-4 py-3.5 ${dragOver === i ? "drag-over" : ""}`}
        >
          <div className="rank-number">{i + 1}</div>
          <GripVertical className="w-4 h-4 flex-shrink-0 text-white/25" />
          <span className="flex-1 font-semibold text-sm text-white/80">{item}</span>
        </div>
      ))}
      <p className="text-white/25 text-xs text-center mt-3 font-medium">Arrastrá para reordenar</p>
    </div>
  );
}

// ─── Continue Button ──────────────────────────────────────────────────────────
function ContinueBtn({ disabled = false, label = "Continuar", onClick, loading = false }: { disabled?: boolean; label?: string; onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="ort-btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-7"
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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <BackgroundFX image={SCENE_IMAGES.scene5} />

      {/* Header */}
      <div className="relative z-10 px-6 py-4"
        style={{ background: "rgba(7,11,20,0.6)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <img src={ORT_LOGO} alt="ORT Argentina" className="h-9 object-contain" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-16">
        <AnimatedStep stepKey={99}>
          <div className="max-w-2xl text-center">
            {/* Icon */}
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-7 confetti-pop"
              style={{ background: "linear-gradient(135deg, rgba(0,166,81,0.3), rgba(0,48,135,0.3))", border: "1px solid rgba(0,166,81,0.4)", boxShadow: "0 16px 48px rgba(0,166,81,0.25)" }}>
              <CheckCircle2 className="w-12 h-12" style={{ color: "#00a651" }} />
            </div>

            <VoiceButton text={msg} tts={tts} />

            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 glow-text"
              style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em" }}>
              ¡Gracias{name ? `, ${name}` : ""}!
            </h1>

            <div className="accent-line mx-auto mb-6" />

            <p className="text-white/80 text-lg leading-relaxed mb-3 font-medium">
              Completaste la cápsula interactiva <span className="gradient-text font-bold">Universidad 2040</span>.
            </p>
            <p className="text-white/50 text-base leading-relaxed mb-8">
              Tus respuestas son valiosas para diseñar la universidad del futuro. El equipo las analizará para construir un modelo educativo que responda a los desafíos globales.
            </p>

            <div className="hero-card px-7 py-6 mb-8">
              <p className="text-white/60 text-sm italic leading-relaxed">
                "La universidad del futuro no es solo un lugar donde se transmite conocimiento. Es un espacio donde se crea, se experimenta y se construyen soluciones para los desafíos del mundo."
              </p>
            </div>

            <img src={ORT_LOGO} alt="ORT Argentina" className="h-12 object-contain mx-auto opacity-50" />
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
      {step === 1 && (
        <SceneWrapper image={SCENE_IMAGES.scene1} step={step}>
          <Narration tts={tts} title="El mundo que viene"
            text="Imaginá que estamos en el año 2040. La inteligencia artificial transformó casi todas las profesiones. Las economías cambiaron. Los desafíos ambientales se volvieron urgentes. El conocimiento se produce en redes globales. En este mundo, una pregunta se volvió central: ¿Cómo deben formarse los profesionales del futuro?" />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

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

      {step === 3 && (
        <SceneWrapper image={SCENE_IMAGES.scene2} step={step}>
          <Narration tts={tts} title="La universidad del futuro"
            text="Las universidades también tuvieron que transformarse. Ya no alcanzaba con transmitir conocimiento. Las nuevas generaciones necesitaban aprender a resolver problemas complejos, trabajar en equipos interdisciplinarios, innovar y adaptarse a contextos cambiantes. Entonces surge una nueva pregunta: ¿Cómo debería ser una universidad preparada para este mundo?" />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 4 && (
        <SceneWrapper image={SCENE_IMAGES.scene2} step={step}>
          <InteractionHeader tts={tts} num="Interacción 2 de 5"
            question="Si diseñaras tu universidad ideal, ¿qué tres elementos no podrían faltar?"
            subtitle="Elegí exactamente 3 opciones." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              "Proyectos interdisciplinarios",
              "Prácticas en empresas reales",
              "Investigación aplicada",
              "Intercambio internacional",
              "Laboratorios de innovación",
              "Mentorías con profesionales",
              "Programas de emprendimiento",
              "Cursos virtuales globales",
            ].map(opt => (
              <CheckboxCard
                key={opt} label={opt}
                checked={answers.interaction2.includes(opt)}
                disabled={answers.interaction2.length >= 3}
                onChange={() => {
                  const cur = answers.interaction2;
                  updateAnswer("interaction2", cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt]);
                }}
              />
            ))}
          </div>
          <p className="text-white/35 text-xs mt-3 font-medium">
            {answers.interaction2.length}/3 seleccionados
          </p>
          <ContinueBtn disabled={answers.interaction2.length !== 3} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 5 && (
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step}>
          <Narration tts={tts} title="El profesional que necesita el mundo"
            text="En 2040, los empleos más demandados todavía no tienen nombre. Pero las habilidades para enfrentarlos sí se pueden cultivar hoy. La pregunta ya no es solo qué sabés, sino cómo pensás, cómo colaborás y cómo te adaptás a lo desconocido." />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 6 && (
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step}>
          <InteractionHeader tts={tts} num="Interacción 3 de 5"
            question="¿Cuál creés que es la habilidad más importante para el profesional del futuro?"
            subtitle="Elegí la que te parece más relevante." />
          <div className="space-y-3">
            {[
              "Resolver problemas complejos",
              "Adaptarse a cambios rápidos",
              "Trabajar con tecnología avanzada",
              "Colaborar con personas diversas",
            ].map(opt => (
              <OptionCard key={opt} label={opt} selected={answers.interaction3 === opt} onClick={() => updateAnswer("interaction3", opt)} />
            ))}
          </div>
          <ContinueBtn disabled={!answers.interaction3} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 7 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step}>
          <Narration tts={tts} title="Un posible modelo de universidad"
            text="Hay modelos universitarios en el mundo que ya están respondiendo a estos desafíos. Integran tecnología, proyectos reales, colaboración global y formación en valores. La pregunta es: ¿Está el modelo actual preparado para lo que viene?" />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 8 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step}>
          <InteractionHeader tts={tts} num="Interacción 4 de 5"
            question="¿Creés que el modelo universitario actual está preparado para el mundo de 2040?"
            subtitle="Compartí también tu opinión en el campo de texto." />
          <div className="space-y-3 mb-5">
            {["Sí, está bien encaminado", "Parcialmente, necesita cambios", "No, requiere una transformación profunda"].map(opt => (
              <OptionCard key={opt} label={opt} selected={answers.interaction4Opinion === opt} onClick={() => updateAnswer("interaction4Opinion", opt)} />
            ))}
          </div>
          <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">Tu opinión (opcional)</label>
          <textarea
            value={answers.interaction4Text}
            onChange={e => updateAnswer("interaction4Text", e.target.value)}
            placeholder="¿Qué cambiarías o agregarías?"
            rows={3}
            className="ort-input resize-none"
            style={{ height: "auto" }}
          />
          <ContinueBtn disabled={!answers.interaction4Opinion} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 9 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <Narration tts={tts} title="Priorizar lo importante"
            text="Si tuvieras que elegir los elementos más importantes para la universidad del futuro… ¿Cuáles serían? En la siguiente pantalla podrás ordenarlos según tu criterio." />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 10 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <InteractionHeader tts={tts} num="Interacción 5 de 5"
            question="Ranking de prioridades"
            subtitle="Arrastrá los elementos para ordenarlos de más a menos importante." />
          <RankingList items={answers.interaction5} onChange={items => updateAnswer("interaction5", items)} />
          <ContinueBtn onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

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
