import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Aula, Pergunta } from "@/lib/database.types";

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { data: aula } = await supabase
    .from("aulas")
    .select("*")
    .eq("id", id)
    .maybeSingle<Aula>();
  if (!aula) {
    return NextResponse.json({ error: "Aula nao encontrada." }, { status: 404 });
  }

  const { data: liberada } = await supabase.rpc("aula_esta_liberada", {
    p_colaborador_id: user.id,
    p_aula_id: id,
  });
  if (!liberada) {
    return NextResponse.json({ error: "Essa aula ainda esta bloqueada." }, { status: 403 });
  }

  const { data: progresso } = await supabase
    .from("progresso_aulas")
    .select("assistiu_em")
    .eq("colaborador_id", user.id)
    .eq("aula_id", id)
    .maybeSingle();
  if (!progresso?.assistiu_em) {
    return NextResponse.json(
      { error: "Confirme que assistiu a aula antes de fazer o questionario." },
      { status: 400 }
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro de configuracao no servidor." },
      { status: 500 }
    );
  }
  const { data: perguntas } = await admin
    .from("perguntas")
    .select("id, enunciado, opcoes")
    .eq("aula_id", id);

  const pool = (perguntas ?? []) as Pick<Pergunta, "id" | "enunciado" | "opcoes">[];
  if (pool.length === 0) {
    return NextResponse.json({ error: "Essa aula ainda nao tem questionario." }, { status: 400 });
  }

  const quantidade = Math.min(aula.perguntas_por_tentativa || 2, pool.length);
  const sorteadas = embaralhar(pool).slice(0, quantidade);

  return NextResponse.json({
    perguntas: sorteadas.map((p) => ({
      id: p.id,
      enunciado: p.enunciado,
      opcoes: p.opcoes,
    })),
  });
}
