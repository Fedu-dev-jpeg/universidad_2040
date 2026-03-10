import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ChevronRight, ChevronLeft, GripVertical, CheckCircle2,
  Volume2, VolumeX, Pause, Play, Sparkles, Menu, X,
  BookOpen, MessageSquare, Star, ThumbsUp, List
} from "lucide-react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const ORT_LOGO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_nobg_40c8928c.png";

const SCENE_IMAGES = {
  scene1: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene1_ai-RmBvavYKyWJ3KKvaesV2ih.webp",
  scene2: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene2_climate-4mTTLLwMkFbExdWohyKrot.webp",
  scene3: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene3_robots-CrDC32VGuCoSH94E4PjgvJ.webp",
  scene4: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene4_university-R3xoCy8EKTMJuTqT97d9md.webp",
  scene5: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene5_global-Myk7EcWD3r8C7QVs3ZbuGn.webp",
};

const TOTAL_STEPS = 14;

// ─── Step metadata for navigation menu ───────────────────────────────────────
const STEP_META = [
  { step: 1,  label: "El mundo que viene",          icon: BookOpen,      type: "scene" },
  { step: 2,  label: "Impacto en profesiones",       icon: MessageSquare, type: "interaction" },
  { step: 3,  label: "La universidad del futuro",    icon: BookOpen,      type: "scene" },
  { step: 4,  label: "Diseñá tu universidad",        icon: Star,          type: "interaction" },
  { step: 5,  label: "El profesional del futuro",    icon: BookOpen,      type: "scene" },
  { step: 6,  label: "Habilidad más importante",     icon: MessageSquare, type: "interaction" },
  { step: 7,  label: "Un posible modelo",            icon: BookOpen,      type: "scene" },
  { step: 8,  label: "¿Está preparada la uni?",      icon: ThumbsUp,      type: "interaction" },
  { step: 9,  label: "Priorizar lo importante",      icon: BookOpen,      type: "scene" },
  { step: 10, label: "Ranking de prioridades",       icon: List,          type: "interaction" },
  { step: 11, label: "Enviar respuestas",            icon: CheckCircle2,  type: "scene" },
  { step: 12, label: "Encuentro presencial",          icon: Sparkles,      type: "scene" },
];

interface Answers {
  interaction1: string[];
  interaction2: string[];
  interaction3: string;
  interaction4Opinion: string;
  interaction4Text: string;
  interaction5: string[];
}

// ─── Audio URLs (real MP3 recordings) ────────────────────────────────────────
const AUDIO_URLS: Record<number, string> = {
  // Escenas narrativas
  1: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio1_a9cd62c4.mp3",
  2: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio2_9e5b999e.mp3",
  3: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio3_5e5106ad.mp3",
  4: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio4_cd2c6dd3.mp3",
  5: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio5_5d9eef09.mp3",
  6: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio6_1da11b35.mp3",
  // Interacciones
  7:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio7_791fbff4.mp3",
  8:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio8_7fefeceb.mp3",
  9:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio9_5b9f4f2a.mp3",
  10: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio10_e9e2db3e.mp3",
  11: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio11_db11f69a.mp3",
  // Acerca de
  12: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio12_af86bb50.mp3",
  // Pantalla de interés presencial
  13: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/audio13_fdea791e.mp3",
};

// ─── Audio Hook (real MP3 playback) ──────────────────────────────────────────
function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeRef = useRef(0.85);
  const supported = true;

  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeaking(false);
    setPaused(false);
  }, []);

  // speak(text, audioIndex?) — if audioIndex provided, plays the MP3; otherwise falls back to TTS
  const speak = useCallback((text: string, audioIndex?: number) => {
    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const url = audioIndex !== undefined ? AUDIO_URLS[audioIndex] : undefined;

    if (url) {
      // Play real MP3
      const audio = new Audio(url);
      audio.volume = volumeRef.current;
      audio.onplay = () => { setSpeaking(true); setPaused(false); };
      audio.onended = () => { setSpeaking(false); setPaused(false); audioRef.current = null; };
      audio.onerror = () => { setSpeaking(false); setPaused(false); audioRef.current = null; };
      audioRef.current = audio;
      audio.play().catch(() => { setSpeaking(false); });
    } else {
      // Fallback to browser TTS for interactions (questions)
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "es-AR";
      utter.rate = 0.85;
      utter.pitch = 0.98;
      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const chosen = voices.find(v => v.lang === "es-419" || v.name.toLowerCase().includes("argentina"))
          ?? voices.find(v => v.lang === "es-AR")
          ?? voices.find(v => v.lang === "es-MX")
          ?? voices.find(v => v.lang.startsWith("es"))
          ?? null;
        if (chosen) utter.voice = chosen;
        utter.onstart = () => { setSpeaking(true); setPaused(false); };
        utter.onend = () => { setSpeaking(false); setPaused(false); };
        utter.onerror = () => { setSpeaking(false); setPaused(false); };
        window.speechSynthesis.speak(utter);
      };
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => { trySpeak(); window.speechSynthesis.onvoiceschanged = null; };
      } else {
        trySpeak();
      }
    }
  }, []);

  const togglePause = useCallback(() => {
    if (audioRef.current) {
      if (paused) { audioRef.current.play(); setPaused(false); }
      else { audioRef.current.pause(); setPaused(true); }
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (paused) { window.speechSynthesis.resume(); setPaused(false); }
      else { window.speechSynthesis.pause(); setPaused(true); }
    }
  }, [paused]);

  useEffect(() => () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  return { speak, stop, togglePause, speaking, paused, supported, volume, setVolume };
}// ─── Voice Button ─────────────────────────────────────────────────────────────────
function VoiceButton({ text, tts, audioIndex, showVolume = false }: {
  text: string; tts: ReturnType<typeof useTTS>; audioIndex?: number; showVolume?: boolean;
}) {
  if (!tts.supported) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <button onClick={() => tts.speaking ? tts.stop() : tts.speak(text, audioIndex)} className="voice-btn">
        {tts.speaking ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 opacity-60" />}
        <span>{tts.speaking ? "Reproduciendo..." : audioIndex !== undefined ? "Escuchar narración" : "Escuchar"}</span>
      </button>
      {tts.speaking && (
        <button onClick={tts.togglePause} className="voice-btn" style={{ borderColor: "rgba(255,165,0,0.3)", background: "rgba(255,165,0,0.1)", color: "#ffa500" }}>
          {tts.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{tts.paused ? "Reanudar" : "Pausar"}</span>
        </button>
      )}
      {showVolume && (
        <div className="flex items-center gap-2 ml-1">
          <VolumeX className="w-3 h-3 text-white/30 flex-shrink-0" />
          <input
            type="range" min={0} max={1} step={0.05}
            value={tts.volume}
            onChange={e => tts.setVolume(Number(e.target.value))}
            className="volume-slider"
            style={{ width: "80px" }}
            title={`Volumen: ${Math.round(tts.volume * 100)}%`}
          />
          <Volume2 className="w-3 h-3 text-white/30 flex-shrink-0" />
          <span className="text-white/30 text-xs tabular-nums">{Math.round(tts.volume * 100)}%</span>
        </div>
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
      <div className="fixed inset-0 z-0" style={{ background: "#070b14" }} />
      {image && (
        <div className="fixed inset-0 z-0 opacity-10"
          style={{ backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center", filter: "blur(40px) saturate(1.5)" }} />
      )}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="grid-overlay" />
      <div className="noise-overlay" />
    </>
  );
}

// ─── Navigation Menu ──────────────────────────────────────────────────────────
function NavMenu({
  currentStep,
  maxVisitedStep,
  onNavigate,
  answers,
}: {
  currentStep: number;
  maxVisitedStep: number;
  onNavigate: (step: number) => void;
  answers: Answers;
}) {
  const [open, setOpen] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const isAnswered = (step: number) => {
    if (step === 2) return answers.interaction1.length === 2;
    if (step === 4) return answers.interaction2.length === 3;
    if (step === 6) return !!answers.interaction3;
    if (step === 8) return !!answers.interaction4Opinion;
    if (step === 10) return answers.interaction5.length > 0;
    return step <= maxVisitedStep;
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: "linear-gradient(135deg, #003087, #00a651)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 8px 32px rgba(0,48,135,0.5)",
        }}
        title="Menú de navegación"
      >
        {open ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: "300px",
          background: "rgba(10,16,30,0.97)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          boxShadow: open ? "-8px 0 40px rgba(0,0,0,0.6)" : "none",
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div>
            <p className="text-white font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Navegación</p>
            <p className="text-white/40 text-xs mt-0.5">Universidad 2040</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps list */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {STEP_META.map(({ step, label, icon: Icon, type }) => {
            const visited = step <= maxVisitedStep;
            const current = step === currentStep;
            const answered = isAnswered(step);
            const canNav = visited;

            return (
              <button
                key={step}
                onClick={() => { if (canNav) { onNavigate(step); setOpen(false); } }}
                disabled={!canNav}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-left transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: current
                    ? "linear-gradient(135deg, rgba(0,48,135,0.4), rgba(0,166,81,0.15))"
                    : "transparent",
                  border: current
                    ? "1px solid rgba(0,166,81,0.3)"
                    : "1px solid transparent",
                }}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: current
                      ? "rgba(0,166,81,0.2)"
                      : answered && visited
                        ? "rgba(0,166,81,0.1)"
                        : "rgba(255,255,255,0.05)",
                  }}>
                  {answered && visited && !current
                    ? <CheckCircle2 className="w-4 h-4" style={{ color: "#00a651" }} />
                    : <Icon className="w-4 h-4" style={{ color: current ? "#00a651" : "rgba(255,255,255,0.4)" }} />
                  }
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{
                    color: current ? "#ffffff" : visited ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                  }}>
                    {label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {type === "interaction" ? "Pregunta" : "Narración"} · Paso {step}
                  </p>
                </div>

                {/* Current indicator */}
                {current && <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#00a651" }} />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t space-y-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button onClick={() => { setShowAbout(true); setOpen(false); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
            style={{ background: "rgba(0,48,135,0.15)", border: "1px solid rgba(0,48,135,0.3)", color: "rgba(255,255,255,0.6)" }}>
            <BookOpen className="w-3.5 h-3.5" />
            Acerca de esta cápsula
          </button>
          <p className="text-white/25 text-xs text-center">Podés volver a cualquier paso visitado</p>
        </div>
      </div>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function OrtHeader({
  step, total, onBack,
}: {
  step: number; total: number; onBack?: () => void;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="fixed top-0 left-0 right-0 z-50" style={{
      background: "rgba(7,11,20,0.85)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div className="flex items-center justify-between px-5 py-3 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          {onBack && step > 1 && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
              }}
              title="Volver al paso anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Volver</span>
            </button>
          )}
          <img src={ORT_LOGO} alt="ORT Argentina" className="h-9 object-contain" />
        </div>
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

// ─── About Modal ─────────────────────────────────────────────────────────────────
function AboutModal({ onClose }: { onClose: () => void }) {
  const tts = useTTS();
  const aboutText = "Esta cápsula interactiva fue diseñada por la Universidad ORT Argentina como parte de un proceso de reflexión colectiva sobre el futuro de la educación superior. A través de cinco escenas narrativas y cinco interacciones, te invitamos a pensar qué tipo de universidad necesita el mundo de 2040, qué habilidades van a ser clave, y cómo debería transformarse la formación universitaria para estar a la altura de los desafíos globales. Tus respuestas son anónimas y serán analizadas para construir un diagnóstico institucional. Gracias por ser parte de este proceso.";

  useEffect(() => {
    const t = setTimeout(() => tts.speak(aboutText, 12), 600);
    return () => { clearTimeout(t); tts.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
      onClick={e => { if (e.target === e.currentTarget) { tts.stop(); onClose(); } }}>
      <AnimatedStep stepKey={200}>
        <div className="w-full max-w-lg hero-card overflow-hidden">
          {/* Header */}
          <div className="px-7 pt-8 pb-6 text-center" style={{
            background: "linear-gradient(160deg, rgba(0,48,135,0.4) 0%, rgba(0,166,81,0.08) 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <div className="relative inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 float-anim"
              style={{ background: "linear-gradient(135deg, rgba(0,48,135,0.6), rgba(0,166,81,0.3))", border: "1px solid rgba(0,166,81,0.3)", boxShadow: "0 8px 32px rgba(0,48,135,0.4)" }}>
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="ort-badge mb-2">Acerca de esta cápsula</div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>Universidad 2040</h2>
            <p className="text-white/45 text-sm mt-1">Cápsula Interactiva · ORT Argentina</p>
          </div>
          {/* Body */}
          <div className="px-7 py-7">
            <VoiceButton text={aboutText} tts={tts} audioIndex={12} />
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              Esta cápsula interactiva fue diseñada por la <strong className="text-white">Universidad ORT Argentina</strong> como parte de un proceso de reflexión colectiva sobre el futuro de la educación superior.
            </p>
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              A través de <strong className="text-white">cinco escenas narrativas</strong> y <strong className="text-white">cinco interacciones</strong>, te invitamos a pensar qué tipo de universidad necesita el mundo de 2040, qué habilidades van a ser clave, y cómo debería transformarse la formación universitaria para estar a la altura de los desafíos globales.
            </p>
            <div className="rounded-xl px-5 py-4 mb-5" style={{ background: "rgba(0,166,81,0.08)", border: "1px solid rgba(0,166,81,0.2)" }}>
              <p className="text-white/60 text-xs leading-relaxed">
                🔒 <strong className="text-white/80">Tus respuestas son anónimas</strong> y serán analizadas para construir un diagnóstico institucional. Gracias por ser parte de este proceso.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <img src={ORT_LOGO} alt="ORT Argentina" className="h-8 object-contain opacity-50" />
              <button onClick={() => { tts.stop(); onClose(); }}
                className="ort-btn-primary" style={{ fontSize: "0.875rem", padding: "10px 20px" }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </AnimatedStep>
    </div>
  );
}

// ─── Access Screen ─────────────────────────────────────────────────────────────────
function AccessScreen({ onAccess }: { onAccess: (sessionId: string, name: string) => void }) {
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showAbout, setShowAbout] = useState(false);
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
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#020d1a" }}>
      {/* Dot grid background */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage: "radial-gradient(circle, rgba(0,166,255,0.18) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }} />
      {/* Radial glow center */}
      <div className="absolute inset-0 z-0" style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 40%, rgba(0,80,200,0.22) 0%, rgba(0,166,81,0.08) 60%, transparent 100%)",
      }} />
      {/* Floating particles */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="absolute rounded-full float-anim" style={{
            width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
            background: i % 2 === 0 ? "rgba(0,166,255,0.5)" : "rgba(0,166,81,0.4)",
            left: `${8 + i * 7.5}%`, top: `${10 + (i * 13) % 80}%`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}
      </div>
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <img src={ORT_LOGO} alt="ORT Argentina" className="h-16 object-contain mb-8" />
        {/* Card */}
        <AnimatedStep stepKey={0}>
          <div className="w-full max-w-sm">
            <div className="rounded-2xl overflow-hidden" style={{
              background: "rgba(8,20,40,0.82)",
              border: "1px solid rgba(0,120,255,0.25)",
              boxShadow: "0 0 60px rgba(0,80,200,0.25), 0 2px 40px rgba(0,0,0,0.6)",
              backdropFilter: "blur(20px)",
            }}>
              <div className="px-8 pt-8 pb-6">
                {/* Badge */}
                <div className="flex justify-center mb-6">
                  <span className="px-5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
                    style={{ background: "rgba(0,166,81,0.9)", color: "#fff", letterSpacing: "0.12em" }}>
                    EXPERIENCIA EXCLUSIVA
                  </span>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Nombre y Apellido</label>
                    <input type="text" placeholder="Ingresa tu nombre" value={name}
                      onChange={e => { setName(e.target.value); setError(""); }}
                      onKeyDown={handleNameKeyDown}
                      className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                      style={{
                        background: "rgba(0,20,50,0.7)",
                        border: "1.5px solid rgba(0,180,255,0.5)",
                        boxShadow: "0 0 12px rgba(0,150,255,0.15)",
                      }}
                      onFocus={e => { e.target.style.border = "1.5px solid rgba(0,220,255,0.9)"; e.target.style.boxShadow = "0 0 20px rgba(0,180,255,0.35)"; }}
                      onBlur={e => { e.target.style.border = "1.5px solid rgba(0,180,255,0.5)"; e.target.style.boxShadow = "0 0 12px rgba(0,150,255,0.15)"; }}
                    />
                  </div>
                  {!isAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Contraseña</label>
                      <input type="password" placeholder="Ingresa tu contraseña" value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                        style={{
                          background: "rgba(0,20,50,0.7)",
                          border: "1.5px solid rgba(0,180,255,0.5)",
                          boxShadow: "0 0 12px rgba(0,150,255,0.15)",
                        }}
                        onFocus={e => { e.target.style.border = "1.5px solid rgba(0,220,255,0.9)"; e.target.style.boxShadow = "0 0 20px rgba(0,180,255,0.35)"; }}
                        onBlur={e => { e.target.style.border = "1.5px solid rgba(0,180,255,0.5)"; e.target.style.boxShadow = "0 0 12px rgba(0,150,255,0.15)"; }}
                      />
                    </div>
                  )}
                  {isAdmin && (
                    <div className="rounded-xl px-4 py-3 text-sm font-semibold text-center"
                      style={{ background: "rgba(0,166,81,0.1)", border: "1px solid rgba(0,166,81,0.3)", color: "#00a651" }}>
                      ✓ Acceso admin detectado
                    </div>
                  )}
                  {error && (
                    <div className="rounded-xl px-4 py-3 text-sm"
                      style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}>
                      {error}
                    </div>
                  )}
                  <button type="submit" disabled={verify.isPending}
                    className="w-full py-3.5 rounded-xl font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: verify.isPending ? "rgba(0,80,200,0.5)" : "linear-gradient(90deg, #1a56ff 0%, #0a3fd4 100%)",
                      color: "#fff",
                      boxShadow: "0 4px 24px rgba(0,80,200,0.4)",
                      letterSpacing: "0.1em",
                    }}>
                    {verify.isPending ? "VERIFICANDO..." : "ACCEDER"}
                  </button>
                </form>
                <p className="mt-5 text-white/30 text-xs text-center">© 2024 ORT Argentina. All rights reserved.</p>
                <p className="text-white/25 text-xs text-center mt-0.5">Duración estimada: 20 minutos.</p>
                <button type="button" onClick={() => setShowAbout(true)}
                  className="mt-4 w-full text-white/30 hover:text-white/60 text-xs text-center transition-colors duration-200 flex items-center justify-center gap-1.5">
                  <BookOpen className="w-3 h-3" />
                  <span>Acerca de esta cápsula</span>
                </button>
              </div>
            </div>
          </div>
        </AnimatedStep>
      </div>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}

// ─── Scene Wrapper ────────────────────────────────────────────────────────────
function SceneWrapper({
  image, children, step, onBack, maxVisitedStep, onNavigate, answers,
}: {
  image: string; children: React.ReactNode; step: number;
  onBack: () => void; maxVisitedStep: number;
  onNavigate: (s: number) => void; answers: Answers;
}) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <BackgroundFX image={image} />
      <OrtHeader step={step} total={TOTAL_STEPS - 1} onBack={onBack} />

      <div className="relative z-10 flex-1 flex flex-col lg:flex-row pt-16">
        <div className="lg:w-2/5 h-52 lg:h-auto relative flex-shrink-0 overflow-hidden">
          <img src={image} alt="" className="w-full h-full object-cover"
            style={{ filter: "saturate(1.2) brightness(0.85)" }} />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(7,11,20,0.3) 0%, transparent 30%, transparent 60%, rgba(7,11,20,0.7) 100%)" }} />
          <div className="absolute inset-0 hidden lg:block"
            style={{ background: "linear-gradient(to right, transparent 60%, rgba(7,11,20,0.95) 100%)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-20 lg:hidden"
            style={{ background: "linear-gradient(to top, rgba(7,11,20,1), transparent)" }} />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:px-14">
          <AnimatedStep stepKey={step}>
            <div className="w-full max-w-xl">
              {children}
            </div>
          </AnimatedStep>
        </div>
      </div>

      {/* Navigation Menu */}
      <NavMenu currentStep={step} maxVisitedStep={maxVisitedStep} onNavigate={onNavigate} answers={answers} />
    </div>
  );
}

// ─── Narration Block ─────────────────────────────────────────────────────────────────
function Narration({ title, text, tts, audioIndex }: { title: string; text: string; tts: ReturnType<typeof useTTS>; audioIndex?: number }) {
  useEffect(() => {
    const t = setTimeout(() => tts.speak(`${title}. ${text}`, audioIndex), 900);
    return () => { clearTimeout(t); tts.stop(); };
  }, [title, text]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mb-8">
      <VoiceButton text={`${title}. ${text}`} tts={tts} audioIndex={audioIndex} showVolume={true} /><div className="accent-line mb-5" />
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 glow-text"
        style={{ fontFamily: "'Syne', sans-serif", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      <p className="text-white/65 text-base leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Interaction Header ─────────────────────────────────────────────────────────────────
function InteractionHeader({ num, question, subtitle, tts, audioIndex }: {
  num: string; question: string; subtitle?: string; tts: ReturnType<typeof useTTS>; audioIndex?: number;
}) {
  const fullText = subtitle ? `${question}. ${subtitle}` : question;
  useEffect(() => {
    const t = setTimeout(() => tts.speak(fullText, audioIndex), 900);
    return () => { clearTimeout(t); tts.stop(); };
  }, [question]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mb-7">
      <div className="ort-badge mb-4 inline-block">{num}</div>
      <VoiceButton text={fullText} tts={tts} audioIndex={audioIndex} showVolume={true} /> <div className="accent-line mb-5" />
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
    <button onClick={onClick} className={`option-card w-full text-left px-5 py-4 ${selected ? "selected" : ""}`}>
      <div className="flex items-center gap-3 relative z-10">
        <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200"
          style={{ borderColor: selected ? "#003087" : "rgba(255,255,255,0.2)", background: selected ? "#003087" : "transparent" }}>
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
    <button onClick={onChange} disabled={disabled && !checked}
      className={`option-card w-full text-left px-4 py-3.5 disabled:opacity-30 disabled:cursor-not-allowed ${checked ? "selected-green" : ""}`}>
      <div className="flex items-center gap-3 relative z-10">
        <span className="flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200"
          style={{ borderColor: checked ? "#00a651" : "rgba(255,255,255,0.2)", background: checked ? "#00a651" : "transparent" }}>
          {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </span>
        <span className="font-semibold text-sm" style={{ color: checked ? "#ffffff" : "rgba(255,255,255,0.75)" }}>{label}</span>
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
        <div key={item} draggable onDragStart={() => onDragStart(i)} onDragEnter={() => onDragEnter(i)}
          onDragOver={e => e.preventDefault()} onDragEnd={onDragEnd}
          className={`drag-item flex items-center gap-3 px-4 py-3.5 ${dragOver === i ? "drag-over" : ""}`}>
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
function ContinueBtn({ disabled = false, label = "Continuar", onClick, loading = false }: {
  disabled?: boolean; label?: string; onClick: () => void; loading?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className="ort-btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed mt-7"
      style={{ fontSize: "0.95rem" }}>
      {loading ? "Guardando..." : label}
      {!loading && <ChevronRight className="w-4 h-4" />}
    </button>
  );
}

// ─── Summary Section ─────────────────────────────────────────────────────────
function SummarySection({ answers }: { answers: Answers }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full mt-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300"
        style={{
          background: open ? "rgba(0,48,135,0.25)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${open ? "rgba(0,166,81,0.35)" : "rgba(255,255,255,0.08)"}`,
        }}
      >
        <div className="flex items-center gap-2.5">
          <List className="w-4 h-4" style={{ color: "#00a651" }} />
          <span className="text-sm font-semibold text-white/80">Ver resumen de mis respuestas</span>
        </div>
        <ChevronRight
          className="w-4 h-4 text-white/40 transition-transform duration-300"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <div className="hero-card px-5 py-4">
            <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">Cambios que más impactarán en las profesiones</p>
            <div className="flex flex-wrap gap-2">
              {answers.interaction1.length > 0
                ? answers.interaction1.map(v => (
                    <span key={v} className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(0,48,135,0.3)", border: "1px solid rgba(0,48,135,0.5)", color: "#a0b8ff" }}>{v}</span>
                  ))
                : <span className="text-white/30 text-xs">Sin respuesta</span>}
            </div>
          </div>
          <div className="hero-card px-5 py-4">
            <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">Elementos clave de tu universidad ideal</p>
            <div className="flex flex-wrap gap-2">
              {answers.interaction2.length > 0
                ? answers.interaction2.map(v => (
                    <span key={v} className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ background: "rgba(0,166,81,0.15)", border: "1px solid rgba(0,166,81,0.35)", color: "#6ee7b7" }}>{v}</span>
                  ))
                : <span className="text-white/30 text-xs">Sin respuesta</span>}
            </div>
          </div>
          <div className="hero-card px-5 py-4">
            <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">Habilidad más importante para el futuro</p>
            {answers.interaction3
              ? <span className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
                  {answers.interaction3}
                </span>
              : <span className="text-white/30 text-xs">Sin respuesta</span>}
          </div>
          <div className="hero-card px-5 py-4">
            <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-2">Preparación del modelo universitario actual</p>
            {answers.interaction4Opinion ? (
              <>
                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(251,146,60,0.15)", border: "1px solid rgba(251,146,60,0.35)", color: "#fdba74" }}>
                  {answers.interaction4Opinion}
                </span>
                {answers.interaction4Text && (
                  <p className="text-white/50 text-xs mt-2 leading-relaxed italic">"{answers.interaction4Text}"</p>
                )}
              </>
            ) : <span className="text-white/30 text-xs">Sin respuesta</span>}
          </div>
          <div className="hero-card px-5 py-4">
            <p className="text-xs font-semibold text-white/35 uppercase tracking-widest mb-3">Tu ranking de prioridades</p>
            <div className="space-y-1.5">
              {answers.interaction5.map((item, i) => (
                <div key={item} className="flex items-center gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: i === 0 ? "rgba(0,166,81,0.3)" : i === 1 ? "rgba(0,48,135,0.3)" : "rgba(255,255,255,0.06)",
                      border: i === 0 ? "1px solid rgba(0,166,81,0.5)" : i === 1 ? "1px solid rgba(0,48,135,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      color: i === 0 ? "#6ee7b7" : i === 1 ? "#a0b8ff" : "rgba(255,255,255,0.4)",
                    }}>{i + 1}</span>
                  <span className="text-xs font-medium" style={{ color: i < 3 ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.45)" }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Final Screen ─────────────────────────────────────────────────────────────
function FinalScreen({ name, answers }: { name: string; answers: Answers }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <BackgroundFX image={SCENE_IMAGES.scene5} />
      {/* Confetti overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="confetti-pop absolute rounded-sm" style={{
            width: `${6 + (i % 4) * 2}px`, height: `${6 + (i % 3) * 2}px`,
            background: ["#00a651","#003087","#4f8ef7","#f59e0b","#e11d48","#06b6d4"][i % 6],
            left: `${(i * 3.4) % 100}%`, top: `${(i * 7.1) % 60}%`,
            opacity: 0.7, animationDelay: `${i * 0.12}s`,
            transform: `rotate(${i * 23}deg)`,
          }} />
        ))}
      </div>
      {/* Header */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(7,11,20,0.6)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <img src={ORT_LOGO} alt="ORT Argentina" className="h-9 object-contain" />
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Universidad 2040</span>
          <div className="ort-progress-bar w-28">
            <div className="ort-progress-fill" style={{ width: "100%" }} />
          </div>
          <span className="text-white/70 text-xs font-bold">100%</span>
        </div>
      </div>
      {/* Body */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <AnimatedStep stepKey={99}>
          <div className="max-w-2xl w-full text-center">
            <h1 className="font-bold text-white mb-4 glow-text"
              style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.1 }}>
              ¡Gracias{name ? `, ${name}` : ""}!
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-2">
              Completaste la cápsula interactiva Universidad 2040.
            </p>
            <p className="text-white/45 text-base leading-relaxed mb-8">
              Tus respuestas son valiosas.
            </p>
            <SummarySection answers={answers} />
            <div className="mt-10">
              <img src={ORT_LOGO} alt="ORT Argentina" className="h-12 object-contain mx-auto opacity-50" />
            </div>
          </div>
        </AnimatedStep>
      </div>
    </div>
  );
}

// ─── Main Capsule ─────────────────────────────────────────────────────────────
export default function Capsule() {
  const [step, setStep] = useState(0);
  const [maxVisitedStep, setMaxVisitedStep] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState("");
  const [answers, setAnswers] = useState<Answers>({
    interaction1: [],
    interaction2: [],
    interaction3: "",
    interaction4Opinion: "",
    interaction4Text: "",
    interaction5: [
      "Tecnología avanzada",
      "Pensamiento crítico",
      "Aprendizaje práctico",
      "Emprender",
      "Innovar",
      "Experiencia internacional",
      "Trabajo interdisciplinario",
      "Ética y responsabilidad social",
      "Aprendizaje permanente",
    ],
  });

  const tts = useTTS();
  const saveResponse = trpc.capsule.saveResponse.useMutation();
  const complete = trpc.capsule.complete.useMutation();
  const saveContact = trpc.admin.saveContactInterest.useMutation();
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });

  const handleAccess = useCallback((sid: string, name: string) => {
    setSessionId(sid);
    setStudentName(name);
    setStep(1);
    setMaxVisitedStep(1);
  }, []);

  const goToStep = useCallback((targetStep: number) => {
    tts.stop();
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [tts]);

  const next = useCallback(async () => {
    if (!sessionId) return;
    tts.stop();
    await saveResponse.mutateAsync({ sessionId, ...answers }).catch(() => {});
    const nextStep = step + 1;
    setStep(nextStep);
    setMaxVisitedStep(prev => Math.max(prev, nextStep));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sessionId, answers, saveResponse, tts, step]);

  const goBack = useCallback(() => {
    if (step <= 1) return;
    tts.stop();
    const prevStep = step - 1;
    setStep(prevStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, tts]);

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

  const navProps = { onBack: goBack, maxVisitedStep, onNavigate: goToStep, answers };

  if (step === 0) return <AccessScreen onAccess={handleAccess} />;
  if (step >= TOTAL_STEPS) return <FinalScreen name={studentName} answers={answers} />;

  return (
    <>
      {step === 1 && (
        <SceneWrapper image={SCENE_IMAGES.scene1} step={step} {...navProps}>
          <Narration tts={tts} audioIndex={1} title="El mundo que viene"
            text="Pensá en el año 2040. La inteligencia artificial ya no es una promesa: es parte de cada trabajo, cada decisión, cada proceso. Las economías se reorganizaron. El cambio climático exige respuestas urgentes. Y el conocimiento ya no vive en un aula, sino en redes globales. En este contexto, hay una pregunta que no podemos ignorar: ¿Cómo tiene que formarse el profesional del futuro?" />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 2 && (
        <SceneWrapper image={SCENE_IMAGES.scene1} step={step} {...navProps}>
          <InteractionHeader tts={tts} audioIndex={7} num="Interacción 1 de 5"
            question="¿Cuáles de estos cambios creés que impactarán más en las profesiones?"
            subtitle="Seleccioná dos opciones. No hay respuesta correcta: buscamos reflexión." />
          <div className="space-y-3">
            {["Inteligencia artificial", "Cambio climático", "Ciencia de datos", "Robótica y automatización"].map(opt => (
              <CheckboxCard key={opt} label={opt}
                checked={answers.interaction1.includes(opt)}
                disabled={answers.interaction1.length >= 2 && !answers.interaction1.includes(opt)}
                onChange={() => {
                  const cur = answers.interaction1;
                  updateAnswer("interaction1", cur.includes(opt) ? cur.filter((x: string) => x !== opt) : [...cur, opt]);
                }} />
            ))}
          </div>
          <p className="text-white/35 text-xs mt-3 font-medium">{answers.interaction1.length}/2 seleccionados</p>
          <ContinueBtn disabled={answers.interaction1.length !== 2} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 3 && (
        <SceneWrapper image={SCENE_IMAGES.scene2} step={step} {...navProps}>
          <Narration tts={tts} audioIndex={2} title="La universidad del futuro"
            text="Las universidades también tuvieron que reinventarse. Ya no alcanzaba con dar clases y tomar exámenes. Las nuevas generaciones necesitaban aprender a resolver problemas reales, trabajar con gente de distintas disciplinas, y adaptarse a un mundo que cambia todo el tiempo. Entonces aparece la pregunta clave: ¿Cómo tenía que ser una universidad preparada para este mundo?" />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 4 && (
        <SceneWrapper image={SCENE_IMAGES.scene2} step={step} {...navProps}>
          <InteractionHeader tts={tts} audioIndex={8} num="Interacción 2 de 5"
            question="Si diseñaras tu universidad ideal, ¿qué tres elementos no podrían faltar?"
            subtitle="Elegí exactamente 3 opciones." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {["Proyectos interdisciplinarios","Prácticas en empresas reales","Investigación aplicada","Intercambio internacional","Observatorio de innovación","Mentorías con profesionales","Programas de emprendimiento","Acceso a cursos y experiencias virtuales globales"].map(opt => (
              <CheckboxCard key={opt} label={opt}
                checked={answers.interaction2.includes(opt)}
                disabled={answers.interaction2.length >= 3}
                onChange={() => {
                  const cur = answers.interaction2;
                  updateAnswer("interaction2", cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt]);
                }} />
            ))}
          </div>
          <p className="text-white/35 text-xs mt-3 font-medium">{answers.interaction2.length}/3 seleccionados</p>
          <ContinueBtn disabled={answers.interaction2.length !== 3} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 5 && (
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step} {...navProps}>
          <Narration tts={tts} audioIndex={3} title="El profesional que necesita el mundo"
            text="Muchos de los trabajos que van a existir en 2040 todavía no tienen nombre. Pero las habilidades para enfrentarlos sí se pueden desarrollar hoy. La pregunta ya no es solo qué sabés hacer, sino cómo pensás, cómo te arreglás con lo que no conocés, y cómo trabajas con otros para resolver lo que nadie resolvió antes." />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 6 && (
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step} {...navProps}>
          <InteractionHeader tts={tts} audioIndex={9} num="Interacción 3 de 5"
            question="¿Cuál creés que es la habilidad más importante para el profesional del futuro?"
            subtitle="Elegí la que te parece más relevante." />
          <div className="space-y-3">
            {["Resolver problemas complejos","Adaptarse a cambios rápidos","Trabajar con tecnología avanzada","Colaborar con personas diversas"].map(opt => (
              <OptionCard key={opt} label={opt} selected={answers.interaction3 === opt} onClick={() => updateAnswer("interaction3", opt)} />
            ))}
          </div>
          <ContinueBtn disabled={!answers.interaction3} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 7 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step} {...navProps}>
          <Narration tts={tts} audioIndex={4} title="Un posible modelo de universidad"
            text="En distintas partes del mundo ya existen universidades que están respondiendo a estos desafíos. Integran tecnología, trabajan con proyectos reales, conectan a sus estudiantes con el mundo y los forman en valores. La pregunta que nos hacemos es: ¿el modelo universitario actual está listo para lo que viene?" />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 8 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step} {...navProps}>
          <InteractionHeader tts={tts} audioIndex={10} num="Interacción 4 de 5"
            question="¿Creés que el modelo universitario actual está preparado para el mundo de 2040?"
            subtitle="Compartí también tu opinión en el campo de texto." />
          <div className="space-y-3 mb-5">
            {["Sí, está bien encaminado","Parcialmente, necesita cambios","No, requiere una transformación profunda"].map(opt => (
              <OptionCard key={opt} label={opt} selected={answers.interaction4Opinion === opt} onClick={() => updateAnswer("interaction4Opinion", opt)} />
            ))}
          </div>
          <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">Tu opinión (opcional)</label>
          <textarea value={answers.interaction4Text} onChange={e => updateAnswer("interaction4Text", e.target.value)}
            placeholder="¿Qué cambiarías o agregarías?" rows={3} className="ort-input resize-none" style={{ height: "auto" }} />
          <ContinueBtn disabled={!answers.interaction4Opinion} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 9 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step} {...navProps}>
          <Narration tts={tts} audioIndex={5} title="Priorizar lo importante"
            text="Llegamos a la última parte. Si vos pudieras diseñar la universidad ideal para 2040, ¿qué pondrías primero? A continuación vas a poder ordenar estos elementos según lo que te parece más importante. No hay respuestas correctas, solo tu visión." />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 10 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step} {...navProps}>
          <InteractionHeader tts={tts} audioIndex={11} num="Interacción 5 de 5"
            question="Ranking de prioridades"
            subtitle="Arrastrá los elementos para ordenarlos de más a menos importante." />
          <RankingList items={answers.interaction5} onChange={items => updateAnswer("interaction5", items)} />
          <ContinueBtn onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 11 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step} {...navProps}>
          <Narration tts={tts} audioIndex={6} title="La universidad del futuro empieza hoy"
            text="Los desafíos globales están cambiando la educación superior de raíz. Las universidades que quieran formar profesionales de verdad van a tener que repensar cómo enseñan, qué enseñan, y cómo se conectan con el mundo real. Gracias por compartir tu visión. Tus respuestas van a ser parte de ese proceso." />
          <ContinueBtn
            label={complete.isPending ? "Guardando respuestas..." : "Continuar"}
            onClick={next} disabled={complete.isPending} loading={complete.isPending} />
        </SceneWrapper>
      )}

      {step === 12 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step} {...navProps}>
          <div className="mb-8">
            <VoiceButton text="Antes de cerrar, queremos preguntarte algo. ¿Te gustaría participar en un encuentro presencial para seguir conversando sobre estos temas? Sería un espacio de diálogo abierto, junto a docentes, estudiantes y referentes del mundo profesional. Si tu respuesta es sí, dejanos tus datos de contacto y te avisamos cuando lo organicemos." tts={tts} audioIndex={13} showVolume={true} />
            <div className="accent-line mb-5" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 glow-text"
              style={{ fontFamily: "'Syne', sans-serif", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              ¿Te gustaría sumarte a un encuentro presencial?
            </h2>
            <p className="text-white/65 text-base leading-relaxed">
              Organizamos espacios de diálogo abierto sobre el futuro de la educación, con docentes, estudiantes y referentes del mundo profesional. ¿Querés que te avisemos?
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => { tts.stop(); setStep(13); setMaxVisitedStep(prev => Math.max(prev, 13)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="ort-btn-primary flex-1 text-center"
              style={{ fontSize: "1rem", padding: "15px 28px" }}>
              Sí, me interesa →
            </button>
            <button
              onClick={handleComplete}
              disabled={complete.isPending}
              className="flex-1 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50"
              style={{ fontSize: "1rem", padding: "15px 28px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}>
              {complete.isPending ? "Guardando..." : "No, gracias"}
            </button>
          </div>
        </SceneWrapper>
      )}

      {step === 13 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step} {...navProps}>
          <div className="mb-8">
            <div className="accent-line mb-5" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 glow-text"
              style={{ fontFamily: "'Syne', sans-serif", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Dejanos tus datos
            </h2>
            <p className="text-white/65 text-base leading-relaxed">
              Te vamos a avisar cuando organicemos el próximo encuentro. Todos los campos son opcionales.
            </p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">Nombre completo</label>
              <input type="text" placeholder={studentName || "Tu nombre"} value={contactForm.name}
                onChange={e => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                className="ort-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">Email</label>
              <input type="email" placeholder="tu@email.com" value={contactForm.email}
                onChange={e => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                className="ort-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">Teléfono (opcional)</label>
              <input type="tel" placeholder="+54 11 ..." value={contactForm.phone}
                onChange={e => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                className="ort-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-2 uppercase tracking-widest">¿Algo más que quieras agregar? (opcional)</label>
              <textarea placeholder="Tu mensaje..." value={contactForm.message} rows={3}
                onChange={e => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                className="ort-input resize-none" style={{ height: "auto" }} />
            </div>
          </div>
          <ContinueBtn
            label={complete.isPending || saveContact.isPending ? "Guardando..." : "Enviar y finalizar →"}
            disabled={complete.isPending || saveContact.isPending}
            loading={complete.isPending || saveContact.isPending}
            onClick={async () => {
              if (!sessionId) return;
              tts.stop();
              try {
                if (contactForm.email || contactForm.name || contactForm.phone || contactForm.message) {
                  await saveContact.mutateAsync({
                    sessionId,
                    studentName: contactForm.name || studentName || undefined,
                    email: contactForm.email || undefined,
                    phone: contactForm.phone || undefined,
                    message: contactForm.message || undefined,
                  });
                }
                await complete.mutateAsync({ sessionId, studentName, ...answers });
                setStep(TOTAL_STEPS);
                window.scrollTo({ top: 0, behavior: "smooth" });
              } catch {
                toast.error("Error al guardar. Por favor, intentá de nuevo.");
              }
            }}
          />
        </SceneWrapper>
      )}
    </>
  );
}
