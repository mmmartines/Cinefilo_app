-- Tabelas para o Bate-papo de Filmes (Realtime) no Supabase

-- 1. Cria a tabela de Chats
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id integer NOT NULL,
  movie_title text NOT NULL,
  movie_poster text,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Cria a tabela de Membros do Chat
CREATE TABLE IF NOT EXISTS public.chat_members (
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (chat_id, user_id)
);

-- 3. Cria a tabela de Mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  user_avatar text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar o RLS (Row Level Security) para proteção, mas permitindo acesso autenticado
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Usuários autenticados podem ver chats" ON public.chats FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem criar chats" ON public.chats FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver membros" ON public.chat_members FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem adicionar membros" ON public.chat_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem ver mensagens" ON public.messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Usuários autenticados podem enviar mensagens" ON public.messages FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Habilitar o Realtime para a tabela de mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
