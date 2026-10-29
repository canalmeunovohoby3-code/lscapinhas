# Supabase — Pedidos personalizados LS Case

> Projeto alvo informado: `owqaotnqpkuyngmtyolp`
> (`https://owqaotnqpkuyngmtyolp.supabase.co`).
>
> A CLI Supabase disponível neste ambiente está autenticada em outra conta/projeto e
> não lista esse projeto. Por isso, a migração ainda NÃO foi aplicada remotamente.
> Aplique pelo SQL Editor com a conta proprietária ou autentique a CLI na conta correta.
> Não há tokens/senhas neste arquivo.

Esta pasta prepara a infraestrutura da etapa 1 do sistema de pedidos. O site atual
continua funcionando exatamente como antes, com o fluxo de solicitação por
WhatsApp. Nenhuma migração foi aplicada remotamente porque ainda não há um projeto
Supabase vinculado a este repositório.

## O que existe hoje no projeto

- React 18 + Vite 5 + TypeScript.
- React Router para as rotas públicas.
- Catálogo estático de marcas/modelos e capinhas.
- Solicitação atual salva em `localStorage` e enviada pelo WhatsApp.
- Nenhum backend, banco, autenticação ou storage de arquivos.
- Cliente Supabase preparado em `src/lib/supabase.ts` e tipos em
  `src/types/orders.ts`.
- Migração SQL em `supabase/migrations/20261028230000_custom_orders.sql`.

## 1. Criar ou vincular o projeto Supabase

1. Crie um projeto no painel do Supabase (ou use um já existente do proprietário).
2. Em **Project Settings > API**, obtenha:
   - Project URL
   - anon public key
3. Não copie a `service_role` para o frontend.

## 2. Aplicar a migração

Opção A — SQL Editor:

- Abra o SQL Editor do Supabase.
- Cole todo o conteúdo de
  `supabase/migrations/20261028230000_custom_orders.sql`.
- Execute.

Opção B — Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push
```

A migração cria:

- `public.orders`
- `public.order_items`
- `public.order_images`
- `public.admin_users`
- enum `public.order_status`
- funções `create_custom_order`, `attach_order_images`, `is_admin` e
  `can_upload_order_image`
- bucket privado `order-images`
- políticas RLS e de Storage

## 3. Configurar autenticação do administrador

1. Em **Authentication > Providers**, desabilite cadastros públicos de novos
   usuários (o painel terá um único proprietário/equipe autorizada).
2. Em **Authentication > Users**, crie o usuário administrador com e-mail e senha
   fortes. Confirme o e-mail se necessário.
3. Copie o UUID do usuário criado.
4. No SQL Editor, vincule o usuário à allowlist:

```sql
insert into public.admin_users (user_id)
values ('<UUID_DO_USUARIO_ADMIN>')
on conflict (user_id) do nothing;
```

Nenhuma senha ou credencial administrativa está neste repositório. Não crie
usuários fictícios.

## 4. Variáveis de ambiente

Localmente, copie `.env.example` para `.env.local` e preencha:

```env
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

Na Vercel, configure as mesmas duas variáveis em **Settings > Environment
Variables** para Production, Preview e Development. A anon key é pública por
natureza, mas só é segura porque as políticas RLS estão ativas.

Nunca crie variáveis `VITE_SUPABASE_SERVICE_ROLE_KEY`. A `service_role` ignora
RLS e só pode ser usada em ambiente de servidor confiável, se algum dia for
necessário.

## 5. Verificação de segurança

No SQL Editor:

```sql
select id, public
from storage.buckets
where id = 'order-images';
```

O resultado deve ser `public = false`.

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('orders', 'order_items', 'order_images', 'admin_users');
```

Todas devem ter `rowsecurity = true`.

Teste com a anon key (sem service_role):

- `select` em `orders` deve retornar vazio/erro de permissão.
- upload para o bucket sem um pedido válido deve falhar.
- login do admin deve permitir leitura dos pedidos e geração de URLs assinadas.

## 6. Fluxo previsto para as próximas etapas

1. O formulário público monta os itens (marca/modelo/quantidade).
2. Chama `create_custom_order(...)`, que retorna o UUID do pedido.
3. Faz upload das imagens no bucket privado em:
   `orders/<order_id>/<uuid>.<ext>`
4. Chama `attach_order_images(order_id, imagens)` para registrar os caminhos.
5. O painel administrativo autenticado lê pedidos/itens/imagens.
6. Para exibir uma imagem, o painel gera uma URL assinada de curta duração
   (`createSignedUrl`) usando o cliente autenticado. O bucket não é público.

As imagens não ficam no banco: o banco guarda apenas o caminho
(`storage_path`), nome, tipo e tamanho.

## 7. Próximo passo recomendado

Implementar o formulário público de envio de imagens usando:

- `create_custom_order`
- upload para `order-images`
- `attach_order_images`

Depois disso, implementar o painel protegido com Supabase Auth, listagem de
pedidos, itens, imagens e URLs assinadas. Não usar a `service_role` no navegador.
