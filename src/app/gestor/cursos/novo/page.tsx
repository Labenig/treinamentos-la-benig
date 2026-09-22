import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import { criarCurso } from "@/app/gestor/actions";
import type { Setor } from "@/lib/database.types";

export default async function NovoCursoPage() {
  const gestor = await getGestorAtual();
  const ehGestorGeral = gestor.setor_id === null;

  let setores: Setor[] = [];
  if (ehGestorGeral) {
    const supabase = await createClient();
    const { data } = await supabase.from("setores").select("*").order("nome");
    setores = data ?? [];
  }

  return (
    <div className="app-shell">
      <main className="main">
        <Link href="/gestor" className="back-btn">
          ← Voltar
        </Link>
        <p className="auth-title" style={{ marginBottom: 18 }}>
          Novo curso
        </p>

        <form action={criarCurso}>
          {ehGestorGeral && (
            <>
              <label className="field-label" htmlFor="setor_id">
                Setor
              </label>
              <select id="setor_id" name="setor_id" className="field-input" required defaultValue="">
                <option value="" disabled>
                  Selecione o setor
                </option>
                {setores.map((setor) => (
                  <option key={setor.id} value={setor.id}>
                    {setor.nome}
                  </option>
                ))}
              </select>
            </>
          )}

          <label className="field-label" htmlFor="titulo">
            Titulo
          </label>
          <input id="titulo" name="titulo" className="field-input" required />

          <label className="field-label" htmlFor="categoria">
            Categoria (agrupa os cursos na vitrine)
          </label>
          <input id="categoria" name="categoria" className="field-input" />

          <label className="field-label" htmlFor="descricao">
            Descricao
          </label>
          <textarea id="descricao" name="descricao" className="field-input" rows={3} />

          <label className="field-label" htmlFor="letra">
            Letra do poster
          </label>
          <input id="letra" name="letra" className="field-input" maxLength={2} />

          <label className="field-label" htmlFor="cor_inicio">
            Cor inicial do poster
          </label>
          <input
            id="cor_inicio"
            name="cor_inicio"
            type="color"
            className="field-input"
            defaultValue="#c9a227"
          />

          <label className="field-label" htmlFor="cor_fim">
            Cor final do poster
          </label>
          <input
            id="cor_fim"
            name="cor_fim"
            type="color"
            className="field-input"
            defaultValue="#7a5c12"
          />

          <label className="field-label" htmlFor="ordem">
            Ordem de exibicao
          </label>
          <input id="ordem" name="ordem" type="number" className="field-input" defaultValue={0} />

          <label className="opt" style={{ marginTop: 10 }}>
            <input type="checkbox" name="visivel_todos_setores" />
            Visivel para todos os setores (nao so o meu)
          </label>

          <button type="submit" className="btn btn-primary">
            Criar curso
          </button>
        </form>
      </main>
    </div>
  );
}
