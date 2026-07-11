# Cinefilo 🍿

Cinefilo é o seu diário de filmes pessoal definitivo, desenvolvido em React Native e Expo. Descubra, avalie, crie listas personalizadas e mergulhe em estatísticas incríveis sobre seu hábito de consumir cinema!

## Recursos Principais

- **Catálogo Dinâmico:** Explore filmes populares usando a API do TMDB, filtrando por ano ou pesquisando nomes específicos.
- **Avaliação Emocional:** Dê notas aos filmes, escreva resenhas e selecione tags de emoção (Feliz, Empolgado, Tenso, Triste, etc.) que formam o seu perfil de espectador.
- **Minhas Listas (Customizadas):** Crie e gerencie listas ilimitadas de filmes (Ex: "Filmes para Chorar", "Maratona de Sexta").
- **Quero Ver:** Salve filmes rapidamente em uma lista de Watchlist para não esquecer o que deseja assistir no futuro.
- **Estatísticas e Gamificação:** O aplicativo rastreia seu tempo de tela, calcula sua "classificação" (de Espectador Casual a Mestre do Cinema), mostra seus gêneros favoritos e gera um radar de emoções.
- **Integração com YouTube (Trailers):** Assista aos trailers oficiais dos filmes através de um player nativo embutido no próprio app.
- **Onde Assistir (Streaming):** Descubra instantaneamente se o filme está disponível na Netflix, Prime Video, Max, etc., no Brasil.
- **Compartilhamento (Exportar Perfil):** Exporte uma imagem (snapshot) incrível com suas estatísticas principais e ranking para postar nas redes sociais.

## Tecnologias Utilizadas

- **React Native / Expo SDK 57:** Framework principal.
- **Expo Router:** Navegação entre abas e pilhas (file-based routing).
- **Axios:** Integração direta com a TMDB API.
- **AsyncStorage:** Persistência de dados offline no dispositivo.
- **React Native SVG / Charts:** Geração de gráficos, como o radar emocional e pizza de gêneros.
- **React Native YouTube Iframe:** Reprodução nativa de trailers.
- **Expo Sharing / View Shot:** Captura de tela do aplicativo e integração com janela de compartilhamento nativa.

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
   - Crie um arquivo `.env` na raiz do projeto (este arquivo é ignorado no repositório por padrão para manter a segurança).
   - Adicione sua chave de API do TMDB V3: `EXPO_PUBLIC_TMDB_API_KEY=sua_chave_aqui`
4. Inicie o projeto:
   ```bash
   npx expo start -c
   ```
5. Use o aplicativo **Expo Go** no seu celular para escanear o QR Code, inicie um emulador local (Android/iOS), ou visualize pelo navegador pressionando a tecla `w`.

---
*Cinéfilo App - Todos os Direitos Reservados.*
