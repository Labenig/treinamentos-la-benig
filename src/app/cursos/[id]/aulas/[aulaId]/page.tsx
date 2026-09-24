import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getColaboradorAtual } from "@/lib/auth";
import type { Aula, AulaMaterial } from "@/lib/database.types";
import AulaView from "@/components/AulaView";

const URL_MATERIAL_VALIDA_SEGUNDOS = 60 * 60; // 1h — da tempo de sobra pra
// abrir a pagina e baixar o material sem precisar recarregar.

export default async function AulaPage({
  params,
}: {
  params: Promise<{ id: string; aulaId: string }>;
}) {
  const { id: cursoId, aulaId } = await params;
  const colaborador = await getColaboradorAtual();
  const supabase = await createClient();

  const { data: aula } = await supabase
    .from("aulas")
    .select("*")
    .eq("id", aulaId)
    .maybeSingle<Aula>();

  if (!aula) {
    notFound();
  }

  const { data: liberada } = await supabase.rpc("aula_esta_liberada", {
    p_colaborador_id: colaborador.id,
    p_aula_id: aulaId,
  });

  if (!liberada) {
    redirect(`/cursos/${cursoId}`);
  }

  const { data: temQuiz } = await supabase.rpc("aula_tem_quiz", { p_aula_id: aulaId });

  const { data: progresso } = await supabase
    .from("progresso_aulas")
    .select("assistiu_em, aprovado")
    .eq("colaborador_id", colaborador.id)
    .eq("aula_id", aulaId)
    .maybeSingle();

  const { data: materiaisBrutos } = await supabase
    .from("aula_materiais")
    .select("*")
    .eq("aula_id", aulaId)
    .order("criado_em", { ascending: true });

  // Bucket e privado: cada material precisa de uma URL assinada (respeita
  // a mesma RLS de visibilidade de curso/setor) pra poder ser baixado.
  const materiais = await Promise.all(
    ((materiaisBrutos ?? []) as AulaMaterial[]).map(async (material) => {
      const { data: assinada } = await supabase.storage
        .from("aula-materiais")
        .createSignedUrl(material.storage_path, URL_MATERIAL_VALIDA_SEGUNDOS, {
          download: material.nome_arquivo,
        });
      return {
        id: material.id,
        nome: material.nome_arquivo,
        tamanhoBytes: material.tamanho_bytes,
        url: assinada?.signedUrl ?? null,
      };
    })
  );

  return (
    <div className="app-shell">
      <main className="main">
        <AulaView
          cursoId={cursoId}
          aula={aula}
          temQuiz={!!temQuiz}
          assistiuEm={progresso?.assistiu_em ?? null}
          aprovado={progresso?.aprovado ?? false}
          materiais={materiais.filter((m) => m.url)}
        />
      </main>
    </div>
  );
}
