import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Colaborador } from "@/lib/database.types";

export type ColaboradorComSetor = Colaborador & { setor_nome: string | null };

/**
 * Busca o colaborador logado (com o nome do setor). So deve ser chamado em
 * paginas ja protegidas pelo middleware (ou seja, praticamente qualquer
 * pagina fora de /login). Se por algum motivo nao houver sessao ou o
 * registro em `colaboradores` nao existir, manda para /login.
 */
export async function getColaboradorAtual(): Promise<ColaboradorComSetor> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: colaborador } = await supabase
    .from("colaboradores")
    .select("*, setores(nome)")
    .eq("id", user.id)
    .maybeSingle();

  if (!colaborador) {
    redirect("/login");
  }

  const { setores, ...resto } = colaborador as unknown as Colaborador & {
    setores: { nome: string } | null;
  };

  return { ...resto, setor_nome: setores?.nome ?? null };
}

/**
 * Igual a getColaboradorAtual, mas exige que o colaborador seja gestor.
 * Usado no topo de toda pagina/action sob /gestor.
 */
export async function getGestorAtual(): Promise<ColaboradorComSetor> {
  const colaborador = await getColaboradorAtual();
  if (colaborador.papel !== "gestor") {
    redirect("/");
  }
  return colaborador;
}
