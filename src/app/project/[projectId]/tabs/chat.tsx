"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';
import { MessageCircle, Trash2, Loader2, Sparkles, Bot, SendHorizonal, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MentionsInput, Mention } from 'react-mentions';
import MessageBubble from '../MessageBubble';
import TypingAnimation from '../TypingAnimation';
import checkPro from '../checkPremium';
import { OpenAI } from 'openai';
import supabase from '@/lib/supabase';
import { useParams } from 'next/navigation';

// Update the Chat component props interface
interface ChatProps {
  project: any;
  supabase: any;
  selectedChatId: string;
  onChatSelect: (chatId: string) => void;
  chats: any[];
  onChatsUpdate: (chats: any[]) => void;
}
const api = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_AIML_API_KEY,
  dangerouslyAllowBrowser: true,
  baseURL: "https://api.aimlapi.com/v1/"
});

interface ChatMessage {
  id: string;
  chat_id: string;
  project_id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
  agent_id?: string | null;
  mentions?: string | null;
  user_id?: string;
  sources?: any[];
  isError?: boolean;
  output_type?: 'text' | 'image' | 'video' | 'audio';
  media_url?: string;
}

interface Agent {
  id: string;
  name: string;
  instructions?: string;
  model: string;
  model_params?: any;
  context_type: 'all' | 'agent' | 'fresh';
  context_folder?: string;
  output_type: 'text' | 'image' | 'video' | 'audio';
}

const Chat = ({ project, selectedChatId, onChatSelect, chats, onChatsUpdate }: ChatProps) => {
  const params = useParams();
  const projectId = params.projectId as string;

  const [prompt, setPrompt] = useState('');
  // const [AllChats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [lastUsedAgentId, setLastUsedAgentId] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connected');
  const [isPremium, setIsPremium] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useUser();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Check if user is premium
  useEffect(() => {
    const determinePro = async () => {
      if (user) {
        const pro = await checkPro();
        setIsPremium(pro);
      }
    }

    determinePro();
  }, [user]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendingMessage, scrollToBottom]);

  // Fetch data with error handling
  const fetchData = useCallback(async (table: string, queryParams: Record<string, any>, setter: Function, errorMsg: string) => {
    try {
      let query = supabase.from(table).select('*');

      // Apply all query parameters
      Object.entries(queryParams).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query;

      if (error) throw error;
      setter(data || []);
    } catch (error) {
      console.error(`Error fetching ${table}:`, error);
      toast.error(errorMsg);
    }
  }, [supabase]);

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('project_id', project.id);

      if (error) throw error;
      setAgents(data || []);

      // Update mention suggestions
      const suggestions = (data || []).map((agent: Agent) => ({
        id: agent.id,
        display: agent.name,
        output_type: agent.output_type,
      }));
      setMentionSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    }
  }, [project.id, supabase]);

  // Fetch chat messages
  const fetchChatMessages = useCallback(async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  }, [project.id, supabase]);

  // Check message limits
  const checkMessageLimit = useCallback(async (): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];

    const { data: todayMessages, error: countError } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('user_id', user?.id)
      .eq('role', 'user')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (countError) {
      console.error('Error checking message count:', countError);
      throw new Error('Failed to check message limit');
    }

    const messageCount = todayMessages?.length || 0;

    // if (isPremium && messageCount >= 1000) {
    //   throw new Error('Daily message limit reached. Pro users can send up to 1000 messages per day.');
    // }

    // if (!isPremium && messageCount >= 3) {
    //   throw new Error('Daily message limit reached. Free users can send up to 3 messages per day. Upgrade to Pro for more messages.');
    // }

    return true;
  }, [isPremium, supabase, user?.id]);

  // Parse mentions from message
  const parseMentions = useCallback((text: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        name: match[1],
        id: match[2],
      });
    }

    return {
      plainText: text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1'),
      mentions
    };
  }, []);

  // Build context messages for AI
  const buildContextMessages = useCallback(async (agent: Agent, currentPrompt: string) => {
    const contextMessages = [];

    // Add system message with agent instructions
    contextMessages.push({
      role: 'system',
      content: `You are an AI assistant named ${agent.name}. ${agent.instructions || ''}`
    });

    // Add context from saved responses if context_folder is specified
    if (agent.context_folder) {
      try {
        const { data: savedResponses, error: folderError } = await supabase
          .from('saved_responses')
          .select('*')
          .eq('folder_id', agent.context_folder)
          .eq('project_id', project.id)
          .order('created_at', { ascending: true });

        if (!folderError && savedResponses?.length) {
          savedResponses.forEach((response: any) => {
            contextMessages.push({
              role: 'system',
              content: `[Saved Context: ${response.title}] ${response.content}`
            });
          });
        }
      } catch (error) {
        console.error('Error loading context folder:', error);
      }
    }

    // Get relevant chat messages based on context type
    let chatMessages: ChatMessage[] = [];

    if (agent.context_type === 'all') {
      chatMessages = messages
        .filter(msg => msg.chat_id === selectedChatId && !msg.isError)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (agent.context_type === 'agent') {
      chatMessages = messages
        .filter(msg =>
          msg.chat_id === selectedChatId &&
          !msg.isError &&
          (msg.agent_id === agent.id || msg.role === 'user')
        )
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    // Add current prompt if not fresh context
    if (agent.context_type !== 'fresh') {
      chatMessages.push({
        id: 'temp',
        chat_id: selectedChatId,
        project_id: project.id,
        role: 'user',
        content: currentPrompt,
        created_at: new Date().toISOString()
      } as ChatMessage);
    } else {
      // For fresh context, only add the current prompt
      chatMessages = [{
        id: 'temp',
        chat_id: selectedChatId,
        project_id: project.id,
        role: 'user',
        content: currentPrompt,
        created_at: new Date().toISOString()
      } as ChatMessage];
    }

    // Process conversation messages
    const conversationMessages = [];
    let lastRole = null;

    for (const msg of chatMessages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        if (lastRole === null || lastRole !== msg.role) {
          conversationMessages.push({
            role: msg.role,
            content: msg.content
          });
          lastRole = msg.role;
        } else {
          conversationMessages[conversationMessages.length - 1] = {
            role: msg.role,
            content: msg.content
          };
        }
      }
    }

    // Ensure conversation starts with user message
    while (conversationMessages.length > 0 && conversationMessages[0].role === 'assistant') {
      conversationMessages.shift();
    }

    // Ensure conversation ends with user message
    if (conversationMessages.length > 0 && conversationMessages[conversationMessages.length - 1].role !== 'user') {
      conversationMessages.push({
        role: 'user',
        content: currentPrompt
      });
    }

    return [...contextMessages, ...conversationMessages];
  }, [messages, project.id, selectedChatId, supabase]);

  // Generate content based on output type
  const generateContent = useCallback(async (agent: Agent, finalMessages: any[]) => {
    let response;
    try {
      switch (agent.output_type) {
        case 'image':
          // Generate image using DALL-E or similar model
          response = await fetch('https://api.aimlapi.com/v1/images/generations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AIML_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: agent.model,
              prompt: finalMessages[finalMessages.length - 1].content,
            }),
          });

          const data = await response.json();

          return {
            content: `Generated image for: "${finalMessages[finalMessages.length - 1].content}"`,
            output_type: 'image',
            media_url: data.images[0]?.url
          }

        case 'video':
          // For video generation, you might use a different API
          // This is a placeholder - adjust based on your video generation API
          response = await fetch('https://api.example.com/video/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AIML_API_KEY}`
            },
            body: JSON.stringify({
              prompt: finalMessages[finalMessages.length - 1].content,
              model: agent.model
            })
          });

          const videoData = await response.json();
          return {
            content: `Generated video for: "${finalMessages[finalMessages.length - 1].content}"`,
            output_type: 'video',
            media_url: videoData.url
          };

        case 'audio':
          // For audio generation, using TTS models
          response = await api.audio.speech.create({
            model: agent.model,
            voice: "alloy",
            input: finalMessages[finalMessages.length - 1].content,
          });

          // Convert response to blob and create URL
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);

          return {
            content: `Generated audio for: "${finalMessages[finalMessages.length - 1].content}"`,
            output_type: 'audio',
            media_url: audioUrl
          };

        default: // text
          response = await api.chat.completions.create({
            model: agent.model,
            messages: finalMessages,
            stream: true,
            max_tokens: 16384,
            ...agent.model_params
          });

          let accumulatedContent = '';
          for await (const chunk of response as unknown as AsyncIterable<any>) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              accumulatedContent += content;
            }
          }

          return {
            content: accumulatedContent,
            output_type: 'text',
            media_url: null
          };
      }
    } catch (error) {
      console.error(`Error generating ${agent.output_type}:`, error);
      throw new Error(`Failed to generate ${agent.output_type}`);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (retryLastMessage = false) => {
    if ((!prompt.trim() && !retryLastMessage) || !selectedChatId || sendingMessage) return;

    let messageToSend = retryLastMessage ? messages[messages.length - 2]?.content || prompt : prompt;

    try {
      setSendingMessage(true);
      setConnectionStatus('connecting');

      // Check message limits
      if (!retryLastMessage) {
        await checkMessageLimit();
      }

      // Parse mentions
      const { plainText: plainTextContent, mentions } = parseMentions(messageToSend);

      // Add user message if not retrying
      if (!retryLastMessage) {
        const userMessage: ChatMessage = {
          id: crypto.randomUUID(),
          chat_id: selectedChatId,
          project_id: project.id,
          content: plainTextContent,
          role: 'user',
          created_at: new Date().toISOString(),
          mentions: mentions.length > 0 ? JSON.stringify(mentions) : null,
          user_id: user?.id,
          agent_id: null,
          output_type: 'text'
        };

        setMessages(prev => [...prev, userMessage]);
        setPrompt('');

        // Save user message to database
        const { error } = await supabase.from('chat_messages').insert(userMessage);
        if (error) throw new Error('Failed to save message');
      }

      // Determine agents to process
      let agentsToProcess: Agent[] = [];

      if (mentions.length > 0) {
        agentsToProcess = mentions.map(mention =>
          agents.find(a => a.id === mention.id) as Agent
        ).filter(Boolean);
      } else if (lastUsedAgentId) {
        const lastAgent = agents.find(a => a.id === lastUsedAgentId);
        if (lastAgent) agentsToProcess = [lastAgent];
      } else if (agents.length > 0) {
        agentsToProcess = [agents[0]];
      }

      if (agentsToProcess.length === 0) {
        throw new Error('No agents available. Please create an agent first.');
      }

      setConnectionStatus('connected');

      // Process each agent
      for (const agent of agentsToProcess) {
        setLastUsedAgentId(agent.id);

        // Build context messages
        const finalMessages = await buildContextMessages(agent, messageToSend);

        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          chat_id: selectedChatId,
          project_id: project.id,
          content: '',
          role: 'assistant',
          agent_id: agent.id,
          created_at: new Date().toISOString(),
          mentions: null,
          user_id: user?.id,
          sources: [],
          output_type: agent.output_type,
          // media_url: null
        };

        setMessages(prev => [...prev, aiMessage]);

        // Generate content based on output type
        const generatedContent = await generateContent(agent, finalMessages);

        // Update the message with the generated content
        setMessages((prev: any) =>
          prev.map((msg: any) =>
            msg.id === aiMessage.id
              ? {
                ...msg,
                content: generatedContent.content,
                output_type: generatedContent.output_type,
                media_url: generatedContent.media_url
              }
              : msg
          )
        );

        // Save to database
        const { error: aiError } = await supabase.from('chat_messages').insert({
          ...aiMessage,
          content: generatedContent.content,
          output_type: generatedContent.output_type,
          media_url: generatedContent.media_url,
          sources: null,
        });

        if (aiError) {
          console.error('Error saving AI message:', aiError);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionStatus('error');

      toast.error(error instanceof Error ? error.message : 'Failed to send message');

      // Add error message
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        chat_id: selectedChatId,
        project_id: project.id,
        content: `❌ **Error**: ${error instanceof Error ? error.message : 'Something went wrong'}. Please try again.`,
        role: 'assistant',
        created_at: new Date().toISOString(),
        isError: true,
        agent_id: null,
        mentions: null,
        user_id: user?.id,
        output_type: 'text'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSendingMessage(false);
    }
  }, [
    prompt, selectedChatId, sendingMessage, messages, user, agents, lastUsedAgentId,
    checkMessageLimit, parseMentions, buildContextMessages, generateContent, project.id, supabase
  ]);

  // Retry last message
  const retryMessage = useCallback(() => {
    sendMessage(true);
  }, [sendMessage]);

  // Initialize data
  useEffect(() => {
    if (project.id) {
      fetchAgents();
    }
  }, [project.id, fetchAgents]);

  useEffect(() => {
    if (selectedChatId) {
      fetchChatMessages(selectedChatId);
    }
  }, [selectedChatId, fetchChatMessages]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setNewChatDialogOpen(true);
      }

      // Ctrl/Cmd + S to save the last AI response
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const lastAIMessage = [...messages].reverse().find(msg =>
          msg.role === 'assistant' && !msg.isError
        );
        if (lastAIMessage) {
          console.log('Save last AI response:', lastAIMessage.content);
          // Implement save logic here
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messages]);

  const memoizedMessages = useMemo(() => messages, [messages]);

  return (
    <div className="">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedChatId ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="space-y-6 max-w-md">
              <div className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center">
                <Sparkles className="h-12 w-12" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  Welcome to your AI Chat
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Select a chat from the sidebar or create a new one to start conversing with your AI agents.
                  Use <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded font-mono text-sm">@mentions</span> to
                  talk to specific agents.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-3"
            >
              <div className="max-w-6xl mx-auto space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="h-10 w-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Start the conversation!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                      Type your message below to begin chatting with your AI agents.
                      Use @mentions to direct your message to specific agents.
                    </p>
                  </div>
                ) : (
                  <>
                    {memoizedMessages.map((message: ChatMessage, index: number) => (
                      <MessageBubble
                        key={message.id} // Make sure you have stable IDs, not index
                        message={message}
                        agents={agents}
                        onRetry={message.role === 'assistant' && index === messages.length - 1 ? retryMessage : undefined}
                        projectId={projectId}
                        chatId={selectedChatId}
                        responseStatus={sendingMessage && index === messages.length - 1 ? 'loading' : message.isError ? 'error' : 'completed'}
                      />
                    ))}

                    {/* Typing indicator */}
                    {sendingMessage && (
                      <TypingAnimation
                        agentName={
                          lastUsedAgentId
                            ? agents.find(a => a.id === lastUsedAgentId)?.name
                            : agents[0]?.name
                        }
                      />
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="fixed max-w-[50%] m-auto bottom-3 right-0 left-0">
              <div className="">
                {/* Agent suggestions bar */}
                {agents.length > 0 && !sendingMessage && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Sparkles className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Agents:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {agents.map(agent => (
                        <button
                          key={agent.id}
                          onClick={() => setPrompt(prev => prev + `@[${agent.name}](${agent.id}) `)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          <Bot className="h-3 w-3 mr-1" />
                          @{agent.name}
                          <span className="ml-1 text-xs opacity-70">
                            ({agent.output_type})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input area */}
                <div className="flex gap-4 items-end ">
                  <div className="flex-1">
                    <MentionsInput
                      className="w-full rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-100 shadow-lg transition-all duration-300 ease-in-out focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 hover:shadow-xl"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={
                        agents.length > 0
                          ? "Type your message... Use @ to mention agents ✨"
                          : "Type your message..."
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (prompt.trim()) {
                            sendMessage();
                          }
                        }
                      }}
                      style={{
                        control: {
                          minHeight: '60px',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                        },
                        highlighter: {
                          padding: '16px 20px',
                          minHeight: '60px',
                        },
                        input: {
                          padding: '16px 20px',
                          border: 'none',
                          outline: 'none',
                          background: 'transparent',
                          fontSize: '15px',
                          fontWeight: '400',
                          color: 'inherit',
                          minHeight: '60px',
                          lineHeight: '1.5',
                        },
                        suggestions: {
                          border: '1px solid rgb(226 232 240)',
                          borderRadius: '16px',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.05)',
                          backdropFilter: 'blur(12px)',
                          marginTop: '8px',
                          overflow: 'hidden',
                          zIndex: 50,
                        }
                      }}
                    >
                      <Mention
                        trigger="@"
                        data={mentionSuggestions}
                        displayTransform={(id, display) => `@${display}`}
                        markup="@[__display__](__id__)"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          borderRadius: '8px',
                          padding: '4px',
                          fontWeight: '600',
                          color: 'transparent',
                          marginRight: '2px',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          transition: 'all 0.3s ease',
                        }}
                        renderSuggestion={(suggestion, search, highlightedDisplay) => (
                          <div className="py-3 px-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-700 dark:hover:to-slate-600 cursor-pointer transition-all duration-200 flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm group-hover:scale-110 transition-transform duration-200">
                              {suggestion.display?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                                {highlightedDisplay}
                              </span>
                            </div>
                          </div>
                        )}
                      />
                    </MentionsInput>
                  </div>

                  <Button
                    className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out disabled:opacity-50 disabled:hover:scale-100 group"
                    disabled={(!prompt.trim() && !sendingMessage) || agents.length === 0 || sendingMessage}
                    onClick={() => sendMessage()}
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    ) : (
                      <SendHorizonal className="h-5 w-5 text-white group-hover:translate-x-0.5 transition-transform duration-200" />
                    )}
                  </Button>
                </div>

                {/* Help text */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>Press Enter to send, Shift+Enter for new line</span>
                    {agents.length === 0 && (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No agents available
                      </span>
                    )}
                  </div>
                  <span>{prompt.length}/2000</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;