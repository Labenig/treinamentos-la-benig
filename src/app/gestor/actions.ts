"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGestorAtual } from "@/lib/auth";

function str(formData: FormData, campo: string): string {
  return String(formData.get(campo) ?? "").trim();
}

function num(formData: FormData, campo: string, padrao = 0): number {
  const v = Number(formData.get(campo));
  return Number.isFinite(v) ? v : padrao;
}

// ---------- Cursos ----------

export async function criarCurso(formData: FormData) {
  const gestor = await getGestorAtual();
  const supabase = await createClient();

  // Gestor geral (setor_id nulo) administra todos os setores e precisa
  // escolher pra qual o curso vai; gestor de setor sempre cria no proprio.
  const setorId = gestor.setor_id ?? str(formData, "setor_id");
  if (!setorId) {
    throw new Error("Selecione o setor do curso.");
  }

  const { data, error } = await supabase
    .from("cursos")
    .insert({
      titulo: str(formData, "titulo"),
      categoria: str(formData, "categoria") || null,
      descricao: str(formData, "descricao") || null,
      cor_inicio: str(formData, "cor_inicio") || "#c9a227",
      cor_fim: str(formData, "cor_fim") || "#7a5c12",
      letra: str(formData, "letra") || str(formData, "titulo").charAt(0).toUpperCase(),
      setor_id: setorId,
      visivel_todos_setores: formData.get("visivel_todos_setores") === "on",
      ordem: num(formData, "ordem", 0),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Nao foi possivel criar o curso.");
  }

  revalidatePath("/gestor");
  redirect(`/gestor/cursos/${data.id}`);
}

export async function atualizarCurso(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");

  await supabase
    .from("cursos")
    .update({
      titulo: str(formData, "titulo"),
      categoria: str(formData, "categoria") || null,
      descricao: str(formData, "descricao") || null,
      cor_inicio: str(formData, "cor_inicio") || "#c9a227",
      cor_fim: str(formData, "cor_fim") || "#7a5c12",
      letra: str(formData, "letra") || null,
      visivel_todos_setores: formData.get("visivel_todos_setores") === "on",
      ordem: num(formData, "ordem", 0),
    })
    .eq("id", id);

  revalidatePath("/gestor");
  revalidatePath(`/gestor/cursos/${id}`);
  redirect(`/gestor/cursos/${id}`);
}

export async function excluirCurso(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");

  await supabase.from("cursos").delete().eq("id", id);

  revalidatePath("/gestor");
  redirect("/gestor");
}

// ---------- Capitulos ----------

export async function criarCapitulo(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const cursoId = str(formData, "curso_id");

  await supabase.from("capitulos").insert({
    curso_id: cursoId,
    titulo: str(formData, "titulo"),
    ordem: num(formData, "ordem", 0),
  });

  revalidatePath(`/gestor/cursos/${cursoId}`);
  redirect(`/gestor/cursos/${cursoId}`);
}

export async function atualizarCapitulo(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");
  const cursoId = str(formData, "curso_id");

  await supabase
    .from("capitulos")
    .update({ titulo: str(formData, "titulo"), ordem: num(formData, "ordem", 0) })
    .eq("id", id);

  revalidatePath(`/gestor/cursos/${cursoId}`);
  redirect(`/gestor/cursos/${cursoId}`);
}

export async function excluirCapitulo(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");
  const cursoId = str(formData, "curso_id");

  await supabase.from("capitulos").delete().eq("id", id);

  revalidatePath(`/gestor/cursos/${cursoId}`);
  redirect(`/gestor/cursos/${cursoId}`);
}

// ---------- Aulas ----------

export async function criarAula(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const capituloId = str(formData, "capitulo_id");
  const cursoId = str(formData, "curso_id");

  await supabase.from("aulas").insert({
    capitulo_id: capituloId,
    titulo: str(formData, "titulo"),
    duracao: str(formData, "duracao") || null,
    video_url: str(formData, "video_url") || null,
    ordem: num(formData, "ordem", 0),
    perguntas_por_tentativa: num(formData, "perguntas_por_tentativa", 2),
  });

  revalidatePath(`/gestor/cursos/${cursoId}`);
  redirect(`/gestor/cursos/${cursoId}`);
}

export async function atualizarAula(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");
  const cursoId = str(formData, "curso_id");

  await supabase
    .from("aulas")
    .update({
      titulo: str(formData, "titulo"),
      duracao: str(formData, "duracao") || null,
      video_url: str(formData, "video_url") || null,
      ordem: num(formData, "ordem", 0),
      perguntas_por_tentativa: num(formData, "perguntas_por_tentativa", 2),
    })
    .eq("id", id);

  revalidatePath(`/gestor/cursos/${cursoId}`);
  redirect(`/gestor/cursos/${cursoId}`);
}

export async function excluirAula(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");
  const cursoId = str(formData, "curso_id");

  await supabase.from("aulas").delete().eq("id", id);

  revalidatePath(`/gestor/cursos/${cursoId}`);
  redirect(`/gestor/cursos/${cursoId}`);
}

// ---------- Banco de perguntas ----------

function extrairOpcoes(formData: FormData): string[] {
  const opcoes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const valor = str(formData, `opcao_${i}`);
    if (valor) opcoes.push(valor);
  }
  return opcoes;
}

export async function criarPergunta(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const aulaId = str(formData, "aula_id");

  await supabase.from("perguntas").insert({
    aula_id: aulaId,
    enunciado: str(formData, "enunciado"),
    opcoes: extrairOpcoes(formData),
    correta: num(formData, "correta", 0),
  });

  revalidatePath(`/gestor/aulas/${aulaId}/perguntas`);
  redirect(`/gestor/aulas/${aulaId}/perguntas`);
}

export async function atualizarPergunta(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");
  const aulaId = str(formData, "aula_id");

  await supabase
    .from("perguntas")
    .update({
      enunciado: str(formData, "enunciado"),
      opcoes: extrairOpcoes(formData),
      correta: num(formData, "correta", 0),
    })
    .eq("id", id);

  revalidatePath(`/gestor/aulas/${aulaId}/perguntas`);
  redirect(`/gestor/aulas/${aulaId}/perguntas`);
}

export async function excluirPergunta(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");
  const aulaId = str(formData, "aula_id");

  await supabase.from("perguntas").delete().eq("id", id);

  revalidatePath(`/gestor/aulas/${aulaId}/perguntas`);
  redirect(`/gestor/aulas/${aulaId}/perguntas`);
}

// ---------- Colaboradores ----------

export async function atualizarPapelColaborador(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");
  const papel = str(formData, "papel");

  if (papel !== "colaborador" && papel !== "gestor") {
    throw new Error("Papel invalido.");
  }

  await supabase.from("colaboradores").update({ papel }).eq("id", id);

  revalidatePath("/gestor/colaboradores");
  redirect("/gestor/colaboradores");
}
