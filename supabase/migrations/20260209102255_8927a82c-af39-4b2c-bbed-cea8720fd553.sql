
-- Protagonist chat conversations (one per user + protagonist pair)
CREATE TABLE public.protagonist_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protagonist_name TEXT NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  user_persona TEXT, -- how the protagonist sees/addresses the user in their world
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, protagonist_name, book_title)
);

-- Individual messages in each conversation
CREATE TABLE public.protagonist_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.protagonist_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_protagonist_conversations_user ON public.protagonist_conversations(user_id);
CREATE INDEX idx_protagonist_messages_conversation ON public.protagonist_messages(conversation_id, created_at);

-- Enable RLS
ALTER TABLE public.protagonist_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protagonist_messages ENABLE ROW LEVEL SECURITY;

-- RLS: users can only access their own conversations
CREATE POLICY "Users can view their own protagonist conversations"
ON public.protagonist_conversations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own protagonist conversations"
ON public.protagonist_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own protagonist conversations"
ON public.protagonist_conversations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own protagonist conversations"
ON public.protagonist_conversations FOR DELETE USING (auth.uid() = user_id);

-- Messages: access through conversation ownership
CREATE POLICY "Users can view messages in their conversations"
ON public.protagonist_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.protagonist_conversations pc
  WHERE pc.id = conversation_id AND pc.user_id = auth.uid()
));

CREATE POLICY "Users can insert messages in their conversations"
ON public.protagonist_messages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.protagonist_conversations pc
  WHERE pc.id = conversation_id AND pc.user_id = auth.uid()
));

CREATE POLICY "Users can delete messages in their conversations"
ON public.protagonist_messages FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.protagonist_conversations pc
  WHERE pc.id = conversation_id AND pc.user_id = auth.uid()
));

-- Auto-update timestamp trigger
CREATE TRIGGER update_protagonist_conversations_updated_at
BEFORE UPDATE ON public.protagonist_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
