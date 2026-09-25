"use client";

import { useEffect, useRef, useState } from "react";
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

interface Material {
  id: string;
  nome: string;
  tamanhoBytes: number | null;
  url: string | null;
}

function formatarTamanho(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Etapa = "video" | "quiz" | "resultado";

export default function AulaView({
  cursoId,
  aula,
  temQuiz,
  assistiuEm,
  aprovado,
  materiais = [],
}: {
  cursoId: string;
  aula: Aula;
  temQuiz: boolean;
  assistiuEm: string | null;
  aprovado: boolean;
  materiais?: Material[];
}) {
  const router = useRouter();
  const videoBoxRef = useRef<HTMLDivElement>(null);
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

  // Largura real da caixa do video via JS, em vez de "width: 100vw" no CSS.
  // document.documentElement.clientWidth exclui a faixa da scrollbar (o
  // que "100vw" nao faz); em telas com scrollbar reservada (comum no
  // Windows) "100vw" fica ~15-17px maior que a area visivel de verdade,
  // e como a caixa tem overflow:hidden, isso gerava overflow horizontal.
  useEffect(() => {
    function ajustarLargura() {
      const caixa = videoBoxRef.current;
      if (!caixa) return;
      const larguraVisivel = document.documentElement.clientWidth;
      caixa.style.width = `${Math.min(larguraVisivel, 720)}px`;
    }
    ajustarLargura();
    window.addEventListener("resize", ajustarLargura);
    return () => window.removeEventListener("resize", ajustarLargura);
  }, []);

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
          <div className="video-box" ref={videoBoxRef}>
            {aula.video_url ? (
              // O OneDrive bloqueia (via CSP frame-ancestors) ser exibido
              // dentro de um iframe de qualquer site que nao seja da
              // Microsoft - entao em vez de tentar embutir o video aqui,
              // abrimos o link numa aba nova do navegador.
              <a
                href={aula.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="video-watch-link"
              >
                <span className="video-play-icon">▶</span>
                <span className="video-watch-label">Assistir aula</span>
                <span className="video-watch-sub">Abre em uma nova aba</span>
              </a>
            ) : (
              <p className="video-hint">
                O video dessa aula ainda nao foi cadastrado pelo gestor do
                setor.
              </p>
            )}
          </div>

          {materiais.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p className="trilha-label" style={{ marginBottom: 6 }}>
                Materiais de apoio
              </p>
              {materiais.map((material) => (
                <a
                  key={material.id}
                  className="lesson"
                  href={material.url ?? "#"}
                  download={material.nome}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="lesson-icon">📎</span>
                  <div>
                    <p className="lesson-title">{material.nome}</p>
                    {material.tamanhoBytes ? (
                      <p className="lesson-status">{formatarTamanho(material.tamanhoBytes)}</p>
                    ) : null}
                  </div>
                </a>
              ))}
            </div>
          )}

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
