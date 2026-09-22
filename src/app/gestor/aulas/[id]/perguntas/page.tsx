import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import { atualizarPergunta, criarPergunta, excluirPergunta } from "@/app/gestor/actions";
import type { Aula, Pergunta } from "@/lib/database.types";

export default async function PerguntasAulaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getGestorAtual();
  const supabase = await createClient();

  const { data: aula } = await supabase
    .from("aulas")
    .select("*")
    .eq("id", id)
    .maybeSingle<Aula>();

  if (!aula) {
    notFound();
  }

  const { data: perguntas } = await supabase
    .from("perguntas")
    .select("*")
    .eq("aula_id", id)
    .order("id", { ascending: true });

  const lista = (perguntas ?? []) as Pergunta[];

  return (
    <div className="app-shell">
      <main className="main">
        <Link href={`/gestor/aulas/${id}/editar`} className="back-btn">
          ← Voltar
        </Link>
        <p className="auth-title" style={{ marginBottom: 4 }}>
          Banco de perguntas
        </p>
        <p className="admin-row-sub" style={{ marginBottom: 4 }}>
          Aula: {aula.titulo}
        </p>
        <p className="field-hint" style={{ marginBottom: 18 }}>
          {lista.length} pergunta(s) cadastrada(s) · sorteando{" "}
          {aula.perguntas_por_tentativa} por tentativa.{" "}
          {lista.length > 0 && lista.length <= aula.perguntas_por_tentativa && (
            <span style={{ color: "var(--danger)" }}>
              Cadastre mais perguntas do que o sorteio pra reduzir repeticao.
            </span>
          )}
        </p>

        {lista.map((pergunta) => (
          <details key={pergunta.id} className="admin-row" style={{ display: "block" }}>
            <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: 13.5 }}>
              {pergunta.enunciado}
            </summary>

            <form action={atualizarPergunta} style={{ marginTop: 14 }}>
              <input type="hidden" name="id" value={pergunta.id} />
              <input type="hidden" name="aula_id" value={id} />

              <label className="field-label" htmlFor={`enunciado-${pergunta.id}`}>
                Enunciado
              </label>
              <textarea
                id={`enunciado-${pergunta.id}`}
                name="enunciado"
                className="field-input"
                rows={2}
                defaultValue={pergunta.enunciado}
                required
              />

              {Array.from({ length: Math.max(pergunta.opcoes.length, 4) }).map((_, idx) => (
                <div key={idx} className="opt" style={{ cursor: "default" }}>
                  <input
                    type="radio"
                    name="correta"
                    value={idx}
                    defaultChecked={idx === pergunta.correta}
                  />
                  <input
                    type="text"
                    name={`opcao_${idx}`}
                    className="field-input"
                    style={{ marginBottom: 0 }}
                    defaultValue={pergunta.opcoes[idx] ?? ""}
                    placeholder={`Opcao ${idx + 1}`}
                  />
                </div>
              ))}

              <button type="submit" className="btn btn-primary btn-sm">
                Salvar
              </button>
            </form>

            <form action={excluirPergunta} style={{ marginTop: 8 }}>
              <input type="hidden" name="id" value={pergunta.id} />
              <input type="hidden" name="aula_id" value={id} />
              <button type="submit" className="btn btn-danger btn-sm">
                Excluir pergunta
              </button>
            </form>
          </details>
        ))}

        <p className="row-title">Nova pergunta</p>
        <form action={criarPergunta}>
          <input type="hidden" name="aula_id" value={id} />

          <label className="field-label" htmlFor="enunciado">
            Enunciado
          </label>
          <textarea id="enunciado" name="enunciado" className="field-input" rows={2} required />

          <p className="field-hint">Marque a opcao correta.</p>
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="opt" style={{ cursor: "default" }}>
              <input type="radio" name="correta" value={idx} defaultChecked={idx === 0} />
              <input
                type="text"
                name={`opcao_${idx}`}
                className="field-input"
                style={{ marginBottom: 0 }}
                placeholder={`Opcao ${idx + 1}`}
                required={idx < 2}
              />
            </div>
          ))}

          <button type="submit" className="btn btn-primary">
            Adicionar pergunta
          </button>
        </form>
      </main>
    </div>
  );
}
