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

// Checkboxes de mesmo "name" viram varias entradas no FormData; getAll pega
// todas de uma vez (usado pros setores extras marcados no editor de curso).
function lista(formData: FormData, campo: string): string[] {
  return formData
    .getAll(campo)
    .map((v) => String(v).trim())
    .filter(Boolean);
}

// ---------- Cursos ----------

// Substitui por completo as linhas de visibilidade extra do curso em
// curso_setores (apaga tudo e reinsere so os setores marcados agora).
// setorDono nunca precisa de linha propria (ele ja enxerga o curso via
// cursos.setor_id), entao fica de fora mesmo se vier marcado por engano.
async function sincronizarSetoresExtras(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cursoId: string,
  setorIdsExtras: string[],
  setorDono: string | null
) {
  await supabase.from("curso_setores").delete().eq("curso_id", cursoId);

  const linhas = [...new Set(setorIdsExtras)]
    .filter((setorId) => setorId !== setorDono)
    .map((setorId) => ({ curso_id: cursoId, setor_id: setorId }));

  if (linhas.length > 0) {
    await supabase.from("curso_setores").insert(linhas);
  }
}

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
      cor_inicio: str(formData, "cor_inicio") || "#fea10f",
      cor_fim: str(formData, "cor_fim") || "#e95b0c",
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

  await sincronizarSetoresExtras(supabase, data.id, lista(formData, "setores_extra"), setorId);

  revalidatePath("/gestor");
  redirect(`/gestor/cursos/${data.id}`);
}

export async function atualizarCurso(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");

  const { data: cursoAtual } = await supabase
    .from("cursos")
    .select("setor_id")
    .eq("id", id)
    .maybeSingle<{ setor_id: string }>();

  await supabase
    .from("cursos")
    .update({
      titulo: str(formData, "titulo"),
      categoria: str(formData, "categoria") || null,
      descricao: str(formData, "descricao") || null,
      cor_inicio: str(formData, "cor_inicio") || "#fea10f",
      cor_fim: str(formData, "cor_fim") || "#e95b0c",
      letra: str(formData, "letra") || null,
      visivel_todos_setores: formData.get("visivel_todos_setores") === "on",
      ordem: num(formData, "ordem", 0),
    })
    .eq("id", id);

  await sincronizarSetoresExtras(
    supabase,
    id,
    lista(formData, "setores_extra"),
    cursoAtual?.setor_id ?? null
  );

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

// ---------- Materiais de apoio (PDF, doc, csv, etc.) ----------

const BUCKET_MATERIAIS = "aula-materiais";

export async function enviarMaterial(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const aulaId = str(formData, "aula_id");
  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Selecione um arquivo.");
  }

  // Nome unico no bucket (evita colisao entre arquivos com o mesmo nome em
  // aulas diferentes ou reenviados); o nome original fica guardado no
  // banco pra mostrar/baixar com o nome certo.
  const extensao = arquivo.name.includes(".")
    ? arquivo.name.slice(arquivo.name.lastIndexOf("."))
    : "";
  const caminho = `${aulaId}/${crypto.randomUUID()}${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_MATERIAIS)
    .upload(caminho, arquivo, { contentType: arquivo.type || undefined });

  if (erroUpload) {
    throw new Error(erroUpload.message);
  }

  const { error: erroInsert } = await supabase.from("aula_materiais").insert({
    aula_id: aulaId,
    nome_arquivo: arquivo.name,
    storage_path: caminho,
    tipo: arquivo.type || null,
    tamanho_bytes: arquivo.size,
  });

  if (erroInsert) {
    // Sem a linha no banco o arquivo fica orfao (ninguem enxerga ele), en-
    // tao desfaz o upload pra nao acumular lixo no bucket.
    await supabase.storage.from(BUCKET_MATERIAIS).remove([caminho]);
    throw new Error(erroInsert.message);
  }

  revalidatePath(`/gestor/aulas/${aulaId}/editar`);
  redirect(`/gestor/aulas/${aulaId}/editar`);
}

export async function excluirMaterial(formData: FormData) {
  await getGestorAtual();
  const supabase = await createClient();
  const id = str(formData, "id");
  const aulaId = str(formData, "aula_id");

  const { data: material } = await supabase
    .from("aula_materiais")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle<{ storage_path: string }>();

  await supabase.from("aula_materiais").delete().eq("id", id);

  if (material?.storage_path) {
    await supabase.storage.from(BUCKET_MATERIAIS).remove([material.storage_path]);
  }

  revalidatePath(`/gestor/aulas/${aulaId}/editar`);
  redirect(`/gestor/aulas/${aulaId}/editar`);
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

// ---------- Setores ----------

function paraColaboradores(mensagem: string, tipo: "erro" | "msg") {
  redirect(`/gestor/colaboradores?${tipo}=${encodeURIComponent(mensagem)}`);
}

// Cadastro de setor: so o gestor geral (setor_id nulo) administra todos os
// setores de uma vez, entao so ele pode criar novos. A RLS (policy
// setores_insert) tambem exige isso, essa checagem aqui e so pra devolver
// uma mensagem amigavel em vez do erro cru do Postgres.
export async function criarSetor(formData: FormData) {
  const gestor = await getGestorAtual();
  if (gestor.setor_id !== null) {
    paraColaboradores("So o gestor geral pode cadastrar setores.", "erro");
    return;
  }

  const nome = str(formData, "nome");
  if (!nome) {
    paraColaboradores("Informe o nome do setor.", "erro");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("setores").insert({ nome });

  if (error) {
    const mensagem =
      error.code === "23505" ? "Ja existe um setor com esse nome." : "Nao foi possivel criar o setor.";
    paraColaboradores(mensagem, "erro");
    return;
  }

  revalidatePath("/gestor/colaboradores");
  paraColaboradores(`Setor "${nome}" criado.`, "msg");
}

// Mover colaborador de setor: mesma regra — so o gestor geral pode, porque
// so ele enxerga/administra todos os setores ao mesmo tempo (a RLS da
// tabela colaboradores tambem bloqueia um gestor de setor tentando mover
// alguem pra fora do proprio setor).
export async function moverColaboradorSetor(formData: FormData) {
  const gestor = await getGestorAtual();
  if (gestor.setor_id !== null) {
    paraColaboradores("So o gestor geral pode mover colaboradores entre setores.", "erro");
    return;
  }

  const id = str(formData, "id");
  const setorId = str(formData, "setor_id");
  if (!setorId) {
    paraColaboradores("Selecione o setor de destino.", "erro");
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("colaboradores")
    .update({ setor_id: setorId })
    .eq("id", id);

  if (error) {
    paraColaboradores("Nao foi possivel mover o colaborador de setor.", "erro");
    return;
  }

  revalidatePath("/gestor/colaboradores");
  paraColaboradores("Colaborador movido de setor.", "msg");
}
