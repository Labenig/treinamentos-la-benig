import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

/**
 * Cliente Supabase com a service role key: ignora RLS por completo.
 * NUNCA importar isso num Client Component. So usar dentro de rotas de
 * servidor (app/api/**\/route.ts) e sempre depois de validar manualmente
 * quem esta fazendo a chamada (getUser() com o client normal) e se ela
 * tem permissao para a acao (ex: e gestor do setor certo).
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY nao configurada. Adicione essa variavel de ambiente (Project Settings > API no Supabase) para habilitar criacao/reset de colaboradores e correcao de questionario."
    );
  }
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
