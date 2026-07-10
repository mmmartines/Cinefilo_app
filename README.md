# Cinefilo 🍿

Cinefilo é uma rede social focada em amantes de cinema, desenvolvida em React Native (com Expo). O objetivo do aplicativo é permitir que os usuários avaliem os filmes que assistiram, compartilhem essas avaliações com os amigos e participem de um ranking competitivo baseado no tempo total de filmes assistidos.

## Recursos Principais

- **Avaliação de Filmes:** Descubra e dê nota aos filmes que você assistiu usando a API do TMDB.
- **Rede Social:** Adicione amigos e veja o que eles estão assistindo e avaliando.
- **Ranking de Tempo:** Entre em uma competição saudável com seus amigos! O aplicativo soma o tempo de duração de todos os filmes que você marcou como assistido e cria um ranking de quem passou mais tempo assistindo filmes.

## Tecnologias Utilizadas

- **React Native / Expo:** Framework principal para desenvolvimento mobile (iOS e Android).
- **Expo Router:** Para navegação entre telas de forma baseada em arquivos.
- **Axios:** Para requisições HTTP e consumo da API de filmes.
- **TMDB API (The Movie Database):** Base de dados para busca de filmes, imagens, duração e sinopses.

## Como Executar o Projeto

1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto.
   - Adicione sua chave de API do TMDB: `EXPO_PUBLIC_TMDB_API_KEY=sua_chave_aqui` (nota: atualmente a chave pode estar configurada em `src/services/api.ts`).

4. Inicie o projeto:
   ```bash
   npm run start
   ```
5. Use o aplicativo **Expo Go** no seu celular para escanear o QR Code, ou inicie um emulador local (Android/iOS).

## Estrutura Atual
- `src/app`: Telas da aplicação (utilizando o roteamento do Expo Router).
- `src/components`: Componentes reutilizáveis, como o `MovieCard`.
- `src/services`: Configuração de serviços externos, como a API do TMDB.
