"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Aula } from "@/lib/database.types";

interface Pergunta {
  id: string;
  enunciado: string;
  opcoes: string[];
}

interface Resultado {
  acertos: number;
  total: number;
  nota: number;
  aprovado: boolean;
}

type Etapa = "video" | "quiz" | "resultado";

export default function AulaView({
  cursoId,
  aula,
  temQuiz,
  assistiuEm,
  aprovado,
}: {
  cursoId: string;
  aula: Aula;
  temQuiz: boolean;
  assistiuEm: string | null;
  aprovado: boolean;
}) {
  const router = useRouter();
  const [jaAssistiu, setJaAssistiu] = useState(!!assistiuEm);
  const [jaAprovado, setJaAprovado] = useState(aprovado);
  const [etapa, setEtapa] = useState<Etapa>("video");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function confirmarAssistiu() {
    setErro(null);
    setCarregando(true);
    const res = await fetch(`/api/aulas/${aula.id}/assistir`, { method: "POST" });
    setCarregando(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setErro(body.error ?? "Nao foi possivel confirmar.");
      return;
    }

    setJaAssistiu(true);
    router.refresh();

    if (!temQuiz) {
      setJaAprovado(true);
    }
  }

  async function iniciarQuiz() {
    setErro(null);
    setCarregando(true);
    const res = await fetch(`/api/aulas/${aula.id}/quiz`);
    const body = await res.json().catch(() => ({}));
    setCarregando(false);

    if (!res.ok) {
      setErro(body.error ?? "Nao foi possivel carregar o questionario.");
      return;
    }

    setPerguntas(body.perguntas ?? []);
    setRespostas({});
    setEtapa("quiz");
  }

  async function enviarQuiz() {
    setErro(null);
    setCarregando(true);
    const res = await fetch(`/api/aulas/${aula.id}/quiz/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        respostas: Object.entries(respostas).map(([pergunta_id, opcao_index]) => ({
          pergunta_id,
          opcao_index,
        })),
      }),
    });
    const body = await res.json().catch(() => ({}));
    setCarregando(false);

    if (!res.ok) {
      setErro(body.error ?? "Nao foi possivel enviar o questionario.");
      return;
    }

    setResultado(body);
    setJaAprovado(body.aprovado);
    setEtapa("resultado");
    router.refresh();
  }

  const todasRespondidas =
    perguntas.length > 0 && perguntas.every((p) => respostas[p.id] !== undefined);

  return (
    <>
      <Link href={`/cursos/${cursoId}`} className="back-btn">
        ← Voltar
      </Link>

      <p className="trilha-label" style={{ marginBottom: 4 }}>
        {aula.titulo}
      </p>

      {etapa === "video" && (
        <>
          <div className="video-box">
            {aula.video_url ? (
              <iframe
                src={aula.video_url}
                title={aula.titulo}
                allow="autoplay; fullscreen"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            ) : (
              <p className="video-hint">
                O video dessa aula ainda nao foi cadastrado pelo gestor do
                setor.
              </p>
            )}
          </div>

          {erro && <p className="error-msg">{erro}</p>}

          {!jaAssistiu && (
            <button
              className="btn btn-primary"
              onClick={confirmarAssistiu}
              disabled={carregando}
            >
              {carregando ? "Confirmando..." : "Ja assisti essa aula"}
            </button>
          )}

          {jaAssistiu && temQuiz && !jaAprovado && (
            <button className="btn btn-primary" onClick={iniciarQuiz} disabled={carregando}>
              {carregando ? "Carregando..." : "Fazer questionario"}
            </button>
          )}

          {jaAssistiu && temQuiz && jaAprovado && (
            <>
              <p className="success-msg">Voce ja foi aprovado no questionario dessa aula.</p>
              <button className="btn btn-ghost" onClick={iniciarQuiz} disabled={carregando}>
                Refazer questionario
              </button>
            </>
          )}

          {jaAssistiu && !temQuiz && (
            <p className="success-msg">Aula concluida.</p>
          )}
        </>
      )}

      {etapa === "quiz" && (
        <div>
          {perguntas.map((pergunta, idx) => (
            <div className="quiz-q" key={pergunta.id}>
              <p>
                {idx + 1}. {pergunta.enunciado}
              </p>
              {pergunta.opcoes.map((opcao, opcaoIdx) => (
                <label className="opt" key={opcaoIdx}>
                  <input
                    type="radio"
                    name={pergunta.id}
                    checked={respostas[pergunta.id] === opcaoIdx}
                    onChange={() =>
                      setRespostas((prev) => ({ ...prev, [pergunta.id]: opcaoIdx }))
                    }
                  />
                  {opcao}
                </label>
              ))}
            </div>
          ))}

          {erro && <p className="error-msg">{erro}</p>}

          <button
            className="btn btn-primary"
            onClick={enviarQuiz}
            disabled={!todasRespondidas || carregando}
          >
            {carregando ? "Enviando..." : "Enviar respostas"}
          </button>
        </div>
      )}

      {etapa === "resultado" && resultado && (
        <div className="result-box">
          <div className="result-emoji">{resultado.aprovado ? "🎉" : "😕"}</div>
          <p className="result-title">
            {resultado.aprovado ? "Aprovado!" : "Nao foi dessa vez"}
          </p>
          <p className="result-sub">
            Voce acertou {resultado.acertos} de {resultado.total} perguntas (
            {Math.round(resultado.nota * 100)}%). A nota minima e 70%.
          </p>

          {resultado.aprovado ? (
            <Link href={`/cursos/${cursoId}`} className="btn btn-primary">
              Continuar trilha
            </Link>
          ) : (
            <button className="btn btn-primary" onClick={iniciarQuiz}>
              Tentar novamente
            </button>
          )}
        </div>
      )}
    </>
  );
}
