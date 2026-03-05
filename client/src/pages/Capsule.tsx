import { useState, useCallback, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronRight, GripVertical, CheckCircle2, Lock } from "lucide-react";

// ─── CDN URLs for scene images ───────────────────────────────────────────────
const SCENE_IMAGES = {
  scene1: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene1_ai-RmBvavYKyWJ3KKvaesV2ih.webp",
  scene2: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene2_climate-4mTTLLwMkFbExdWohyKrot.webp",
  scene3: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene3_robots-CrDC32VGuCoSH94E4PjgvJ.webp",
  scene4: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene4_university-R3xoCy8EKTMJuTqT97d9md.webp",
  scene5: "https://d2xsxph8kpxj0f.cloudfront.net/310519663382525743/NSsjz5xLcv4BRGb3wY3Lut/scene5_global-Myk7EcWD3r8C7QVs3ZbuGn.webp",
};

const TOTAL_STEPS = 12; // access + 5 scenes + 5 interactions + final

// ─── Types ────────────────────────────────────────────────────────────────────
interface Answers {
  interaction1: string;
  interaction2: string[];
  interaction3: string;
  interaction4Opinion: string;
  interaction4Text: string;
  interaction5: string[];
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
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SCENE_IMAGES.scene1})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass-card rounded-2xl p-8 text-center">
          {/* Logo / Title */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 border border-primary/40 mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Universidad 2040
            </h1>
            <p className="text-white/60 text-sm">
              Cápsula Interactiva · Acceso exclusivo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Tu nombre (opcional)"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-primary/60 focus:bg-white/15 transition-all"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Contraseña de acceso"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-primary/60 focus:bg-white/15 transition-all"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <Button
              type="submit"
              disabled={verify.isPending}
              className="w-full py-3 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all"
            >
              {verify.isPending ? "Verificando..." : "Ingresar a la cápsula"}
            </Button>
          </form>

          <p className="mt-6 text-white/30 text-xs">
            Duración estimada: 6 minutos
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10">
      <div
        className="h-full bg-primary progress-glow transition-all duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Scene Wrapper ────────────────────────────────────────────────────────────
function SceneWrapper({
  image,
  children,
  step,
}: {
  image: string;
  children: React.ReactNode;
  step: number;
}) {
  return (
    <div key={step} className="min-h-screen flex flex-col relative overflow-hidden scene-fade-in">
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16">
        {children}
      </div>
    </div>
  );
}

// ─── Narration Block ──────────────────────────────────────────────────────────
function Narration({ title, text }: { title: string; text: string }) {
  return (
    <div className="max-w-2xl text-center mb-10">
      <h2 className="text-4xl font-bold text-white mb-4 gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>
        {title}
      </h2>
      <p className="text-white/80 text-lg leading-relaxed">{text}</p>
    </div>
  );
}

// ─── Option Card ──────────────────────────────────────────────────────────────
function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`option-card w-full text-left px-5 py-4 rounded-xl glass-card text-white font-medium ${selected ? "selected" : ""}`}
    >
      <span className={`inline-block w-4 h-4 rounded-full border-2 mr-3 align-middle transition-colors ${selected ? "bg-primary border-primary" : "border-white/40"}`} />
      {label}
    </button>
  );
}

// ─── Checkbox Card ────────────────────────────────────────────────────────────
function CheckboxCard({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled && !checked}
      className={`option-card w-full text-left px-5 py-4 rounded-xl glass-card text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed ${checked ? "selected" : ""}`}
    >
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 mr-3 align-middle transition-all ${checked ? "bg-primary border-primary" : "border-white/40"}`}>
        {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
      </span>
      {label}
    </button>
  );
}

// ─── Ranking Item ─────────────────────────────────────────────────────────────
function RankingList({
  items,
  onChange,
}: {
  items: string[];
  onChange: (items: string[]) => void;
}) {
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
    <div className="space-y-2 w-full max-w-md">
      {items.map((item, i) => (
        <div
          key={item}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragEnter={() => onDragEnter(i)}
          onDragOver={e => e.preventDefault()}
          onDragEnd={onDragEnd}
          className={`drag-item flex items-center gap-3 px-5 py-4 rounded-xl glass-card text-white font-medium border-2 border-transparent ${dragOver === i ? "drag-over" : ""}`}
        >
          <span className="text-white/40 font-bold text-lg w-6 text-center">{i + 1}</span>
          <GripVertical className="w-4 h-4 text-white/40 flex-shrink-0" />
          <span className="flex-1">{item}</span>
        </div>
      ))}
      <p className="text-white/40 text-xs text-center mt-2">Arrastrá para reordenar</p>
    </div>
  );
}

// ─── Final Screen ─────────────────────────────────────────────────────────────
function FinalScreen({ name }: { name: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SCENE_IMAGES.scene5})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
      <div className="relative z-10 max-w-2xl text-center px-4 scene-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border border-green-500/40 mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>
          ¡Gracias{name ? `, ${name}` : ""}!
        </h1>
        <p className="text-white/80 text-lg leading-relaxed mb-4">
          Completaste la cápsula interactiva <strong>Universidad 2040</strong>.
        </p>
        <p className="text-white/60 text-base leading-relaxed">
          Tus respuestas son valiosas para diseñar la universidad del futuro. El equipo las analizará para construir un modelo educativo que responda a los desafíos globales.
        </p>
        <div className="mt-8 glass-card rounded-xl px-6 py-4 inline-block">
          <p className="text-white/50 text-sm italic">
            "La universidad del futuro no es solo un lugar donde se transmite conocimiento. Es un espacio donde se crea, se experimenta y se construyen soluciones para los desafíos del mundo."
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Capsule Component ───────────────────────────────────────────────────
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
    // Save progress on each step
    await saveResponse.mutateAsync({
      sessionId,
      ...answers,
    }).catch(() => {});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [sessionId, answers, saveResponse]);

  const handleComplete = useCallback(async () => {
    if (!sessionId) return;
    try {
      await complete.mutateAsync({
        sessionId,
        studentName,
        ...answers,
      });
      setStep(TOTAL_STEPS);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("Error al guardar respuestas. Por favor, intentá de nuevo.");
    }
  }, [sessionId, studentName, answers, complete]);

  const updateAnswer = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  // ── Step 0: Access ──
  if (step === 0) return <AccessScreen onAccess={handleAccess} />;

  // ── Final ──
  if (step >= TOTAL_STEPS) return <FinalScreen name={studentName} />;

  const ContinueBtn = ({ disabled = false, label = "Continuar", onClick = next }: { disabled?: boolean; label?: string; onClick?: () => void }) => (
    <Button
      onClick={onClick}
      disabled={disabled || saveResponse.isPending}
      className="mt-6 px-8 py-3 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 transition-all flex items-center gap-2"
    >
      {label} <ChevronRight className="w-4 h-4" />
    </Button>
  );

  return (
    <>
      <ProgressBar current={step} total={TOTAL_STEPS - 1} />

      {/* ── Step 1: Scene 1 ── */}
      {step === 1 && (
        <SceneWrapper image={SCENE_IMAGES.scene1} step={step}>
          <Narration
            title="El mundo que viene"
            text="Imaginá que estamos en el año 2040. La inteligencia artificial transformó casi todas las profesiones. Las economías cambiaron. Los desafíos ambientales se volvieron urgentes. El conocimiento se produce en redes globales. En este mundo, una pregunta se volvió central: ¿Cómo deben formarse los profesionales del futuro?"
          />
          <ContinueBtn />
        </SceneWrapper>
      )}

      {/* ── Step 2: Interaction 1 ── */}
      {step === 2 && (
        <SceneWrapper image={SCENE_IMAGES.scene1} step={step}>
          <div className="max-w-xl w-full text-center">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Interacción 1 de 5</p>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              ¿Cuál de estos cambios creés que impactará más en las profesiones?
            </h2>
            <p className="text-white/50 text-sm mb-6">No hay respuesta correcta: buscamos reflexión.</p>
            <div className="space-y-3">
              {["Inteligencia artificial", "Cambio climático", "Nuevas formas de trabajo", "Globalización del conocimiento"].map(opt => (
                <OptionCard key={opt} label={opt} selected={answers.interaction1 === opt} onClick={() => updateAnswer("interaction1", opt)} />
              ))}
            </div>
            <ContinueBtn disabled={!answers.interaction1} />
          </div>
        </SceneWrapper>
      )}

      {/* ── Step 3: Scene 2 ── */}
      {step === 3 && (
        <SceneWrapper image={SCENE_IMAGES.scene2} step={step}>
          <Narration
            title="La universidad del futuro"
            text="Las universidades también tuvieron que transformarse. Ya no alcanzaba con transmitir conocimiento. Las nuevas generaciones necesitaban aprender a resolver problemas complejos, trabajar en equipos interdisciplinarios, innovar y adaptarse a contextos cambiantes. Entonces surge una nueva pregunta: ¿Cómo debería ser una universidad preparada para este mundo?"
          />
          <ContinueBtn />
        </SceneWrapper>
      )}

      {/* ── Step 4: Interaction 2 ── */}
      {step === 4 && (
        <SceneWrapper image={SCENE_IMAGES.scene2} step={step}>
          <div className="max-w-xl w-full text-center">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Interacción 2 de 5</p>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Diseñá tu universidad
            </h2>
            <p className="text-white/50 text-sm mb-6">
              Imaginá que podés diseñar una universidad desde cero. Elegí los <strong className="text-primary">3 elementos</strong> que no podrían faltar.
              <span className="ml-2 text-white/40">({answers.interaction2.length}/3 seleccionados)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                "Proyectos interdisciplinarios",
                "Prácticas en empresas",
                "Investigación",
                "Intercambio internacional",
                "Laboratorios tecnológicos",
                "Mentorías docentes",
                "Emprendimientos",
                "Cursos virtuales flexibles",
              ].map(opt => (
                <CheckboxCard
                  key={opt}
                  label={opt}
                  checked={answers.interaction2.includes(opt)}
                  disabled={answers.interaction2.length >= 3}
                  onChange={() => {
                    const cur = answers.interaction2;
                    if (cur.includes(opt)) {
                      updateAnswer("interaction2", cur.filter(x => x !== opt));
                    } else if (cur.length < 3) {
                      updateAnswer("interaction2", [...cur, opt]);
                    }
                  }}
                />
              ))}
            </div>
            <ContinueBtn disabled={answers.interaction2.length !== 3} />
          </div>
        </SceneWrapper>
      )}

      {/* ── Step 5: Scene 3 ── */}
      {step === 5 && (
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step}>
          <Narration
            title="El profesional que necesita el mundo"
            text="Hoy muchas investigaciones coinciden en algo: Los profesionales del futuro no solo necesitarán conocimientos técnicos. También necesitarán desarrollar capacidades como pensamiento crítico, creatividad, trabajo en equipo, aprendizaje permanente y responsabilidad ética. La formación universitaria deberá integrar tecnología, práctica y desarrollo humano."
          />
          <ContinueBtn />
        </SceneWrapper>
      )}

      {/* ── Step 6: Interaction 3 ── */}
      {step === 6 && (
        <SceneWrapper image={SCENE_IMAGES.scene3} step={step}>
          <div className="max-w-xl w-full text-center">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Interacción 3 de 5</p>
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              ¿Qué habilidad creés que será más importante para el futuro?
            </h2>
            <div className="space-y-3">
              {["Resolver problemas complejos", "Adaptarse al cambio", "Trabajar con tecnología", "Trabajar con otras personas"].map(opt => (
                <OptionCard key={opt} label={opt} selected={answers.interaction3 === opt} onClick={() => updateAnswer("interaction3", opt)} />
              ))}
            </div>
            <ContinueBtn disabled={!answers.interaction3} />
          </div>
        </SceneWrapper>
      )}

      {/* ── Step 7: Scene 4 ── */}
      {step === 7 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step}>
          <Narration
            title="Un posible modelo de universidad"
            text="Muchas universidades innovadoras están avanzando hacia modelos educativos que combinan formación tecnológica avanzada, aprendizaje basado en proyectos, trabajo con empresas y organizaciones, experiencias internacionales, trayectorias flexibles y desarrollo de habilidades humanas. Este tipo de modelo busca responder a los desafíos del mundo actual."
          />
          <ContinueBtn />
        </SceneWrapper>
      )}

      {/* ── Step 8: Interaction 4 ── */}
      {step === 8 && (
        <SceneWrapper image={SCENE_IMAGES.scene4} step={step}>
          <div className="max-w-xl w-full text-center">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Interacción 4 de 5</p>
            <h2 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              ¿Creés que este modelo responde a los desafíos globales?
            </h2>
            <div className="flex gap-3 justify-center mb-6">
              {["Sí", "Parcialmente", "No"].map(opt => (
                <button
                  key={opt}
                  onClick={() => updateAnswer("interaction4Opinion", opt)}
                  className={`px-6 py-3 rounded-xl font-semibold text-white border-2 transition-all ${answers.interaction4Opinion === opt ? "border-primary bg-primary/20" : "border-white/20 glass-card hover:border-primary/50"}`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="text-left">
              <label className="text-white/60 text-sm mb-2 block">¿Qué agregarías? (opcional)</label>
              <Textarea
                placeholder="Escribí tu sugerencia aquí..."
                value={answers.interaction4Text}
                onChange={e => updateAnswer("interaction4Text", e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/30 focus:border-primary/60 rounded-xl resize-none"
                rows={3}
              />
            </div>
            <ContinueBtn disabled={!answers.interaction4Opinion} />
          </div>
        </SceneWrapper>
      )}

      {/* ── Step 9: Scene 5 ── */}
      {step === 9 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <Narration
            title="Priorizar lo importante"
            text="Si tuvieras que elegir los elementos más importantes para la universidad del futuro… ¿Cuáles serían? En la siguiente pantalla podrás ordenarlos según tu criterio."
          />
          <ContinueBtn />
        </SceneWrapper>
      )}

      {/* ── Step 10: Interaction 5 ── */}
      {step === 10 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <div className="max-w-xl w-full text-center">
            <p className="text-primary text-sm font-semibold uppercase tracking-widest mb-3">Interacción 5 de 5</p>
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Ranking de prioridades
            </h2>
            <p className="text-white/50 text-sm mb-6">Arrastrá los elementos para ordenarlos de más a menos importante.</p>
            <RankingList
              items={answers.interaction5}
              onChange={items => updateAnswer("interaction5", items)}
            />
            <ContinueBtn />
          </div>
        </SceneWrapper>
      )}

      {/* ── Step 11: Final Scene ── */}
      {step === 11 && (
        <SceneWrapper image={SCENE_IMAGES.scene5} step={step}>
          <div className="max-w-2xl text-center">
            <h2 className="text-4xl font-bold text-white mb-4 gradient-text" style={{ fontFamily: "'Playfair Display', serif" }}>
              La universidad del futuro empieza hoy
            </h2>
            <p className="text-white/80 text-lg leading-relaxed mb-6">
              Los desafíos globales están transformando profundamente la educación superior. Las universidades que quieran formar profesionales para el futuro deberán repensar cómo enseñan, qué enseñan, y cómo se vinculan con el mundo.
            </p>
            <p className="text-white/60 text-base leading-relaxed mb-8">
              La universidad del futuro no es solo un lugar donde se transmite conocimiento. Es un espacio donde se crea, se experimenta y se construyen soluciones para los desafíos del mundo.
            </p>
            <ContinueBtn
              label={complete.isPending ? "Guardando respuestas..." : "Enviar mis respuestas"}
              onClick={handleComplete}
              disabled={complete.isPending}
            />
          </div>
        </SceneWrapper>
      )}
    </>
  );
}
