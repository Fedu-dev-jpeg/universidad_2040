import { useState, useEffect, useCallback, useRef } from "react";
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

const TOTAL_STEPS = 16;

// ─── Step metadata for navigation menu ───────────────────────────────────────
const STEP_META = [
  { step: 1,  label: "El mundo que viene",              icon: BookOpen,      type: "scene" },
  { step: 2,  label: "Impacto en profesiones",           icon: MessageSquare, type: "interaction" },
  { step: 3,  label: "La universidad del futuro",        icon: BookOpen,      type: "scene" },
  { step: 4,  label: "Diseñá tu universidad",            icon: Star,          type: "interaction" },
  { step: 5,  label: "El profesional del futuro",        icon: BookOpen,      type: "scene" },
  { step: 6,  label: "Habilidad más importante",         icon: MessageSquare, type: "interaction" },
  { step: 7,  label: "Habilidades socioemocionales",     icon: MessageSquare, type: "interaction" },
  { step: 8,  label: "Un posible modelo",                icon: BookOpen,      type: "scene" },
  { step: 9,  label: "¿Está preparada la uni?",          icon: ThumbsUp,      type: "interaction" },
  { step: 10, label: "Priorizar lo importante",          icon: BookOpen,      type: "scene" },
  { step: 11, label: "Habilidades urgentes hoy",         icon: List,          type: "interaction" },
  { step: 12, label: "Capacidades para 2040",            icon: List,          type: "interaction" },
  { step: 13, label: "Enviar respuestas",                icon: CheckCircle2,  type: "scene" },
  { step: 14, label: "Encuentro presencial",             icon: Sparkles,      type: "scene" },
];

interface Answers {
  interaction1: string[];
  interaction2: string[];
  interaction3: string;
  interactionSocio: string[];
  interaction4Opinion: string;
  interaction4Text: string;
  interaction5: string[];
  interaction5b: string[];
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
    <div className="inline-flex items-center gap-2 mb-4 rounded-full px-2 py-1.5" style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
    }}>
      {/* Play/Stop button */}
      <button onClick={() => tts.speaking ? tts.stop() : tts.speak(text, audioIndex)}
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
        style={{
          background: tts.speaking ? "rgba(0,200,120,0.2)" : "rgba(0,200,200,0.15)",
          border: `1px solid ${tts.speaking ? "rgba(0,200,120,0.4)" : "rgba(0,200,200,0.3)"}`,
        }}>
        {tts.speaking ? <Pause className="w-3.5 h-3.5 text-emerald-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
      </button>
      {/* Volume icon + slider */}
      {showVolume && (
        <div className="flex items-center gap-1.5">
          <button onClick={() => tts.setVolume(tts.volume > 0 ? 0 : 0.85)} className="text-white/40 hover:text-white/70 transition-colors">
            {tts.volume > 0 ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range" min={0} max={1} step={0.05}
            value={tts.volume}
            onChange={e => tts.setVolume(Number(e.target.value))}
            className="volume-slider"
            style={{ width: "80px" }}
            title={`Volumen: ${Math.round(tts.volume * 100)}%`}
          />
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
    if (step === 7) return answers.interactionSocio.length > 0;
    if (step === 9) return !!answers.interaction4Opinion;
    if (step === 11) return answers.interaction5.length > 0;
    if (step === 12) return answers.interaction5b.length > 0;
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
        <div className="flex items-center justify-between px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(false)} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-xs font-semibold">
              <X className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          </div>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_white_aefdc03d.png" alt="ORT" className="h-7 object-contain" />
        </div>
        {/* Title */}
        <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <p className="text-white font-bold text-base" style={{ fontFamily: "'Syne', sans-serif" }}>Universidad 2040</p>
        </div>

        {/* Steps list */}
        <div className="flex-1 overflow-y-auto py-2 px-3">
          {STEP_META.map(({ step, label }) => {
            const visited = step <= maxVisitedStep;
            const current = step === currentStep;
            const answered = isAnswered(step);
            const canNav = visited;

            return (
              <button
                key={step}
                onClick={() => { if (canNav) { onNavigate(step); setOpen(false); } }}
                disabled={!canNav}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-left transition-all duration-200 disabled:cursor-not-allowed"
                style={{
                  background: current
                    ? "rgba(0,200,120,0.08)"
                    : "transparent",
                  border: current
                    ? "1.5px solid rgba(0,200,120,0.55)"
                    : "1.5px solid transparent",
                  opacity: canNav ? 1 : 0.5,
                  boxShadow: current ? "0 0 16px rgba(0,200,120,0.15)" : "none",
                }}
              >
                {/* Status icon: checkmark for answered, lock for unavailable */}
                {answered && visited && !current ? (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(0,200,120,0.15)", border: "1px solid rgba(0,200,120,0.4)" }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: "#00e87a" }} />
                  </div>
                ) : !canNav ? (
                  <div className="flex-shrink-0 w-7 h-7" />
                ) : null}

                {/* Label: "N. Label" format */}
                <p className="flex-1 text-sm font-semibold truncate" style={{
                  color: current ? "#ffffff" : visited ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.4)",
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                }}>
                  {step}. {label}
                </p>

                {/* Lock icon for unavailable steps */}
                {!canNav && (
                  <span className="flex-shrink-0 text-white/25" style={{ fontSize: "0.85rem" }}>🔒</span>
                )}
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
        {/* Left: ORT logo */}
        <div className="flex items-center gap-3">
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_white_aefdc03d.png" alt="ORT Argentina" className="h-9 object-contain" />
        </div>
        {/* Center: progress bar */}
        <div className="flex items-center gap-3">
          <span className="text-white/40 text-xs font-medium hidden sm:block tracking-widest uppercase">Universidad 2040</span>
          <div className="ort-progress-bar w-28 sm:w-40">
            <div className="ort-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-white/70 text-xs font-bold tabular-nums">{pct}%</span>
        </div>
        {/* Right: Volver button */}
        <div className="flex items-center">
          {onBack && step > 1 ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
              }}
              title="Volver al paso anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Volver</span>
            </button>
          ) : <div style={{ width: "80px" }} />}
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
        <div className="w-full max-w-lg overflow-hidden" style={{
          background: "rgba(13,20,36,0.97)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          backdropFilter: "blur(24px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
        }}>
          {/* Header with book icon + ORT logo in top-right */}
          <div className="relative px-7 pt-8 pb-6 text-center" style={{
            background: "linear-gradient(160deg, rgba(0,100,180,0.15) 0%, rgba(0,180,100,0.08) 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}>
            {/* ORT logo top-right */}
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_white_aefdc03d.png"
              alt="ORT" className="absolute top-5 right-6 h-10 object-contain opacity-80" />
            {/* Book icon with cyan/green gradient */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full mb-5 float-anim"
              style={{
                background: "linear-gradient(135deg, rgba(0,180,255,0.25) 0%, rgba(0,220,120,0.25) 100%)",
                border: "2px solid rgba(0,200,200,0.3)",
                boxShadow: "0 0 40px rgba(0,200,200,0.2)",
              }}>
              <BookOpen className="w-9 h-9" style={{ color: "#00d4ff" }} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>Acerca de esta cápsula</h2>
            <p className="text-white/45 text-sm">Bienvenido a "Universidad 2040", una experiencia educativa interactiva diseñada para estudiantes de la Universidad ORT Argentina.</p>
          </div>
          {/* Body */}
          <div className="px-7 py-6">
            <p className="text-white/70 text-sm leading-relaxed mb-5">
              Esta cápsula te guiará a través de los desafíos y oportunidades que enfrentarán las profesiones y la educación superior en las próximas décadas, utilizando datos y proyecciones para fomentar la reflexión crítica y la preparación para el futuro.
            </p>
            {/* Audio player — matches screenshot with play/pause, timeline, volume */}
            <div className="rounded-xl px-4 py-3.5 mb-5 flex items-center gap-3" style={{
              background: "linear-gradient(135deg, rgba(13,20,36,0.95), rgba(0,48,100,0.25))",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}>
              {/* Play/Pause toggle */}
              <button onClick={() => tts.speaking ? (tts.paused ? tts.togglePause() : tts.togglePause()) : tts.speak(aboutText, 12)}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{ background: "rgba(0,200,200,0.15)", border: "1px solid rgba(0,200,200,0.3)" }}>
                {tts.speaking && !tts.paused ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
              {/* Time display */}
              <span className="text-white/50 text-xs tabular-nums flex-shrink-0">{tts.speaking ? "0:15" : "0:00"} / 1:20</span>
              {/* Progress bar */}
              <div className="flex-1 h-1 rounded-full relative cursor-pointer" style={{ background: "rgba(255,255,255,0.12)" }}>
                <div className="h-1 rounded-full transition-all duration-300" style={{
                  width: tts.speaking ? "18%" : "0%",
                  background: "linear-gradient(90deg, #0080ff, #00c8ff)",
                }} />
                <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    left: tts.speaking ? "18%" : "0%",
                    background: "#ffffff",
                    boxShadow: "0 0 4px rgba(255,255,255,0.5)",
                  }} />
              </div>
              {/* Volume */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => tts.setVolume(tts.volume > 0 ? 0 : 0.85)} className="text-white/50 hover:text-white/80 transition-colors">
                  {tts.volume > 0 ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={tts.volume}
                  onChange={e => tts.setVolume(Number(e.target.value))}
                  className="volume-slider"
                  style={{ width: "60px" }}
                />
              </div>
            </div>
            <button onClick={() => { tts.stop(); onClose(); }}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #00c8ff 0%, #00e87a 100%)",
                color: "#fff",
                border: "none",
                boxShadow: "0 4px 20px rgba(0,200,120,0.3)",
                fontFamily: "'Public Sans', 'Inter', sans-serif",
              }}>
              Cerrar
            </button>
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
  const [clientIp, setClientIp] = useState("");
  const verify = trpc.capsule.verifyPassword.useMutation();

  const hasFullName = (value: string) =>
    value
      .trim()
      .split(/\s+/)
      .filter(Boolean).length >= 2;

  // Detect client IP on mount for geolocation
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(r => r.json())
      .then((d: { ip: string }) => setClientIp(d.ip))
      .catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // ── Acceso rápido al dashboard admin ──
    const nameTrimmed = name.trim();
    if (nameTrimmed.toLowerCase() === "admin" || nameTrimmed === "/admin") {
      window.location.href = "/dashboard";
      return;
    }
    if (!hasFullName(nameTrimmed)) {
      setError("Ingresá tu nombre y apellido para continuar.");
      return;
    }
    if (!password.trim()) { setError("Por favor ingresá la contraseña de acceso."); return; }
    if (password.trim().toUpperCase() !== "ORT") {
      setError("La contraseña debe ser ORT.");
      return;
    }
    verify.mutate(
      { password: password.trim(), studentName: name.trim(), clientIp: clientIp || undefined },
      {
        onSuccess: (result) => onAccess(result.sessionId, name.trim()),
        onError: (err) => setError(err.message || "No se pudo validar el acceso. Intentá nuevamente."),
      }
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#03091a" }}>
      {/* ── Grid background: líneas verticales y horizontales ── */}
      <div className="absolute inset-0 z-0" style={{
        backgroundImage:
          "linear-gradient(rgba(0,180,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.10) 1px, transparent 1px)",
        backgroundSize: "52px 52px",
      }} />
      {/* ── Glow verde/cyan detrás del card ── */}
      <div className="absolute z-0" style={{
        width: "680px", height: "680px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,200,100,0.28) 0%, rgba(0,160,255,0.18) 35%, transparent 65%)",
        top: "52%", left: "55%",
        transform: "translate(-50%, -50%)",
        filter: "blur(40px)",
        pointerEvents: "none",
      }} />
      {/* ── Glow azul secundario ── */}
      <div className="absolute z-0" style={{
        width: "400px", height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,100,255,0.2) 0%, transparent 70%)",
        top: "45%", left: "45%",
        transform: "translate(-50%, -50%)",
        filter: "blur(50px)",
        pointerEvents: "none",
      }} />
      {/* ── Puntos de luz dispersos ── */}
      {[
        { x:"8%", y:"18%", c:"rgba(0,180,255,0.6)", s:3 },
        { x:"92%", y:"12%", c:"rgba(0,220,120,0.5)", s:2.5 },
        { x:"5%", y:"72%", c:"rgba(0,180,255,0.4)", s:2 },
        { x:"95%", y:"65%", c:"rgba(0,220,120,0.4)", s:3 },
        { x:"18%", y:"88%", c:"rgba(0,180,255,0.35)", s:2 },
        { x:"82%", y:"85%", c:"rgba(0,220,120,0.35)", s:2.5 },
        { x:"50%", y:"5%", c:"rgba(0,180,255,0.3)", s:2 },
        { x:"30%", y:"92%", c:"rgba(0,220,120,0.3)", s:2 },
      ].map((p, i) => (
        <div key={i} className="absolute rounded-full float-anim" style={{
          width: `${p.s}px`, height: `${p.s}px`,
          background: p.c,
          left: p.x, top: p.y,
          animationDelay: `${i * 0.5}s`,
          boxShadow: `0 0 6px ${p.c}`,
        }} />
      ))}
      {/* ── Contenido principal ── */}
      <div className="relative z-10 flex flex-col items-center w-full px-4" style={{ paddingTop: "5vh", paddingBottom: "5vh" }}>
        {/* Logo ORT grande centrado - versión blanca para fondo oscuro */}
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_white_aefdc03d.png"
          alt="ORT Argentina"
          className="object-contain mb-8"
          style={{ width: "240px", height: "auto" }}
        />
        <AnimatedStep stepKey={0}>
          <div className="w-full" style={{ maxWidth: "440px" }}>
            {/* Card */}
            <div className="rounded-2xl px-8 pt-8 pb-7" style={{
              background: "rgba(10,18,38,0.88)",
              border: "1px solid rgba(0,160,255,0.18)",
              boxShadow: "0 0 80px rgba(0,100,220,0.18), 0 8px 48px rgba(0,0,0,0.7)",
              backdropFilter: "blur(24px)",
            }}>
              {/* Badge */}
              <div className="flex justify-center mb-7">
                <span className="px-6 py-2 rounded-full font-bold text-xs uppercase"
                  style={{
                    background: "linear-gradient(90deg, #00c864 0%, #00a651 100%)",
                    color: "#fff",
                    letterSpacing: "0.14em",
                    boxShadow: "0 2px 16px rgba(0,180,80,0.4)",
                  }}>
                  EXPERIENCIA EXCLUSIVA
                </span>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campo Nombre */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Nombre y Apellido
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre y apellido"
                    value={name}
                    onChange={e => { setName(e.target.value); setError(""); }}
                    className="w-full px-4 py-3.5 rounded-xl text-white text-sm outline-none transition-all placeholder:text-white/30"
                    style={{
                      background: "rgba(4,14,34,0.85)",
                      border: "1.5px solid rgba(0,200,255,0.65)",
                      boxShadow: "0 0 18px rgba(0,180,255,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
                    }}
                    onFocus={e => {
                      e.target.style.border = "1.5px solid rgba(0,230,255,1)";
                      e.target.style.boxShadow = "0 0 28px rgba(0,200,255,0.45), inset 0 1px 0 rgba(255,255,255,0.04)";
                    }}
                    onBlur={e => {
                      e.target.style.border = "1.5px solid rgba(0,200,255,0.65)";
                      e.target.style.boxShadow = "0 0 18px rgba(0,180,255,0.18), inset 0 1px 0 rgba(255,255,255,0.04)";
                    }}
                  />
                </div>
                {/* Campo Contraseña */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    placeholder="Contraseña (ORT)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl text-white text-sm outline-none transition-all placeholder:text-white/30"
                    style={{
                      background: "rgba(4,14,34,0.85)",
                      border: "1.5px solid rgba(0,200,255,0.65)",
                      boxShadow: "0 0 18px rgba(0,180,255,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
                    }}
                    onFocus={e => {
                      e.target.style.border = "1.5px solid rgba(0,230,255,1)";
                      e.target.style.boxShadow = "0 0 28px rgba(0,200,255,0.45), inset 0 1px 0 rgba(255,255,255,0.04)";
                    }}
                    onBlur={e => {
                      e.target.style.border = "1.5px solid rgba(0,200,255,0.65)";
                      e.target.style.boxShadow = "0 0 18px rgba(0,180,255,0.18), inset 0 1px 0 rgba(255,255,255,0.04)";
                    }}
                  />
                </div>
                {error && (
                  <div className="rounded-xl px-4 py-3 text-sm"
                    style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}>
                    {error}
                  </div>
                )}
                {/* Botón ACCEDER */}
                <button
                  type="submit"
                  disabled={verify.isPending}
                  className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: verify.isPending
                      ? "rgba(30,80,220,0.5)"
                      : "linear-gradient(90deg, #2060ff 0%, #1040e0 50%, #0a30c8 100%)",
                    color: "#fff",
                    letterSpacing: "0.15em",
                    boxShadow: verify.isPending ? "none" : "0 4px 32px rgba(20,80,255,0.5), 0 1px 0 rgba(255,255,255,0.1) inset",
                  }}>
                  {verify.isPending ? "VERIFICANDO..." : "ACCEDER"}
                </button>
              </form>
              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
                  © 2024 ORT Argentina. All rights reserved.
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.22)" }}>
                  Duración estimada: 20 minutos.
                </p>
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
        {/* Left 50%: scene image */}
        <div className="lg:w-1/2 h-52 lg:h-auto relative flex-shrink-0 overflow-hidden">
          <img src={image} alt="" className="w-full h-full object-cover"
            style={{ filter: "saturate(1.2) brightness(0.85)" }} />
          {/* Bottom fade on mobile */}
          <div className="absolute bottom-0 left-0 right-0 h-20 lg:hidden"
            style={{ background: "linear-gradient(to top, rgba(7,11,20,1), transparent)" }} />
          {/* Right edge fade on desktop */}
          <div className="absolute inset-0 hidden lg:block"
            style={{ background: "linear-gradient(to right, transparent 70%, rgba(7,11,20,0.85) 100%)" }} />
        </div>

        {/* Right 50%: content */}
        <div className="lg:w-1/2 flex items-center justify-center px-6 py-10 lg:px-12"
          style={{ background: "rgba(7,11,20,0.75)", backdropFilter: "blur(4px)" }}>
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
      {/* Accent line — matches mockup blue bar above title */}
      <div className="mb-5" style={{ width: "48px", height: "3px", background: "linear-gradient(90deg, #00c8ff, #00e87a)", borderRadius: "2px" }} />
      <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 glow-text"
        style={{ fontFamily: "'Syne', sans-serif", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      <p className="text-white/65 text-base leading-relaxed mb-6">{text}</p>
      {/* Audio player — matches mockup: play button + volume icon + slider in dark pill */}
      <div className="inline-flex items-center gap-3 rounded-full px-4 py-2.5" style={{
        background: "rgba(10,18,38,0.85)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
      }}>
        {/* Play/Pause button */}
        <button onClick={() => tts.speaking ? tts.stop() : tts.speak(`${title}. ${text}`, audioIndex)}
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all"
          style={{
            background: tts.speaking ? "rgba(0,200,120,0.25)" : "rgba(0,200,200,0.2)",
            border: `1.5px solid ${tts.speaking ? "rgba(0,200,120,0.5)" : "rgba(0,200,200,0.4)"}`,
            boxShadow: tts.speaking ? "0 0 12px rgba(0,200,120,0.3)" : "0 0 12px rgba(0,200,200,0.2)",
          }}>
          {tts.speaking ? <Pause className="w-4 h-4" style={{ color: "#00e87a" }} /> : <Play className="w-4 h-4" style={{ color: "#00c8ff" }} />}
        </button>
        {/* Volume icon */}
        <button onClick={() => tts.setVolume(tts.volume > 0 ? 0 : 0.85)} className="text-white/50 hover:text-white/80 transition-colors flex-shrink-0">
          {tts.volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
        {/* Volume slider */}
        <input
          type="range" min={0} max={1} step={0.05}
          value={tts.volume}
          onChange={e => tts.setVolume(Number(e.target.value))}
          className="volume-slider"
          style={{ width: "90px" }}
        />
      </div>
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
          className={`drag-item flex items-center gap-3 px-4 py-3 ${dragOver === i ? "drag-over" : ""}`}
          style={{
            background: dragOver === i ? "rgba(0,200,120,0.08)" : "rgba(13,20,40,0.7)",
            border: dragOver === i ? "1.5px solid rgba(0,200,120,0.5)" : "1.5px solid rgba(0,166,81,0.25)",
            borderRadius: "10px",
            cursor: "grab",
          }}>
          {/* Circular rank number — neon green border, matches mockup */}
          <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold"
            style={{
              background: "rgba(0,20,40,0.8)",
              border: `2px solid ${i < 3 ? "#00e87a" : "rgba(0,166,81,0.4)"}`,
              color: i < 3 ? "#00e87a" : "rgba(0,200,120,0.7)",
              boxShadow: i < 3 ? "0 0 10px rgba(0,232,122,0.3), inset 0 0 6px rgba(0,232,122,0.1)" : "none",
              fontFamily: "'Syne', sans-serif",
            }}>
            {i + 1}
          </div>
          {/* Grip handle */}
          <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(0,200,120,0.4)" }} />
          {/* Label */}
          <span className="flex-1 font-semibold text-sm" style={{
            color: i < 3 ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.75)",
          }}>{item}</span>
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
      className="inline-flex items-center justify-center gap-2 transition-all duration-300 mt-7"
      style={{
        background: disabled || loading
          ? "rgba(0,150,150,0.25)"
          : "linear-gradient(135deg, #00c8ff 0%, #00e87a 100%)",
        color: disabled || loading ? "rgba(255,255,255,0.4)" : "#fff",
        border: "none",
        borderRadius: "50px",
        padding: "15px 40px",
        fontWeight: 700,
        fontSize: "1rem",
        letterSpacing: "0.03em",
        boxShadow: disabled || loading ? "none" : "0 6px 28px rgba(0,200,120,0.4), 0 0 0 1px rgba(0,200,200,0.15)",
        fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        transform: disabled || loading ? "none" : "translateY(0)",
      }}
      onMouseEnter={e => { if (!disabled && !loading) { (e.target as HTMLElement).style.transform = "translateY(-2px)"; (e.target as HTMLElement).style.boxShadow = "0 10px 36px rgba(0,200,120,0.5), 0 0 0 1px rgba(0,200,200,0.2)"; } }}
      onMouseLeave={e => { (e.target as HTMLElement).style.transform = "translateY(0)"; if (!disabled && !loading) (e.target as HTMLElement).style.boxShadow = "0 6px 28px rgba(0,200,120,0.4), 0 0 0 1px rgba(0,200,200,0.15)"; }}>
      {loading ? "Guardando..." : label}
      {!loading && <span style={{ fontSize: "1.1rem" }}>→</span>}
    </button>
  );
}

// ─── Summary Section ─────────────────────────────────────────────────────────
function SummarySection({ answers }: { answers: Answers }) {
  const [open, setOpen] = useState(false);

  // Build summary items matching the visual: "Interacción N: short answer"
  const summaryItems: { label: string; value: string }[] = [
    { label: "Interacción 1", value: answers.interaction1.length > 0 ? answers.interaction1.join(", ") : "Sin respuesta" },
    { label: "Interacción 2", value: answers.interaction2.length > 0 ? answers.interaction2.join(", ") : "Sin respuesta" },
    { label: "Interacción 3", value: answers.interaction3 || "Sin respuesta" },
    { label: "Interacción 4", value: answers.interaction4Opinion || "Sin respuesta" },
    { label: "Ranking", value: answers.interaction5.length > 0
      ? answers.interaction5.slice(0, 3).map((item, i) => `${i + 1}. ${item}`).join(", ") + "…"
      : "Sin respuesta" },
  ];

  return (
    <div className="w-full max-w-lg mx-auto mt-6">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl transition-all duration-300"
        style={{
          background: open ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
          backdropFilter: "blur(12px)",
        }}
      >
        <span className="text-sm font-semibold text-white/80">Resumen de mis respuestas</span>
        <ChevronRight
          className="w-4 h-4 text-white/40 transition-transform duration-300"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="mt-2 rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          {summaryItems.map((item, i) => (
            <div key={item.label}
              className="px-5 py-3.5 text-left"
              style={{ borderBottom: i < summaryItems.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span className="text-white/80 text-sm">
                <span className="font-semibold">{item.label}:</span>{" "}
                <span className="text-white/55">{item.value}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Final Screen ─────────────────────────────────────────────────────────────
function FinalScreen({ name, answers }: { name: string; answers: Answers }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Full background image — aerial campus view */}
      <div className="fixed inset-0 z-0">
        <img src={SCENE_IMAGES.scene4} alt="" className="w-full h-full object-cover"
          style={{ filter: "brightness(0.35) saturate(1.1)" }} />
        <div className="absolute inset-0" style={{
          background: "linear-gradient(to bottom, rgba(7,11,20,0.4) 0%, rgba(7,11,20,0.3) 40%, rgba(7,11,20,0.5) 100%)",
        }} />
      </div>
      {/* Confetti overlay — scattered colorful pieces */}
      <div className="fixed inset-0 z-1 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="confetti-pop absolute" style={{
            width: `${5 + (i % 5) * 2}px`, height: `${4 + (i % 4) * 2}px`,
            background: ["#00a651","#003087","#4f8ef7","#f59e0b","#e11d48","#06b6d4","#22c55e","#a855f7"][i % 8],
            left: `${(i * 2.1 + i * i * 0.3) % 100}%`, top: `${(i * 5.3 + i * 0.7) % 85}%`,
            opacity: 0.65, animationDelay: `${i * 0.08}s`,
            transform: `rotate(${i * 37}deg)`,
            borderRadius: i % 3 === 0 ? "50%" : "1px",
          }} />
        ))}
      </div>
      {/* Header bar — matches mockup: logo ORT large top-left, UNIVERSIDAD 2040 + 100% top-right */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(7,11,20,0.3)", backdropFilter: "blur(12px)" }}>
        {/* Logo ORT — large, top-left */}
        <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_white_aefdc03d.png"
          alt="ORT Argentina" className="h-14 object-contain" />
        {/* Progress — top-right */}
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-xs font-bold tracking-widest uppercase">Universidad 2040</span>
          <div className="ort-progress-bar w-28">
            <div className="ort-progress-fill" style={{ width: "100%" }} />
          </div>
          <span className="text-white/90 text-sm font-bold">100%</span>
        </div>
      </div>
      {/* Body */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-8">
        <AnimatedStep stepKey={99}>
          <div className="max-w-2xl w-full text-center">
            <h1 className="font-bold text-white mb-5 glow-text"
              style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.03em", fontSize: "clamp(2.8rem, 7vw, 5rem)", lineHeight: 1.05 }}>
              ¡Gracias{name ? `, ${name}` : ""}!
            </h1>
            <p className="text-white/75 text-lg leading-relaxed mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Completaste la cápsula interactiva Universidad 2040.
            </p>
            <p className="text-white/50 text-base leading-relaxed mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Tus respuestas son valiosas.
            </p>
            <SummarySection answers={answers} />
            <div className="mt-12">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/ort_logo_white_aefdc03d.png"
                alt="ORT Argentina" className="h-16 object-contain mx-auto" style={{ opacity: 0.75 }} />
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
    interactionSocio: [],
    interaction4Opinion: "",
    interaction4Text: "",
    interaction5: [
      "Pensamiento crítico",
      "Tecnología avanzada",
      "Ética y responsabilidad social",
      "Aprendizaje práctico",
    ],
    interaction5b: [
      "Emprender",
      "Innovar",
      "Experiencia internacional",
      "Trabajo interdisciplinario",
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
            text="Pensá en el año 2040. El mundo cambió de maneras que hoy apenas podemos imaginar. Las economías se reorganizaron, los trabajos se transformaron, y las habilidades que se necesitan para crecer profesionalmente son muy distintas a las de hace veinte años. Para los estudiantes de hoy, elegir una carrera ya no es solo elegir una profesión: es elegir cómo querés participar en un mundo que no para de moverse. En este contexto, hay una pregunta que no podemos ignorar: ¿Cómo tiene que formarse el profesional del futuro?" />
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
        <SceneWrapper image="https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/opcion_3_7c9b376c.png" step={step} {...navProps}>
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
          <InteractionHeader tts={tts} audioIndex={9} num="Interacción 3 de 6"
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
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step} {...navProps}>
          <InteractionHeader tts={tts} num="Interacción 4 de 6"
            question="Habilidades socioemocionales"
            subtitle="¿Cuáles son las habilidades socioemocionales que van a ser requeridas en las carreras futuras? Elegí hasta 3 opciones." />
          <div className="space-y-3">
            {[
              "Empatía y escucha activa",
              "Gestión de la incertidumbre",
              "Comunicación efectiva",
              "Trabajo en equipo diverso",
              "Inteligencia emocional",
              "Liderazgo adaptativo",
              "Resolución de conflictos",
              "Creatividad e imaginación",
            ].map(opt => (
              <CheckboxCard key={opt} label={opt}
                checked={answers.interactionSocio.includes(opt)}
                disabled={answers.interactionSocio.length >= 3 && !answers.interactionSocio.includes(opt)}
                onChange={() => {
                  const cur = answers.interactionSocio;
                  updateAnswer("interactionSocio", cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt]);
                }} />
            ))}
          </div>
          <p className="text-white/35 text-xs mt-3 font-medium">{answers.interactionSocio.length}/3 seleccionados</p>
          <ContinueBtn disabled={answers.interactionSocio.length === 0} onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 8 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step} {...navProps}>
          <Narration tts={tts} audioIndex={4} title="Un posible modelo de universidad"
            text="En distintas partes del mundo ya existen universidades que están respondiendo a estos desafíos. Integran tecnología, trabajan con proyectos reales, conectan a sus estudiantes con el mundo y los forman en valores. La pregunta que nos hacemos es: ¿el modelo universitario actual está listo para lo que viene?" />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 9 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step} {...navProps}>
          <InteractionHeader tts={tts} audioIndex={10} num="Interacción 5 de 6"
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

      {step === 10 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step} {...navProps}>
          <Narration tts={tts} audioIndex={5} title="Priorizar lo importante"
            text="Llegamos a la última parte. Si vos pudieras diseñar la universidad ideal para 2040, ¿qué pondrías primero? A continuación vas a poder ordenar estos elementos según lo que te parece más importante. No hay respuestas correctas, solo tu visión." />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {step === 11 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step} {...navProps}>
          <InteractionHeader tts={tts} audioIndex={11} num="Interacción 6a de 6"
            question="Ranking: habilidades más urgentes hoy"
            subtitle="Arrastrá para ordenar de más a menos urgente en el mundo actual." />
          <RankingList items={answers.interaction5} onChange={items => updateAnswer("interaction5", items)} />
          <ContinueBtn onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 12 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step} {...navProps}>
          <InteractionHeader tts={tts} num="Interacción 6b de 6"
            question="Ranking: capacidades clave para 2040"
            subtitle="Arrastrá para ordenar de más a menos relevante para el futuro." />
          <RankingList items={answers.interaction5b} onChange={items => updateAnswer("interaction5b", items)} />
          <ContinueBtn onClick={next} loading={saveResponse.isPending} />
        </SceneWrapper>
      )}

      {step === 13 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step} {...navProps}>
          <Narration tts={tts} audioIndex={6} title="La universidad del futuro empieza hoy"
            text="Los desafíos globales están cambiando la educación superior de raíz. Las universidades que quieran formar profesionales de verdad van a tener que repensar cómo enseñan, qué enseñan, y cómo se conectan con el mundo real. Gracias por compartir tu visión. Tus respuestas van a ser parte de ese proceso." />
          <ContinueBtn
            label={complete.isPending ? "Guardando respuestas..." : "Continuar"}
            onClick={next} disabled={complete.isPending} loading={complete.isPending} />
        </SceneWrapper>
      )}

      {step === 14 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step} {...navProps}>
          <div className="mb-8">
            <VoiceButton text="Antes de cerrar, queremos preguntarte algo. ¿Te gustaría participar en un encuentro presencial para seguir conversando sobre estos temas? Sería un espacio de diálogo abierto, junto a docentes, estudiantes y referentes del mundo profesional. Si tu respuesta es sí, dejános tus datos de contacto y te avisamos cuando lo organicemos." tts={tts} audioIndex={13} showVolume={true} />
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
              onClick={() => { tts.stop(); setStep(15); setMaxVisitedStep(prev => Math.max(prev, 15)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
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

      {step === 15 && (
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
