# Treinamentos La Benig

Plataforma de treinamentos internos da La Benig: catalogo estilo Netflix
(curso → capitulo → aula), trilha sequencial com liberacao automatica,
questionarios com banco de perguntas rotativo, e paineis de gestor por
setor (Comercial, RH, Operacoes).

## Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Supabase](https://supabase.com) (Postgres + Auth + Row Level Security)
- CSS puro (sem framework), replicando o design do prototipo original
- Videos hospedados no OneDrive, embutidos via iframe

## Como rodar localmente

```bash
npm install
cp .env.local.example .env.local
# preencha SUPABASE_SERVICE_ROLE_KEY no .env.local (Supabase > Project
# Settings > API > service_role) e ajuste DEFAULT_PASSWORD se quiser
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Regras de negocio

- Cada colaborador enxerga so os cursos do proprio setor, mais os cursos
  marcados como visiveis para todos os setores.
- A trilha e sequencial: a aula N+1 so libera depois que a aula N foi
  confirmada como assistida e, se tiver questionario, aprovada com nota
  >= 70%.
- Nao ha rastreamento automatico de "% assistido" (o OneDrive nao expoe
  isso) — o colaborador confirma manualmente com o botao "Ja assisti essa
  aula".
- Cada setor tem gestor(es), que administram cursos/capitulos/aulas e o
  banco de perguntas do proprio setor, cadastram colaboradores e resetam
  senha esquecida.
- O banco de perguntas de cada aula deve ter mais perguntas cadastradas do
  que o numero sorteado por tentativa, pra reduzir repeticao entre colegas
  fazendo o questionario ao mesmo tempo.

## Seguranca

- RLS no Postgres restringe cada colaborador ao proprio setor (ou cursos
  marcados como visiveis para todos) e cada gestor ao proprio setor.
- A tabela `perguntas` (banco de questoes) nunca e exposta via RLS para
  colaboradores — so gestores podem fazer select direto nela (pra montar o
  banco de perguntas). Colaboradores recebem as perguntas sorteadas (sem a
  resposta certa) atraves de uma rota de servidor com a service role key,
  que tambem faz a correcao do questionario e a criacao/reset de conta de
  colaborador.

## Deploy

Projeto pensado pra deploy na Vercel, com as variaveis de ambiente de
`.env.local.example` configuradas no projeto (`SUPABASE_SERVICE_ROLE_KEY`
precisa ser adicionada manualmente, ela nunca fica em nenhum arquivo do
repositorio).
