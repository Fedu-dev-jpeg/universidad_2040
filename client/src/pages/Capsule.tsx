import { useState, useCallback, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronRight, GripVertical, CheckCircle2, Lock } from "lucide-react";

// ─── CDN URLs ─────────────────────────────────────────────────────────────────
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

// ─── Animated Step Wrapper ────────────────────────────────────────────────────
// Uses CSS keyframe animation to fade+slide in each step
function AnimatedStep({ stepKey, children }: { stepKey: number; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Tiny delay so the animation triggers on mount
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: "opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {children}
    </div>
  );
}

// ─── Access Screen ────────────────────────────────────────────────────────────
function AccessScreen({ onAccess }: { onAccess: (sessionId: string, name: string) => void }) {
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const verify = trpc.capsule.verifyPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const result = await verify.mutateAsync({ password, studentName: name });
      onAccess(result.sessionId, name);
    } catch {
      setError("Contraseña incorrecta. Por favor, intentá de nuevo.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${SCENE_IMAGES.scene1})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/75 to-black/92" />
      <div className="relative z-10 w-full max-w-md mx-4">
        <AnimatedStep stepKey={0}>
          <div className="glass-card rounded-2xl p-8 text-center shadow-2xl">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 border border-primary/40 mb-4">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Universidad 2040
              </h1>
              <p className="text-white/70 text-sm">Cápsula Interactiva · Acceso exclusivo</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Tu nombre (opcional)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-white/45 focus:outline-none focus:border-primary/70 focus:bg-white/15 transition-all"
              />
              <input
                type="password"
                placeholder="Contraseña de acceso"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/25 text-white placeholder-white/45 focus:outline-none focus:border-primary/70 focus:bg-white/15 transition-all"
              />
              {error && <p className="text-red-400 text-sm font-medium">{error}</p>}
              <Button
                type="submit"
                disabled={verify.isPending}
                className="w-full py-3 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all"
              >
                {verify.isPending ? "Verificando..." : "Ingresar a la cápsula"}
              </Button>
            </form>
            <p className="mt-6 text-white/40 text-xs">Duración estimada: 6 minutos</p>
          </div>
        </AnimatedStep>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-white/10">
      <div
        className="h-full bg-primary progress-glow transition-all duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Scene Wrapper ────────────────────────────────────────────────────────────
function SceneWrapper({ image, children, step }: { image: string; children: React.ReactNode; step: number }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background image with darker overlay for better readability */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/92" />
      {/* Extra bottom gradient for text areas */}
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-20">
        <AnimatedStep stepKey={step}>
          {children}
        </AnimatedStep>
      </div>
    </div>
  );
}

// ─── Narration Block ──────────────────────────────────────────────────────────
function Narration({ title, text }: { title: string; text: string }) {
  return (
    <div className="max-w-2xl text-center mb-10">
      <h2
        className="text-4xl sm:text-5xl font-bold mb-5 gradient-text drop-shadow-lg"
        style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
      >
        {title}
      </h2>
      <p
        className="text-white text-lg leading-relaxed font-medium"
        style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}
      >
        {text}
      </p>
    </div>
  );
}

// ─── Interaction Header ───────────────────────────────────────────────────────
function InteractionHeader({ num, question, subtitle }: { num: string; question: string; subtitle?: string }) {
  return (
    <div className="text-center mb-6">
      <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3 bg-primary/10 inline-block px-3 py-1 rounded-full border border-primary/30">
        {num}
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-white mb-2"
        style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 2px 12px rgba(0,0,0,0.9)" }}
      >
        {question}
      </h2>
      {subtitle && (
        <p className="text-white/75 text-sm font-medium" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Option Card ──────────────────────────────────────────────────────────────
function OptionCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`option-card w-full text-left px-5 py-4 rounded-xl font-semibold text-white text-base ${selected ? "selected" : ""}`}
      style={{
        background: selected ? "rgba(99,102,241,0.2)" : "rgba(0,0,0,0.45)",
        border: selected ? "2px solid oklch(0.65 0.22 260)" : "2px solid rgba(255,255,255,0.2)",
        backdropFilter: "blur(12px)",
        textShadow: "0 1px 4px rgba(0,0,0,0.6)",
      }}
    >
      <span
        className={`inline-block w-4 h-4 rounded-full border-2 mr-3 align-middle transition-colors flex-shrink-0 ${selected ? "bg-primary border-primary" : "border-white/50"}`}
        style={{ display: "inline-block" }}
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
      className={`option-card w-full text-left px-5 py-4 rounded-xl font-semibold text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed ${checked ? "selected" : ""}`}
      style={{
        background: checked ? "rgba(99,102,241,0.2)" : "rgba(0,0,0,0.45)",
        border: checked ? "2px solid oklch(0.65 0.22 260)" : "2px solid rgba(255,255,255,0.2)",
        backdropFilter: "blur(12px)",
        textShadow: "0 1px 4px rgba(0,0,0,0.6)",
      }}
    >
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 mr-3 align-middle transition-all flex-shrink-0 ${checked ? "bg-primary border-primary" : "border-white/50"}`}
        style={{ display: "inline-flex" }}
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
    <div className="space-y-2 w-full max-w-lg">
      {items.map((item, i) => (
        <div
          key={item}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragEnter={() => onDragEnter(i)}
          onDragOver={e => e.preventDefault()}
          onDragEnd={onDragEnd}
          className={`drag-item flex items-center gap-3 px-5 py-3.5 rounded-xl font-semibold text-white border-2 transition-all ${dragOver === i ? "drag-over" : ""}`}
          style={{
            background: dragOver === i ? "rgba(99,102,241,0.15)" : "rgba(0,0,0,0.5)",
            borderColor: dragOver === i ? "oklch(0.65 0.22 260)" : "rgba(255,255,255,0.2)",
            backdropFilter: "blur(12px)",
            textShadow: "0 1px 4px rgba(0,0,0,0.6)",
          }}
        >
          <span className="text-primary font-bold text-base w-6 text-center flex-shrink-0">{i + 1}</span>
          <GripVertical className="w-4 h-4 text-white/50 flex-shrink-0" />
          <span className="flex-1 text-sm">{item}</span>
        </div>
      ))}
      <p className="text-white/60 text-xs text-center mt-2 font-medium" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
        Arrastrá para reordenar
      </p>
    </div>
  );
}

// ─── Continue Button ──────────────────────────────────────────────────────────
function ContinueBtn({ disabled = false, label = "Continuar", onClick, loading = false }: { disabled?: boolean; label?: string; onClick: () => void; loading?: boolean }) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className="mt-8 px-10 py-3.5 text-base font-bold rounded-xl bg-primary hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/30"
    >
      {loading ? "Guardando..." : label}
      {!loading && <ChevronRight className="w-4 h-4" />}
    </Button>
  );
}

// ─── Final Screen ─────────────────────────────────────────────────────────────
function FinalScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${SCENE_IMAGES.scene5})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/70 to-black/92" />
      <div className="relative z-10 max-w-2xl text-center px-4">
        <AnimatedStep stepKey={99}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-white mb-4 gradient-text"
            style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
          >
            ¡Gracias{name ? `, ${name}` : ""}!
          </h1>
          <p className="text-white text-lg leading-relaxed mb-4 font-medium" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
            Completaste la cápsula interactiva <strong>Universidad 2040</strong>.
          </p>
          <p className="text-white/80 text-base leading-relaxed mb-8" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
            Tus respuestas son valiosas para diseñar la universidad del futuro. El equipo las analizará para construir un modelo educativo que responda a los desafíos globales.
          </p>
          <div
            className="rounded-xl px-6 py-4 inline-block"
            style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}
          >
            <p className="text-white/80 text-sm italic font-medium">
              "La universidad del futuro no es solo un lugar donde se transmite conocimiento. Es un espacio donde se crea, se experimenta y se construyen soluciones para los desafíos del mundo."
            </p>
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

  const saveResponse = trpc.capsule.saveResponse.useMutation();
  const complete = trpc.capsule.complete.useMutation();

  const handleAccess = useCallback((sid: string, name: string) => {
    setSessionId(sid);
    setStudentName(name);
    setStep(1);
  }, []);

  const next = useCallback(async () => {
    if (!sessionId) return;
    await saveResponse.mutateAsync({ sessionId, ...answers }).catch(() => {});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sessionId, answers, saveResponse]);

  const handleComplete = useCallback(async () => {
    if (!sessionId) return;
    try {
      await complete.mutateAsync({ sessionId, studentName, ...answers });
      setStep(TOTAL_STEPS);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Error al guardar respuestas. Por favor, intentá de nuevo.");
    }
  }, [sessionId, studentName, answers, complete]);

  const updateAnswer = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  if (step === 0) return <AccessScreen onAccess={handleAccess} />;
  if (step >= TOTAL_STEPS) return <FinalScreen name={studentName} />;

  return (
    <>
      <ProgressBar current={step} total={TOTAL_STEPS - 1} />

      {/* Step 1: Scene 1 */}
      {step === 1 && (
        <SceneWrapper image={SCENE_IMAGES.scene1} step={step}>
          <Narration
            title="El mundo que viene"
            text="Imaginá que estamos en el año 2040. La inteligencia artificial transformó casi todas las profesiones. Las economías cambiaron. Los desafíos ambientales se volvieron urgentes. El conocimiento se produce en redes globales. En este mundo, una pregunta se volvió central: ¿Cómo deben formarse los profesionales del futuro?"
          />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {/* Step 2: Interaction 1 */}
      {step === 2 && (
        <SceneWrapper image={SCENE_IMAGES.scene1} step={step}>
          <div className="max-w-xl w-full">
            <InteractionHeader
              num="Interacción 1 de 5"
              question="¿Cuál de estos cambios creés que impactará más en las profesiones?"
              subtitle="No hay respuesta correcta: buscamos reflexión."
            />
            <div className="space-y-3">
              {["Inteligencia artificial", "Cambio climático", "Nuevas formas de trabajo", "Globalización del conocimiento"].map(opt => (
                <OptionCard key={opt} label={opt} selected={answers.interaction1 === opt} onClick={() => updateAnswer("interaction1", opt)} />
              ))}
            </div>
            <div className="flex justify-center">
              <ContinueBtn disabled={!answers.interaction1} onClick={next} loading={saveResponse.isPending} />
            </div>
          </div>
        </SceneWrapper>
      )}

      {/* Step 3: Scene 2 */}
      {step === 3 && (
        <SceneWrapper image={SCENE_IMAGES.scene2} step={step}>
          <Narration
            title="La universidad del futuro"
            text="Las universidades también tuvieron que transformarse. Ya no alcanzaba con transmitir conocimiento. Las nuevas generaciones necesitaban aprender a resolver problemas complejos, trabajar en equipos interdisciplinarios, innovar y adaptarse a contextos cambiantes. Entonces surge una nueva pregunta: ¿Cómo debería ser una universidad preparada para este mundo?"
          />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {/* Step 4: Interaction 2 */}
      {step === 4 && (
        <SceneWrapper image={SCENE_IMAGES.scene2} step={step}>
          <div className="max-w-xl w-full">
            <InteractionHeader
              num="Interacción 2 de 5"
              question="Diseñá tu universidad"
              subtitle={`Elegí los 3 elementos que no podrían faltar. (${answers.interaction2.length}/3 seleccionados)`}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Proyectos interdisciplinarios", "Prácticas en empresas",
                "Investigación", "Intercambio internacional",
                "Laboratorios tecnológicos", "Mentorías docentes",
                "Emprendimientos", "Cursos virtuales flexibles",
              ].map(opt => (
                <CheckboxCard
                  key={opt}
                  label={opt}
                  checked={answers.interaction2.includes(opt)}
                  disabled={answers.interaction2.length >= 3}
                  onChange={() => {
                    const cur = answers.interaction2;
                    if (cur.includes(opt)) updateAnswer("interaction2", cur.filter(x => x !== opt));
                    else if (cur.length < 3) updateAnswer("interaction2", [...cur, opt]);
                  }}
                />
              ))}
            </div>
            <div className="flex justify-center">
              <ContinueBtn disabled={answers.interaction2.length !== 3} onClick={next} loading={saveResponse.isPending} />
            </div>
          </div>
        </SceneWrapper>
      )}

      {/* Step 5: Scene 3 */}
      {step === 5 && (
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step}>
          <Narration
            title="El profesional que necesita el mundo"
            text="Hoy muchas investigaciones coinciden en algo: los profesionales del futuro no solo necesitarán conocimientos técnicos. También necesitarán desarrollar capacidades como pensamiento crítico, creatividad, trabajo en equipo, aprendizaje permanente y responsabilidad ética. La formación universitaria deberá integrar tecnología, práctica y desarrollo humano."
          />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {/* Step 6: Interaction 3 */}
      {step === 6 && (
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step}>
          <div className="max-w-xl w-full">
            <InteractionHeader
              num="Interacción 3 de 5"
              question="¿Qué habilidad creés que será más importante para el futuro?"
            />
            <div className="space-y-3">
              {["Resolver problemas complejos", "Adaptarse al cambio", "Trabajar con tecnología", "Trabajar con otras personas"].map(opt => (
                <OptionCard key={opt} label={opt} selected={answers.interaction3 === opt} onClick={() => updateAnswer("interaction3", opt)} />
              ))}
            </div>
            <div className="flex justify-center">
              <ContinueBtn disabled={!answers.interaction3} onClick={next} loading={saveResponse.isPending} />
            </div>
          </div>
        </SceneWrapper>
      )}

      {/* Step 7: Scene 4 */}
      {step === 7 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step}>
          <Narration
            title="Un posible modelo de universidad"
            text="Muchas universidades innovadoras están avanzando hacia modelos educativos que combinan formación tecnológica avanzada, aprendizaje basado en proyectos, trabajo con empresas y organizaciones, experiencias internacionales, trayectorias flexibles y desarrollo de habilidades humanas. Este tipo de modelo busca responder a los desafíos del mundo actual."
          />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {/* Step 8: Interaction 4 */}
      {step === 8 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step}>
          <div className="max-w-xl w-full">
            <InteractionHeader
              num="Interacción 4 de 5"
              question="¿Creés que este modelo responde a los desafíos globales?"
            />
            <div className="flex gap-3 justify-center mb-6">
              {["Sí", "Parcialmente", "No"].map(opt => (
                <button
                  key={opt}
                  onClick={() => updateAnswer("interaction4Opinion", opt)}
                  className="px-6 py-3 rounded-xl font-bold text-white border-2 transition-all text-base"
                  style={{
                    background: answers.interaction4Opinion === opt ? "rgba(99,102,241,0.25)" : "rgba(0,0,0,0.5)",
                    borderColor: answers.interaction4Opinion === opt ? "oklch(0.65 0.22 260)" : "rgba(255,255,255,0.25)",
                    backdropFilter: "blur(12px)",
                    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div>
              <label
                className="text-white text-sm font-semibold mb-2 block"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
              >
                ¿Qué agregarías? (opcional)
              </label>
              <Textarea
                placeholder="Escribí tu sugerencia aquí..."
                value={answers.interaction4Text}
                onChange={e => updateAnswer("interaction4Text", e.target.value)}
                rows={3}
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "2px solid rgba(255,255,255,0.2)",
                  color: "white",
                  backdropFilter: "blur(12px)",
                  borderRadius: "0.75rem",
                  resize: "none",
                }}
                className="placeholder-white/40 focus:outline-none focus:border-primary/70"
              />
            </div>
            <div className="flex justify-center">
              <ContinueBtn disabled={!answers.interaction4Opinion} onClick={next} loading={saveResponse.isPending} />
            </div>
          </div>
        </SceneWrapper>
      )}

      {/* Step 9: Scene 5 */}
      {step === 9 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <Narration
            title="Priorizar lo importante"
            text="Si tuvieras que elegir los elementos más importantes para la universidad del futuro… ¿Cuáles serían? En la siguiente pantalla podrás ordenarlos según tu criterio."
          />
          <ContinueBtn onClick={next} />
        </SceneWrapper>
      )}

      {/* Step 10: Interaction 5 */}
      {step === 10 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <div className="max-w-xl w-full">
            <InteractionHeader
              num="Interacción 5 de 5"
              question="Ranking de prioridades"
              subtitle="Arrastrá los elementos para ordenarlos de más a menos importante."
            />
            <div className="flex justify-center">
              <RankingList items={answers.interaction5} onChange={items => updateAnswer("interaction5", items)} />
            </div>
            <div className="flex justify-center">
              <ContinueBtn onClick={next} loading={saveResponse.isPending} />
            </div>
          </div>
        </SceneWrapper>
      )}

      {/* Step 11: Closing scene */}
      {step === 11 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <div className="max-w-2xl text-center">
            <h2
              className="text-4xl sm:text-5xl font-bold text-white mb-5 gradient-text"
              style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
            >
              La universidad del futuro empieza hoy
            </h2>
            <p className="text-white text-lg leading-relaxed mb-5 font-medium" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
              Los desafíos globales están transformando profundamente la educación superior. Las universidades que quieran formar profesionales para el futuro deberán repensar cómo enseñan, qué enseñan, y cómo se vinculan con el mundo.
            </p>
            <p className="text-white/85 text-base leading-relaxed mb-8 font-medium" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
              La universidad del futuro no es solo un lugar donde se transmite conocimiento. Es un espacio donde se crea, se experimenta y se construyen soluciones para los desafíos del mundo.
            </p>
            <ContinueBtn
              label={complete.isPending ? "Guardando respuestas..." : "Enviar mis respuestas"}
              onClick={handleComplete}
              disabled={complete.isPending}
              loading={complete.isPending}
            />
          </div>
        </SceneWrapper>
      )}
    </>
  );
}
