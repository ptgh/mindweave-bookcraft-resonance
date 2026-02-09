import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PersistedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  usedMemory?: boolean;
  learnedInsight?: string;
}

interface UseChatPersistenceOptions {
  userId: string | undefined;
  isOpen: boolean;
}

export function useChatPersistence({ userId, isOpen }: UseChatPersistenceOptions) {
  const [messages, setMessages] = useState<PersistedMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const { toast } = useToast();

  // Initialize or retrieve existing conversation when chat opens
  useEffect(() => {
    const initConversation = async () => {
      if (isOpen && !conversationId && userId) {
        setIsLoadingConversation(true);
        try {
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
          const { data: existingConversation } = await supabase
            .from('chat_conversations')
            .select('id, title, updated_at')
            .eq('user_id', userId)
            .gte('updated_at', twentyFourHoursAgo)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

          if (existingConversation) {
            setConversationId(existingConversation.id);

            const { data: existingMessages } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('conversation_id', existingConversation.id)
              .order('created_at', { ascending: true });

            if (existingMessages && existingMessages.length > 0) {
              const loadedMessages: PersistedMessage[] = existingMessages.map(msg => ({
                id: msg.id,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: new Date(msg.created_at || Date.now()),
              }));
              setMessages(loadedMessages);
              setShowQuickActions(false);
            }
          } else {
            const { data, error } = await supabase
              .from('chat_conversations')
              .insert({ user_id: userId, title: 'Floating Assistant' })
              .select()
              .single();

            if (!error && data) {
              setConversationId(data.id);
            }
          }
        } catch (error) {
          console.error('Failed to initialize conversation:', error);
        } finally {
          setIsLoadingConversation(false);
        }
      }
    };

    initConversation();
  }, [isOpen, conversationId, userId]);

  const saveMessage = useCallback(async (role: 'user' | 'assistant', content: string) => {
    if (!conversationId) return;

    try {
      await supabase
        .from('chat_messages')
        .insert({ conversation_id: conversationId, role, content });

      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [conversationId]);

  const clearConversation = useCallback(async () => {
    try {
      if (conversationId) {
        await supabase.from('chat_messages').delete().eq('conversation_id', conversationId);
        await supabase.from('chat_conversations').delete().eq('id', conversationId);
      }

      setMessages([]);
      setShowQuickActions(true);
      setConversationId(null);

      toast({
        title: "Conversation cleared",
        description: "Ready for a fresh start (memory retained)",
      });
    } catch (error) {
      console.error('Error clearing conversation:', error);
      setMessages([]);
      setShowQuickActions(true);
      setConversationId(null);
    }
  }, [conversationId, toast]);

  return {
    messages,
    setMessages,
    conversationId,
    isLoadingConversation,
    showQuickActions,
    setShowQuickActions,
    saveMessage,
    clearConversation,
  };
}
