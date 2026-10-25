# IBN Rondonópolis — site oficial

Site da Igreja Batista Nacional de Rondonópolis · **ibnrondonopolis.com**

React + Tailwind + Supabase, publicado no GitHub Pages.

## Como funciona

- **Funciona sozinho desde já**: sem o Supabase conectado, o site usa o conteúdo padrão de `src/lib/defaults.js`
  (cultos, ministérios, eventos, Pix, textos) e o formulário de contato envia pelo WhatsApp.
- **Galeria**: cada álbum é uma pasta pública do Google Drive. O GitHub Actions lê as pastas **a cada hora**
  e publica `gallery.json` — fotos novas aparecem sozinhas, sem chave de API.
  Opcional: com uma *Google Drive API key* (no admin → Textos & Pix → Galeria) as fotos aparecem na hora.
- **Próximo culto**: contagem regressiva calculada pela agenda, no fuso de Cuiabá.
- **Ao vivo**: no admin, cole o link da live e ative. Para testar sem admin: `?aovivo=teste` no fim do endereço.
- **Logo**: arquivo oficial em `public/img/logo.png` (branco, fundo transparente). Para trocar, substitua esse arquivo.

## Ligar o painel /admin (uma vez)

1. Crie um projeto grátis em https://supabase.com
2. SQL Editor → cole e rode `supabase/schema.sql`
3. Authentication → Users → *Add user* (seu e-mail e senha) e rode a última linha do schema com seu e-mail
4. Supabase → Project Settings → API: copie **Project URL** e **anon public key**
5. GitHub → Settings → Secrets and variables → Actions → **Variables**: crie
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
6. Actions → Deploy → *Run workflow*. Pronto: entre em `ibnrondonopolis.com/admin`.

Segurança: mensagens e pedidos de oração só podem ser **inseridos** pelo público; leitura apenas por admins (RLS).

## Domínio

No registro do domínio, aponte:
- `A` → 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- `www` `CNAME` → ljhonatta.github.io

## Desenvolvimento

```bash
npm install
npm run dev
```

## Área do membro (Fase 2A)

- `/entrar`: login, criar conta (fica **pendente** até a liderança aprovar) e recuperação de senha.
- `/minha-area`: início (próximo culto + ao vivo), pedidos de oração, perfil (foto, dados, avisos, exclusão LGPD), sino de notificações.
- `/admin` mostra abas conforme o papel: **Super Admin** (tudo, aprova membros e define papéis), **Intercessão/Pastoral** (orações e mensagens, inclusive confidenciais), **Tesouraria** (auditoria; financeiro chega na Fase 2B).
- Banco: `supabase/migrations/` (aplicar com `supabase db push`). Projeto Supabase: `zgzgmabttwvaezoffwds`.
- Primeiro Super Admin: depois de criar a conta pelo site, rode no SQL Editor:
  `update profiles set status = 'ativo', roles = '{membro,super_admin}' where email = 'EMAIL';`
- Contribuições e Projeto Espaço Novo aparecem como "Em breve" até as Fases 2B e 2C.
