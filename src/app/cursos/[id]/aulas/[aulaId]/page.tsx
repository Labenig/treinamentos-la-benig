import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getColaboradorAtual } from "@/lib/auth";
import type { Aula } from "@/lib/database.types";
import AulaView from "@/components/AulaView";

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

  return (
    <div className="app-shell">
      <main className="main">
        <AulaView
          cursoId={cursoId}
          aula={aula}
          temQuiz={!!temQuiz}
          assistiuEm={progresso?.assistiu_em ?? null}
          aprovado={progresso?.aprovado ?? false}
        />
      </main>
    </div>
  );
}
