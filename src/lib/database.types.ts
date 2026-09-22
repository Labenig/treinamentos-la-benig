// Tipos minimos escritos a mao (nao gerados) para as tabelas da
// plataforma de treinamentos. Cobre soh os campos que a aplicacao usa.

export type Papel = "colaborador" | "gestor";

export interface Setor {
  id: string;
  nome: string;
}

export interface Colaborador {
  id: string;
  nome: string;
  email: string;
  // Nulo somente pra gestor "geral" (administra todos os setores de uma
  // vez); colaborador comum e gestor de setor sempre tem um setor_id.
  setor_id: string | null;
  papel: Papel;
  senha_trocada: boolean;
  criado_em: string;
}

export interface Curso {
  id: string;
  categoria: string | null;
  titulo: string;
  descricao: string | null;
  cor_inicio: string | null;
  cor_fim: string | null;
  letra: string | null;
  setor_id: string;
  visivel_todos_setores: boolean;
  ordem: number;
  criado_em: string;
}

export interface Capitulo {
  id: string;
  curso_id: string;
  titulo: string;
  ordem: number;
}

export interface Aula {
  id: string;
  capitulo_id: string;
  titulo: string;
  duracao: string | null;
  video_url: string | null;
  ordem: number;
  perguntas_por_tentativa: number;
  criado_em: string;
}

export interface Pergunta {
  id: string;
  aula_id: string;
  enunciado: string;
  opcoes: string[];
  correta: number;
}

export interface ProgressoAula {
  id: string;
  colaborador_id: string;
  aula_id: string;
  assistiu_em: string | null;
  aprovado: boolean;
}

export interface TentativaQuestionario {
  id: string;
  colaborador_id: string;
  aula_id: string;
  perguntas_sorteadas: string[];
  acertos: number;
  total: number;
  nota: number;
  aprovado: boolean;
  criado_em: string;
}

export interface TrilhaAula {
  aula_id: string;
  liberada: boolean;
  tem_quiz: boolean;
  assistiu_em: string | null;
  aprovado: boolean | null;
}

// Minimo necessario para o generic do supabase-js/ssr compilar.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
