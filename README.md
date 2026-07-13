# 🍿 Cinéfilo — App

> **Seu diário de cinema definitivo.** Descubra, avalie, acompanhe amigos e mergulhe em estatísticas incríveis sobre seus hábitos cinematográficos.

---

## ✨ Funcionalidades

| Área | Descrição |
|---|---|
| 🎬 **Catálogo** | Explore filmes populares via TMDB, filtre por gênero, ano e nome. Roleta aleatória de filmes. |
| ⭐ **Avaliação Emocional** | Notas de 1-5 estrelas + tags de emoção que formam o seu Radar de Emoções único. |
| 📋 **Minhas Listas** | Crie listas ilimitadas (Watchlist, listas customizadas compartilháveis por link). |
| 📊 **Stats & Gamificação** | XP, Patentes (Espectador Casual → Mestre do Cinema), Pódio de Gêneros, Radar de Emoções. |
| 👥 **Amigos** | Adicione amigos pela `#Tag` única. Feed de atividades, ranking entre amigos. |
| 💬 **Clube do Filme** | Chat em tempo real por filme — crie grupos com amigos para discutir o que assistiram. |
| 🔔 **Notificações Push** | Alertas nativos via Expo Notifications (novas mensagens, desafios, etc.). |
| 🤖 **IA Personalizada** | Recomendações geradas por IA com base no histórico do usuário. |
| 🎟️ **Cinemas Próximos** | Localização de cinemas via GPS. |
| 📱 **Compartilhamento** | Exporte um card de estatísticas para postar nas redes sociais. |

---

## 🏗️ Arquitetura

O projeto segue uma arquitetura **Domain-Driven Design (Feature-based)**, separando responsabilidades de forma clara e escalável:

```
src/
├── app/                   # Expo Router (thin wrappers — apenas roteamento)
├── features/              # Domínios de funcionalidade
│   ├── auth/              # Login, Registro
│   ├── catalog/           # Catálogo de filmes
│   ├── chat/              # Clubes de Filme (Chat em tempo real)
│   ├── feed/              # Feed de amigos
│   ├── friends/           # Amigos e pedidos de amizade
│   ├── lists/             # Listas customizadas
│   ├── movie/             # Detalhes do filme
│   ├── myMovies/          # Meus filmes assistidos / watchlist
│   ├── profile/           # Perfil do usuário
│   └── stats/             # Estatísticas e gamificação
│       └── hooks/         # Lógica (use[Feature].ts)
│       └── screens/       # UI ([Feature]Screen.tsx)
├── services/              # Clientes externos (database, api, supabase, notifications)
├── components/            # Componentes globais reutilizáveis
├── contexts/              # Providers de contexto global (AlertContext, etc.)
└── utils/                 # Utilitários (badges, formatadores, etc.)
```

**Convenção de nome:** Toda lógica fica em `use[Feature].ts` dentro de `hooks/`. As telas `.tsx` apenas importam o hook e renderizam a UI.

---

## 🧰 Stack Tecnológica

- **React Native / Expo SDK 57**
- **Expo Router** — File-based routing com tipagem
- **TypeScript** — Em todo o projeto
- **Supabase** — Autenticação (Auth), banco de dados relacional, Realtime (chat)
- **TanStack Query (React Query v5)** — Cache inteligente, offline-first, background refetch
- **Moti** — Animações fluidas a 60fps (via Reanimated)
- **Expo Notifications** — Push Notifications nativas
- **TMDB API** — Dados de filmes, gêneros, trailers, streaming
- **Expo Linear Gradient / Blur View** — Glassmorphism e efeitos visuais premium
- **Inter (Google Fonts)** — Tipografia global
- **EAS Build** — Builds de produção na nuvem

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Conta no [Supabase](https://supabase.com) (gratuito)
- Chave de API do [TMDB](https://www.themoviedb.org/settings/api)

### Passo a passo

1. **Clone o repositório:**
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd Cinefilo/app
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na pasta `app/` com:
   ```env
   EXPO_PUBLIC_TMDB_API_KEY=sua_chave_tmdb
   EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
   EXPO_PUBLIC_API_URL=https://cinefilo-server.vercel.app
   ```

4. **Configure o banco de dados (Supabase):**
   - Acesse o SQL Editor do seu projeto Supabase
   - Execute o arquivo `supabase_schema.sql` presente na raiz do projeto

5. **Inicie o app:**
   ```bash
   npx expo start -c
   ```
   - Escaneie o QR Code com o app **Expo Go** (iOS/Android)
   - Pressione `a` para emulador Android, `i` para iOS

---

## 📦 Build para as Lojas (EAS)

As configurações já estão no `eas.json`. Certifique-se de ter o EAS CLI instalado:
```bash
npm install -g eas-cli
eas login
```

| Plataforma | Comando |
|---|---|
| Android (Preview) | `eas build -p android --profile preview` |
| Android (Produção) | `eas build -p android --profile production` |
| iOS (Preview) | `eas build -p ios --profile preview` |
| iOS (Produção) | `eas build -p ios --profile production` |

---

## 📄 Licença
MIT — veja o arquivo [LICENSE](./LICENSE).
