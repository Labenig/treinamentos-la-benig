import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";
import { criarAula } from "@/app/gestor/actions";
import type { Capitulo } from "@/lib/database.types";

export default async function NovaAulaPage({
  params,
}: {
  params: Promise<{ capId: string }>;
}) {
  const { capId } = await params;
  await getGestorAtual();
  const supabase = await createClient();

  const { data: capitulo } = await supabase
    .from("capitulos")
    .select("*")
    .eq("id", capId)
    .maybeSingle<Capitulo>();

  if (!capitulo) {
    notFound();
  }

  return (
    <div className="app-shell">
      <main className="main">
        <Link href={`/gestor/cursos/${capitulo.curso_id}`} className="back-btn">
          ← Voltar
        </Link>
        <p className="auth-title" style={{ marginBottom: 4 }}>
          Nova aula
        </p>
        <p className="admin-row-sub" style={{ marginBottom: 18 }}>
          Capitulo: {capitulo.titulo}
        </p>

        <form action={criarAula}>
          <input type="hidden" name="capitulo_id" value={capitulo.id} />
          <input type="hidden" name="curso_id" value={capitulo.curso_id} />

          <label className="field-label" htmlFor="titulo">
            Titulo da aula
          </label>
          <input id="titulo" name="titulo" className="field-input" required />

          <label className="field-label" htmlFor="video_url">
            Link do video (embed do OneDrive)
          </label>
          <input id="video_url" name="video_url" className="field-input" placeholder="https://..." />
          <p className="field-hint">
            No OneDrive: Compartilhar → Incorporar, e cole aqui so o link de
            dentro do src do iframe.
          </p>

          <label className="field-label" htmlFor="duracao">
            Duracao (opcional, ex: 12min)
          </label>
          <input id="duracao" name="duracao" className="field-input" />

          <label className="field-label" htmlFor="perguntas_por_tentativa">
            Perguntas sorteadas por tentativa de questionario
          </label>
          <input
            id="perguntas_por_tentativa"
            name="perguntas_por_tentativa"
            type="number"
            className="field-input"
            defaultValue={2}
            min={0}
          />
          <p className="field-hint">
            Cadastre mais perguntas do que esse numero no banco de perguntas
            da aula pra reduzir repeticao entre colegas.
          </p>

          <label className="field-label" htmlFor="ordem">
            Ordem
          </label>
          <input id="ordem" name="ordem" type="number" className="field-input" defaultValue={0} />

          <button type="submit" className="btn btn-primary">
            Criar aula
          </button>
        </form>
      </main>
    </div>
  );
}
