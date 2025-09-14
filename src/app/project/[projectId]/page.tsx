'use client'

import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import supabase from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { AlertCircle, ArrowLeft, Bot, CheckCircle2, ChevronDown, ChevronRight, Clock, Copy, Edit3, FileText, Folder, FolderPlus, Home, Loader2, MessageCircle, Move, RefreshCw, Save, SendHorizonal, Sparkles, Trash2, User, ZoomIn } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardTitle } from '@/components/ui/card';
// Add these imports
import { Mention, MentionsInput } from 'react-mentions';
import mentionStyle from '@/styles/mentionStyles';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import OpenAI from 'openai';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';

const api = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_AIML_API_KEY,
    dangerouslyAllowBrowser: true,
    baseURL: "https://api.aimlapi.com/v1/"
});

// Enhanced Markdown Component
const MarkdownRenderer = ({ content }: { content: string }) => {
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Code copied to clipboard!');
    };

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            // className="prose prose-sm max-w-none dark:prose-invert"
            components={{
                code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';

                    if (!inline && match) {
                        return (
                            <div className="relative group">
                                <div className="flex items-center justify-between bg-gray-900 text-gray-300 px-4 py-2 rounded-t-lg text-sm">
                                    <span>{language}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2 text-gray-400 hover:text-white"
                                        onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                                <SyntaxHighlighter
                                    style={oneDark}
                                    language={language}
                                    PreTag="div"
                                    className="!mt-0 !rounded-t-none"
                                    {...props}
                                >
                                    {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                            </div>
                        );
                    }

                    return (
                        <code
                            className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono"
                            {...props}
                        >
                            {children}
                        </code>
                    );
                },
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 italic bg-blue-50 dark:bg-blue-950/30 py-2 my-4">
                        {children}
                    </blockquote>
                ),
                table: ({ children }) => (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
                            {children}
                        </table>
                    </div>
                ),
                th: ({ children }) => (
                    <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-semibold text-left">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2">
                        {children}
                    </td>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 my-2">
                        {children}
                    </ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 my-2">
                        {children}
                    </ol>
                ),
                h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100">
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-gray-100">
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">
                        {children}
                    </h3>
                ),
                p: ({ children }) => (
                    <p className="mb-3 leading-relaxed text-gray-800 dark:text-gray-200">
                        {children}
                    </p>
                ),
                a: ({ href, children }) => (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                        {children}
                    </a>
                ),
            }}
        >
            {content}
        </ReactMarkdown>
    );
};

// Typing Animation Component
const TypingAnimation = ({ agentName }: { agentName?: string }) => {
    return (
        <div className="flex items-start space-x-3 animate-pulse">
            <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                </div>
            </div>
            <div className="flex-1 min-w-0">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 max-w-[80%]">
                    <div className="flex items-center space-x-1 mb-1">
                        <Bot className="h-3 w-3 text-blue-500" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {agentName || 'Agent'} is thinking...
                        </span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Message Component
const MessageBubble = ({
    message,
    agents,
    onRetry,
    projectId,
    chatId
}: {
    message: any;
    agents: any[];
    onRetry?: () => void;
    projectId: string;
    chatId: string;
}) => {
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);

    return (
        <>
            <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${message.role === 'user'
                    ? 'bg-card'
                    : message.isError
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            {message.role === 'assistant' && !message.isError && agents.length > 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                    <Bot className="h-4 w-4" />
                                    <span className="text-xs font-medium">
                                        {agents.find(a => a.id === message.agent_id)?.name || 'AI Assistant'}
                                    </span>
                                </div>
                            )}

                            {message.isError ? (
                                <div dangerouslySetInnerHTML={{ __html: message.content }} />
                            ) : (
                                <div className="">
                                    <MarkdownRenderer content={message.content} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className='flex gap-2'>
                        {message.role === 'assistant' && onRetry && (
                            <div className="mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onRetry}
                                    className="text-xs"
                                >
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Retry
                                </Button>
                            </div>
                        )}
                        {message.role === 'assistant' && !message.isError && (
                            <Button
                                variant="secondary"
                                // size="sm"
                                // className=""
                                onClick={() => setSaveDialogOpen(true)}
                                title="Save Response"
                            >
                                <Save className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Response Dialog */}
            <SaveResponseDialog
                open={saveDialogOpen}
                onOpenChange={setSaveDialogOpen}
                responseContent={message.content}
                projectId={projectId}
                agentId={message.agent_id}
                chatId={chatId}
                originalMessageId={message.id}
            />
        </>
    );
};

// Tab Components
const OverviewTab = ({ project }: { project: any }) => (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold">Project Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Project Details</h3>
                <p><strong>Title:</strong> {project.title}</p>
                <p><strong>Created:</strong> {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Status:</strong> {project.status || 'Active'}</p>
            </div>
            <div className="p-4 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2">Quick Stats</h3>
                <p>Chats: 0</p>
                <p>Contextual Documents: </p>
            </div>
        </div>
    </div>
);

// Add this interface for mention data
interface MentionData {
    id: string;
    display: string;
}

const SaveResponseDialog = ({
    open,
    onOpenChange,
    responseContent,
    projectId,
    agentId,
    chatId,
    originalMessageId
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    responseContent: string;
    projectId: string;
    agentId?: string;
    chatId?: string;
    originalMessageId?: string;
}) => {
    const [folders, setFolders] = useState<any[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string>('');
    const [title, setTitle] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [fetchingFolders, setFetchingFolders] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Fetch all folders when dialog opens
    useEffect(() => {
        if (open) {
            fetchAllFolders();
            // Generate a default title based on content
            const defaultTitle = responseContent.slice(0, 50) + (responseContent.length > 50 ? '...' : '');
            setTitle(defaultTitle);
        }
    }, [open, responseContent]);

    const fetchAllFolders = async () => {
        try {
            setFetchingFolders(true);
            const { data, error } = await supabase
                .from('response_folders')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFolders(data || []);

            // Select the root level by default if available
            const rootFolders = data?.filter(folder => folder.parent_folder === null) || [];
            if (rootFolders.length > 0) {
                setSelectedFolderId(rootFolders[0].id);
            }
        } catch (error) {
            console.error('Error fetching folders:', error);
            toast.error('Failed to load folders');
        } finally {
            setFetchingFolders(false);
        }
    };

    const toggleFolder = (folderId: string) => {
        const newExpanded = new Set(expandedFolders);
        if (newExpanded.has(folderId)) {
            newExpanded.delete(folderId);
        } else {
            newExpanded.add(folderId);
        }
        setExpandedFolders(newExpanded);
    };

    const getSubfolders = (parentId: string | null) => {
        return folders.filter(folder => folder.parent_folder === parentId);
    };

    const getFolderPath = (folderId: string): string => {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return '';

        let path = folder.name;
        let current = folder;

        while (current.parent_folder) {
            const parent = folders.find(f => f.id === current.parent_folder);
            if (!parent) break;
            path = `${parent.name} > ${path}`;
            current = parent;
        }

        return path;
    };

    const renderFolderTree = (parentId: string | null = null, level = 0) => {
        const subfolders = getSubfolders(parentId);

        return subfolders.map(folder => (
            <div key={folder.id} className="ml-4">
                <div
                    className={`flex items-center p-2 rounded cursor-pointer ${selectedFolderId === folder.id ? 'bg-blue-100 text-black' : ''
                        }`}
                    onClick={() => setSelectedFolderId(folder.id)}
                >
                    <div className="flex items-center flex-1">
                        {/* Indentation */}
                        <div className="w-4" style={{ marginLeft: level * 16 }} />

                        {/* Expand/collapse button for folders with children */}
                        {getSubfolders(folder.id).length > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFolder(folder.id);
                                }}
                                className="p-1 mr-1"
                            >
                                {expandedFolders.has(folder.id) ? (
                                    <ChevronDown className="h-3 w-3" />
                                ) : (
                                    <ChevronRight className="h-3 w-3" />
                                )}
                            </button>
                        )}

                        {/* Placeholder for folders without children */}
                        {getSubfolders(folder.id).length === 0 && (
                            <div className="w-5 mr-1" />
                        )}

                        <Folder className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm">{folder.name}</span>
                    </div>
                </div>

                {/* Render subfolders if expanded */}
                {expandedFolders.has(folder.id) && renderFolderTree(folder.id, level + 1)}
            </div>
        ));
    };

    const saveResponse = async () => {
        if (!title.trim()) {
            toast.error('Please enter a title for the response');
            return;
        }

        if (!selectedFolderId) {
            toast.error('Please select a folder');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('saved_responses')
                .insert({
                    project_id: projectId,
                    folder_id: selectedFolderId,
                    title: title.trim(),
                    content: responseContent,
                    agent_id: agentId || null,
                    chat_id: chatId || null,
                    original_message_id: originalMessageId || null,
                });

            if (error) throw error;

            toast.success('Response saved successfully!');
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving response:', error);
            toast.error('Failed to save response');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Save className="h-5 w-5" />
                        Save Response
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-1">
                            Title
                        </label>
                        <Input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter a title for this response"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Select Folder
                        </label>

                        {/* Selected folder path */}
                        {selectedFolderId && (
                            <div className="mb-2 p-2 rounded text-sm">
                                {/* <span className="text-gray-600">Selected: </span> */}
                                {getFolderPath(selectedFolderId)}
                            </div>
                        )}

                        {fetchingFolders ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading folders...
                            </div>
                        ) : folders.length === 0 ? (
                            <div className="text-center p-4 text-gray-500">
                                <Folder className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p>No folders found. Create folders in your Response Library first.</p>
                            </div>
                        ) : (
                            <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                                {/* Root level folders */}
                                <div
                                    className={`flex items-center p-2 rounded cursor-pointer ${selectedFolderId === null ? 'bg-blue-100' : ''
                                        }`}
                                    onClick={() => setSelectedFolderId('')}
                                >
                                    <Home className="h-4 w-4 mr-2 text-gray-500" />
                                    <span className="text-sm">Root Level</span>
                                </div>

                                {renderFolderTree(null)}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={saveResponse}
                        disabled={loading || !title.trim() || !selectedFolderId}
                        className="flex items-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// export default SaveResponseDialog;

// Enhanced Chat Component
const Chat = ({ project, supabase }: { project: any; supabase: any }) => {
    const [prompt, setPrompt] = useState('');
    const [chats, setChats] = useState<any[]>([]);
    const [chatsLoading, setChatsLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [selectedChatId, setSelectedChatId] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
    const [newChatName, setNewChatName] = useState('');
    const [agents, setAgents] = useState<any[]>([]);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [lastUsedAgentId, setLastUsedAgentId] = useState('');
    const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
    const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'error'>('connected');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, sendingMessage]);

    // Fetch chats with error handling
    const fetchChats = async () => {
        try {
            setChatsLoading(true);
            const { data, error } = await supabase
                .from('chat')
                .select('*')
                .eq('project_id', project.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setChats(data || []);
        } catch (error) {
            console.error('Error fetching chats:', error);
            toast.error('Failed to load chats');
        } finally {
            setChatsLoading(false);
        }
    };

    // Fetch agents with error handling
    const fetchAgents = async () => {
        try {
            const { data, error } = await supabase
                .from('agents')
                .select('*')
                .eq('project_id', project.id);

            if (error) throw error;
            setAgents(data || []);

            // Update mention suggestions
            const suggestions = (data || []).map((agent: any) => ({
                id: agent.id,
                display: agent.name,
            }));
            setMentionSuggestions(suggestions);
        } catch (error) {
            console.error('Error fetching agents:', error);
            toast.error('Failed to load agents');
        }
    };

    // Fetch chat messages with error handling
    const fetchChatMessages = async (chatId: string) => {
        try {
            setMessagesLoading(true);
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
        } finally {
            setMessagesLoading(false);
        }
    };

    // Create new chat with enhanced UX
    const createNewChat = async () => {
        if (!newChatName.trim()) {
            toast.error('Please enter a chat name');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('chat')
                .insert({
                    project_id: project.id,
                    name: newChatName,
                })
                .select()
                .single();

            if (error) throw error;

            setChats([data, ...chats]);
            setSelectedChatId(data.id);
            setMessages([]);
            setNewChatName('');
            setNewChatDialogOpen(false);
            toast.success(`Chat "${data.name}" created successfully!`);
        } catch (error) {
            console.error('Error creating chat:', error);
            toast.error('Failed to create chat');
        }
    };

    // Delete chat with confirmation
    const deleteChat = async (chatId: string, chatName: string) => {
        try {
            const { error } = await supabase.from('chat').delete().eq('id', chatId);
            if (error) throw error;

            setChats(chats.filter(chat => chat.id !== chatId));
            if (selectedChatId === chatId) {
                setSelectedChatId('');
                setMessages([]);
            }
            toast.success(`Chat "${chatName}" deleted`);
        } catch (error) {
            console.error('Error deleting chat:', error);
            toast.error('Failed to delete chat');
        }
    };

    // Enhanced message sending with proper error handling
    const sendMessage = async (retryLastMessage = false) => {
        if ((!prompt.trim() && !retryLastMessage) || !selectedChatId || sendingMessage) return;

        let messageToSend = retryLastMessage ? messages[messages.length - 2]?.content || prompt : prompt;
        let currentPrompt = messageToSend;

        try {
            setSendingMessage(true);
            setConnectionStatus('connecting');

            // Parse mentions
            const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
            const mentions = [];
            let match;

            while ((match = mentionRegex.exec(currentPrompt)) !== null) {
                mentions.push({
                    name: match[1],
                    id: match[2],
                });
            }

            // Clean content for display
            const plainTextContent = currentPrompt.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, '@$1');

            // Add user message if not retrying
            if (!retryLastMessage) {
                const userMessage = {
                    chat_id: selectedChatId,
                    project_id: project.id,
                    content: plainTextContent,
                    role: 'user',
                    created_at: new Date().toISOString(),
                    mentions: mentions.length > 0 ? JSON.stringify(mentions) : null,
                };

                setMessages(prev => [...prev, userMessage]);
                setPrompt('');

                // Save user message to database
                const { error } = await supabase.from('chat_messages').insert(userMessage);
                if (error) throw new Error('Failed to save message');
            }

            // Determine agents to process
            let agentsToProcess: string | any[] = [];

            if (mentions.length > 0) {
                agentsToProcess = mentions.map(mention => ({
                    id: mention.id,
                    name: mention.name
                }));
            } else if (lastUsedAgentId) {
                const lastAgent = agents.find(a => a.id === lastUsedAgentId);
                if (lastAgent) {
                    agentsToProcess = [{ id: lastAgent.id, name: lastAgent.name }];
                }
            } else if (agents.length > 0) {
                agentsToProcess = [{ id: agents[0].id, name: agents[0].name }];
            }

            if (agentsToProcess.length === 0) {
                throw new Error('No agents available. Please create an agent first.');
            }

            setConnectionStatus('connected');

            // Process each agent
            for (const agentToProcess of agentsToProcess) {
                const agent = agents.find(a => a.id === agentToProcess.id);
                if (!agent) continue;

                setLastUsedAgentId(agent.id);

                // Build context based on agent's context_type
                let contextMessages = [];

                // Add system message with agent instructions
                contextMessages.push({
                    role: 'system',
                    content: `You are an AI assistant named ${agent.name}. ${agent.instructions || ''}`
                });

                // Add context from saved responses if context_folder is specified
                if (agent.context_folder) {
                    try {
                        // Fetch saved responses from the specified folder
                        const { data: savedResponses, error: folderError } = await supabase
                            .from('saved_responses')
                            .select('title, content')
                            .eq('folder_id', agent.context_folder)
                            .eq('project_id', project.id)
                            .order('created_at', { ascending: true });

                        if (folderError) {
                            console.error('Error fetching saved responses:', folderError);
                        } else if (savedResponses && savedResponses.length > 0) {
                            // Add saved responses as system messages for context
                            const folderContext = savedResponses.map((response: any) => ({
                                role: 'system',
                                content: `[Saved Context: ${response.title}] ${response.content}`
                            }));

                            contextMessages.push(...folderContext);
                        }
                    } catch (error) {
                        console.error('Error loading context folder:', error);
                    }
                }

                // Handle different context types
                if (agent.context_type === 'fresh') {
                    // No chat messages in context - only system messages and current prompt
                    contextMessages.push({
                        role: 'user',
                        content: currentPrompt
                    });

                } else if (agent.context_type === 'all') {
                    // Include all messages from the current chat
                    const allChatMessages = messages
                        .filter(msg => msg.chat_id === selectedChatId)
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map(msg => ({
                            role: msg.role,
                            content: msg.content
                        }));

                    contextMessages.push(...allChatMessages);

                    // Add current prompt if not retrying (since it won't be in messages yet)
                    if (!retryLastMessage) {
                        contextMessages.push({
                            role: 'user',
                            content: currentPrompt
                        });
                    }

                } else if (agent.context_type === 'agent') {
                    // Include only messages from/to this specific agent
                    const agentMessages = messages
                        .filter(msg =>
                            msg.chat_id === selectedChatId &&
                            (msg.agent_id === agent.id || msg.role === 'user')
                        )
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map(msg => ({
                            role: msg.role,
                            content: msg.content
                        }));

                    contextMessages.push(...agentMessages);

                    // Add current prompt if not retrying
                    if (!retryLastMessage) {
                        contextMessages.push({
                            role: 'user',
                            content: currentPrompt
                        });
                    }
                }

                // Ensure strict alternation and proper ordering
                const finalMessages = [];

                // Keep system messages at the beginning
                const systemMessages = contextMessages.filter(msg => msg.role === 'system');
                const otherMessages = contextMessages.filter(msg => msg.role !== 'system');

                finalMessages.push(...systemMessages);

                // Process other messages to ensure alternation
                let lastRole = null;
                for (const msg of otherMessages) {
                    if (msg.role === 'user' || msg.role === 'assistant') {
                        if (lastRole !== msg.role) {
                            finalMessages.push(msg);
                            lastRole = msg.role;
                        } else {
                            // Replace consecutive same-role messages with the latest
                            finalMessages[finalMessages.length - 1] = msg;
                        }
                    }
                }

                // Call API
                const response = await api.chat.completions.create({
                    model: agent.model,
                    messages: finalMessages,
                    stream: false,
                });

                if (!response.choices[0].message.content) {
                    throw new Error('API call failed: No content in response');
                }

                const data = response.choices[0].message.content;

                if (!data) {
                    throw new Error(data || 'No response from agent');
                }

                // Create AI message
                const aiMessage = {
                    chat_id: selectedChatId,
                    project_id: project.id,
                    content: data,
                    role: 'assistant',
                    agent_id: agent.id,
                    created_at: new Date().toISOString(),
                };

                // Save to database
                const { error: aiError } = await supabase.from('chat_messages').insert(aiMessage);
                if (aiError) {
                    console.error('Error saving AI message:', aiError);
                    // Still add to UI even if DB save fails
                }

                setMessages(prev => [...prev, aiMessage]);
            }

        } catch (error) {
            console.error('Error sending message:', error);
            setConnectionStatus('error');

            toast.error(error instanceof Error ? error.message : 'Failed to send message');

            // Add error message
            const errorMessage = {
                chat_id: selectedChatId,
                project_id: project.id,
                content: `❌ **Error**: ${error instanceof Error ? error.message : 'Something went wrong'}. Please try again.`,
                role: 'assistant',
                created_at: new Date().toISOString(),
                isError: true,
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setSendingMessage(false);
            setRetryingMessageId(null);
        }
    };

    // Retry last message
    const retryMessage = () => {
        sendMessage(true);
    };

    // Initialize data
    useEffect(() => {
        if (project.id) {
            fetchChats();
            fetchAgents();
        }
    }, [project.id]);

    useEffect(() => {
        if (selectedChatId) {
            fetchChatMessages(selectedChatId);
        }
    }, [selectedChatId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + N for new chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                setNewChatDialogOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Add this useEffect to your Chat component
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + S to save the last AI response
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();

                // Find the last AI message
                const lastAIMessage = [...messages].reverse().find(msg =>
                    msg.role === 'assistant' && !msg.isError
                );

                if (lastAIMessage) {
                    // Trigger save for the last AI message
                    // You might need to use a ref or state to manage this
                    console.log('Save last AI response:', lastAIMessage.content);
                    // Implement your save logic here
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [messages]);

    return (
        <div className="flex gap-4 overflow-hidden">
            {/* Enhanced Chat Sidebar */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-scroll">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <Dialog open={newChatDialogOpen} onOpenChange={setNewChatDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full cursor-pointer hover:scale-110">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                New Chat
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Chat</DialogTitle>
                                <DialogDescription>
                                    Start a new conversation with your agents.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Chat name (e.g., 'Marketing Strategy Discussion')"
                                    value={newChatName}
                                    onChange={(e) => setNewChatName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newChatName.trim()) {
                                            createNewChat();
                                        }
                                    }}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setNewChatDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={createNewChat} disabled={!newChatName.trim()}>
                                    Create Chat
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {chatsLoading ? (
                        <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8 p-4">
                            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                            <p className="font-medium">No chats yet</p>
                            <p className="text-sm mt-1">Create your first chat to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {chats.map((chat: any) => (
                                <div
                                    key={chat.id}
                                    className={`group p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${selectedChatId === chat.id
                                        ? 'bg-black text-white shadow-lg dark:bg-white dark:text-black'
                                        : 'dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={() => setSelectedChatId(chat.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm truncate flex-1 pr-2">
                                            {chat.name}
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 ${selectedChatId === chat.id
                                                ? 'hover:bg-white/20 text-white dark:text-black'
                                                : 'hover:bg-red-100 text-red-600'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteChat(chat.id, chat.name);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <p className={`text-xs mt-1`}>
                                        {chat.created_at ? new Date(chat.created_at).toLocaleDateString() : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Connection Status */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' :
                            connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                'bg-red-500'
                            }`} />
                        <span className="text-gray-600 dark:text-gray-400">
                            {connectionStatus === 'connected' ? 'Connected' :
                                connectionStatus === 'connecting' ? 'Connecting...' :
                                    'Connection Error'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Enhanced Chat Area */}
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
                            <Button
                                onClick={() => setNewChatDialogOpen(true)}
                                className="cursor-pointer px-6 py-3"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Start a new Chat
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Enhanced Chat Header */}
                        {/* <div className="p-4 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 flex items-center justify-center">
                                        <MessageCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                            {chats.find(chat => chat.id === selectedChatId)?.name || 'Chat'}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {agents.length} agent{agents.length !== 1 ? 's' : ''} available • Use @mentions to target specific agents
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {sendingMessage && (
                                        <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div> */}

                        {/* Enhanced Messages Area */}
                        <div
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-3 max-h-[80vh]"
                        >
                            <div className="max-w-4xl mx-auto space-y-6">
                                {messagesLoading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="text-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                                            <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
                                        </div>
                                    </div>
                                ) : messages.length === 0 ? (
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
                                        {messages.map((message: any, index: number) => (
                                            <MessageBubble
                                                key={index}
                                                message={message}
                                                agents={agents}
                                                onRetry={message.role === 'assistant' && index === messages.length - 1 ? retryMessage : undefined}
                                                projectId={project.id}
                                                chatId={selectedChatId}
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

                        {/* Enhanced Message Input */}
                        <div className="border-t border-gray-200 dark:border-gray-700">
                            <div className="pt-3">
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
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Input area */}
                                <div className="flex gap-4 items-end">
                                    <div className="flex-1">
                                        <MentionsInput
                                            className="w-full rounded-2xl border-2 border-gray-200 dark:border-gray-600 shadow-lg transition-all duration-300 ease-in-out focus-within:ring-4 focus-within:ring-blue-500/20 focus-within:border-blue-500 hover:shadow-xl"
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder={
                                                agents.length > 0
                                                    ? "Type your message... Use @ to mention agents ✨"
                                                    : "Type your message..."
                                            }
                                            // disabled={sendingMessage}
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
                                                    background: 'white',
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
                                                    padding: '4px 8px',
                                                    fontWeight: '600',
                                                    color: 'white',
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
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                AI Agent
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            />
                                        </MentionsInput>
                                    </div>

                                    <Button
                                        className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:hover:scale-100 group"
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

const Agents = ({ project }: { project: any }) => {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [newAgentName, setNewAgentName] = useState('');
    const [newAgentDescription, setNewAgentDescription] = useState('');
    const [newAgentModel, setNewAgentModel] = useState('gemini-2.0-flash');
    const [newAgentInstructions, setNewAgentInstructions] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [contextType, setContextType] = useState('all');

    const [deleteDialog, setDeleteDialog] = useState(false);

    // Edit agent state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<any>(null);
    const [editAgentName, setEditAgentName] = useState('');
    const [editAgentDescription, setEditAgentDescription] = useState('');
    const [editAgentModel, setEditAgentModel] = useState('gemini-2.0-flash');
    const [editAgentInstructions, setEditAgentInstructions] = useState('');
    const [editContextType, setEditContextType] = useState('');


    const fetchAgents = async () => {
        const { data, error } = await supabase.from('agents')
            .select('*')
            .eq('project_id', project.id);

        if (error) setError(error.message);
        setAgents(data || []);
        setLoading(false);
    }

    const addAgent = async () => {
        setAddDialogOpen(false);
        const { error } = await supabase.from('agents')
            .insert({
                project_id: project.id,
                name: newAgentName,
                description: newAgentDescription,
                model: newAgentModel,
                instructions: newAgentInstructions,
            });
        if (error) setError(error.message);
        fetchAgents();
    }

    const openEditDialog = (agent: any) => {
        setEditingAgent(agent);
        setEditAgentName(agent.name);
        setEditAgentDescription(agent.description);
        setEditAgentModel(agent.model);
        setEditAgentInstructions(agent.instructions || '');
        setEditDialogOpen(true);
        setContextType(agent.context_type)
    }

    const updateAgent = async () => {
        if (!editingAgent) return;

        const { error } = await supabase
            .from('agents')
            .update({
                name: editAgentName,
                description: editAgentDescription,
                model: editAgentModel,
                instructions: editAgentInstructions,
            })
            .eq('id', editingAgent.id);

        if (error) {
            setError(error.message);
        } else {
            setEditDialogOpen(false);
            setEditingAgent(null);
            fetchAgents();
        }
    }

    const deleteAgent = async (id: string) => {
        const { error } = await supabase
            .from("agents")
            .delete()
            .eq('id', id)

        if (error) toast.error(error.message);
        setDeleteDialog(false);
        fetchAgents();
    }

    useEffect(() => {
        if (project.id) fetchAgents();
    }, [project.id]);

    return (
        <div className="space-y-6">
            {/* Add Agent Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="cursor-pointer">Add Agent</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            <Bot className="w-10 h-10 mb-2" />
                            Add Agent
                        </DialogTitle>
                        <DialogDescription>
                            Add a new agent to your project.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Input
                            placeholder="Name your Agent"
                            value={newAgentName}
                            onChange={(e) => setNewAgentName(e.target.value)}
                        />
                        <Input
                            placeholder="Description your Agent"
                            value={newAgentDescription}
                            onChange={(e) => setNewAgentDescription(e.target.value)}
                        />
                        <Textarea
                            maxLength={2000}
                            placeholder="Instructions your Agent"
                            value={newAgentInstructions}
                            onChange={(e) => setNewAgentInstructions(e.target.value)}
                        />
                        <Select
                            defaultValue="gemini-2.0-flash"
                            value={newAgentModel}
                            onValueChange={(value) => setNewAgentModel(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="google/gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                                <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                                <SelectItem value="openai/gpt-4.1-nano-2025-04-14">GPT4o Nano</SelectItem>
                                <SelectItem value='perplexity/sonar'>Perpexility Sonar</SelectItem>
                                <SelectItem value='perplexity/sonar-pro'>Perpexility Sonar Pro</SelectItem>
                                <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            defaultValue="all"
                            value={contextType}
                            onValueChange={(value) => setContextType(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Context Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All of Chat</SelectItem>
                                <SelectItem value="agent">Agent Only - includes messages only of this agent</SelectItem>
                                <SelectItem value="fresh">Fresh - won't include any context</SelectItem>
                            </SelectContent>
                        </Select>


                        <Button onClick={addAgent} className="w-full cursor-pointer">Add Agent</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Agent Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            <Bot className="w-10 h-10 mb-2" />
                            Edit Agent
                        </DialogTitle>
                        <DialogDescription>
                            Update your agent's configuration.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <Input
                            placeholder="Name your Agent"
                            value={editAgentName}
                            onChange={(e) => setEditAgentName(e.target.value)}
                        />
                        <Input
                            placeholder="Description for your Agent"
                            value={editAgentDescription}
                            onChange={(e) => setEditAgentDescription(e.target.value)}
                        />
                        <Textarea
                            maxLength={2000}
                            placeholder="Instructions for your Agent"
                            value={editAgentInstructions}
                            onChange={(e) => setEditAgentInstructions(e.target.value)}
                        />
                        <Select
                            value={editAgentModel}
                            onValueChange={(value) => setEditAgentModel(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="google/gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                                <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                                <SelectItem value="openai/gpt-4.1-nano-2025-04-14">GPT4o Nano</SelectItem>
                                <SelectItem value='perplexity/sonar'>Perpexility Sonar</SelectItem>
                                <SelectItem value='perplexity/sonar-pro'>Perpexility Sonar Pro</SelectItem>
                                <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            defaultValue={editContextType}
                            value={editContextType}
                            onValueChange={(value) => setEditContextType(value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Context Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All of Chat</SelectItem>
                                <SelectItem value="agent">Agent Only - includes messages only of this agent</SelectItem>
                                <SelectItem value="fresh">Fresh - won't include any context</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex space-x-2">
                            <Button onClick={updateAgent} className="flex-1 cursor-pointer">
                                Update Agent
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setEditDialogOpen(false)}
                                className="flex-1 cursor-pointer"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {loading && <div className="text-center">Loading...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {agents.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agents.map((agent) => (
                        <div key={agent.id} className="border rounded-lg p-4">
                            <div className="p-4">
                                <Bot className="w-10 h-10 mb-2" />
                                <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
                                <p className="text-gray-600 mb-4">{agent.description}</p>
                                <Button
                                    className="cursor-pointer"
                                    variant={'secondary'}
                                    onClick={() => openEditDialog(agent)}
                                >
                                    View Agent
                                </Button>
                                <Dialog open={deleteDialog} onOpenChange={() => setDeleteDialog(true)}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" className="cursor-pointer ml-3">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Are you sure that you want to delete this?</DialogTitle>
                                        </DialogHeader>
                                        <DialogDescription>You won't be able to recover this agent afterwards.</DialogDescription>
                                        <DialogFooter>
                                            <Button onClick={() => { deleteAgent(agent.id) }}>Yes, Delete</Button>
                                            <Button variant={'ghost'} onClick={() => { setDeleteDialog(false) }}>Cancel</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
};

const Context = ({ project }: { project: any }) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div className='flex gap-3'>
                <ZoomIn size={65} />
                <p className='text-6xl'>Context</p>
            </div>
            <Button>Add Custom</Button>
        </div>
        <div className="p-4">

        </div>
    </div>
);


const SettingsTab = ({ project }: { project: any }) => (
    <div className="space-y-6">
        <h2 className="text-3xl font-bold">Project Settings</h2>
        <div className="space-y-4">
            <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Project Name</label>
                        <input
                            type="text"
                            defaultValue={project.title}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            defaultValue={project.description || ''}
                            className="w-full p-2 border rounded-md h-24"
                        />
                    </div>
                    <Button>Save Changes</Button>
                </div>
            </div>
            <div className="border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
                <p className="text-red-600 mb-4">Permanently delete this project and all its data.</p>
                <Button variant="destructive">Delete Project</Button>
            </div>
        </div>
    </div>
);

const ResponseLibrary = ({ project }: { project: any }) => {
    const [folderTitle, setNewFolderTitle] = useState('');
    const [editFolderTitle, setEditFolderTitle] = useState('');
    const [editResponseTitle, setEditResponseTitle] = useState('');
    const [editResponseContent, setEditResponseContent] = useState('');
    const [folders, setFolders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false);
    const [editResponseDialogOpen, setEditResponseDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [currentFolder, setCurrentFolder] = useState<any>(null);
    const [breadcrumb, setBreadcrumb] = useState<any[]>([]);
    const [savedResponses, setSavedResponses] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [allFolders, setAllFolders] = useState<any[]>([]);
    const [targetFolder, setTargetFolder] = useState<any>(null);
    const [deleteIncludeContents, setDeleteIncludeContents] = useState(false);
    const [itemType, setItemType] = useState<'folder' | 'response' | null>(null);

    const addFolder = async () => {
        if (!folderTitle.trim()) {
            toast.error('Please enter a folder name');
            return;
        }

        try {
            setLoading(true);
            const { data, error } = await supabase.from('response_folders')
                .insert({
                    name: folderTitle,
                    project_id: project.id,
                    parent_folder: currentFolder?.id || null,
                })
                .select()
                .single();

            if (error) {
                toast.error(error.message);
                return;
            }

            setFolders(prev => [data, ...prev]);
            setNewFolderTitle('');
            setAddDialogOpen(false);
            toast.success('Folder created successfully!');
        } catch (error) {
            console.error('Error creating folder:', error);
            toast.error('Failed to create folder');
        } finally {
            setLoading(false);
        }
    }

    const editFolder = async () => {
        if (!editFolderTitle.trim()) {
            toast.error('Please enter a folder name');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.from('response_folders')
                .update({ name: editFolderTitle })
                .eq('id', selectedItem.id);

            if (error) {
                toast.error(error.message);
                return;
            }

            setFolders(prev => prev.map(f =>
                f.id === selectedItem.id ? { ...f, name: editFolderTitle } : f
            ));

            // Update breadcrumb if needed
            if (currentFolder?.id === selectedItem.id) {
                setCurrentFolder({ ...currentFolder, name: editFolderTitle });
            }

            setBreadcrumb(prev => prev.map(f =>
                f.id === selectedItem.id ? { ...f, name: editFolderTitle } : f
            ));

            setEditFolderDialogOpen(false);
            setSelectedItem(null);
            toast.success('Folder renamed successfully!');
        } catch (error) {
            console.error('Error renaming folder:', error);
            toast.error('Failed to rename folder');
        } finally {
            setLoading(false);
        }
    }

    const editResponse = async () => {
        if (!editResponseTitle.trim()) {
            toast.error('Please enter a response title');
            return;
        }

        if (!editResponseContent.trim()) {
            toast.error('Please enter response content');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase.from('saved_responses')
                .update({
                    title: editResponseTitle,
                    content: editResponseContent
                })
                .eq('id', selectedItem.id);

            if (error) {
                toast.error(error.message);
                return;
            }

            setSavedResponses(prev => prev.map(r =>
                r.id === selectedItem.id ? { ...r, title: editResponseTitle, content: editResponseContent } : r
            ));

            setEditResponseDialogOpen(false);
            setSelectedItem(null);
            toast.success('Response updated successfully!');
        } catch (error) {
            console.error('Error updating response:', error);
            toast.error('Failed to update response');
        } finally {
            setLoading(false);
        }
    }

    const deleteItem = async () => {
        try {
            setLoading(true);

            if (itemType === 'folder') {
                if (deleteIncludeContents) {
                    // Delete folder and all its contents (subfolders and responses)
                    const folderIdsToDelete = await getFolderIdsRecursive(selectedItem.id);

                    // Delete all responses in these folders
                    const { error: responsesError } = await supabase
                        .from('saved_responses')
                        .delete()
                        .in('folder_id', folderIdsToDelete);

                    if (responsesError) throw responsesError;

                    // Delete all folders
                    const { error: foldersError } = await supabase
                        .from('response_folders')
                        .delete()
                        .in('id', folderIdsToDelete);

                    if (foldersError) throw foldersError;
                } else {
                    // Just delete the folder (move its contents to parent or root)
                    // First update all subfolders to point to the parent folder
                    const { error: subfoldersError } = await supabase
                        .from('response_folders')
                        .update({ parent_folder: currentFolder?.id || null })
                        .eq('parent_folder', selectedItem.id);

                    if (subfoldersError) throw subfoldersError;

                    // Update all responses to point to the parent folder
                    const { error: responsesError } = await supabase
                        .from('saved_responses')
                        .update({ folder_id: currentFolder?.id || null })
                        .eq('folder_id', selectedItem.id);

                    if (responsesError) throw responsesError;

                    // Now delete the folder
                    const { error: deleteError } = await supabase
                        .from('response_folders')
                        .delete()
                        .eq('id', selectedItem.id);

                    if (deleteError) throw deleteError;
                }
            } else if (itemType === 'response') {
                // Delete the response
                const { error } = await supabase
                    .from('saved_responses')
                    .delete()
                    .eq('id', selectedItem.id);

                if (error) throw error;

                setSavedResponses(prev => prev.filter(r => r.id !== selectedItem.id));
            }

            // Refresh the current view if a folder was deleted or contents were moved
            if (itemType === 'folder') {
                await Promise.all([
                    fetchFolders(currentFolder?.id || null),
                    currentFolder ? fetchSavedResponses(currentFolder.id) : Promise.resolve()
                ]);
            }

            setDeleteDialogOpen(false);
            setSelectedItem(null);
            setItemType(null);
            toast.success(`${itemType === 'folder' ? 'Folder' : 'Response'} deleted successfully!`);
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error(`Failed to delete ${itemType === 'folder' ? 'folder' : 'response'}`);
        } finally {
            setLoading(false);
        }
    }

    const moveItem = async () => {
        if (!targetFolder || selectedItem.id === targetFolder.id) {
            toast.error('Please select a different target folder');
            return;
        }

        // Check if moving to a subfolder of itself (only for folders)
        if (itemType === 'folder' && await isSubfolder(selectedItem.id, targetFolder.id)) {
            toast.error('Cannot move a folder into its own subfolder');
            return;
        }

        try {
            setLoading(true);

            if (itemType === 'folder') {
                const { error } = await supabase.from('response_folders')
                    .update({ parent_folder: targetFolder.id })
                    .eq('id', selectedItem.id);

                if (error) throw error;

                // Refresh the current view
                await fetchFolders(currentFolder?.id || null);
            } else if (itemType === 'response') {
                const { error } = await supabase.from('saved_responses')
                    .update({ folder_id: targetFolder.id })
                    .eq('id', selectedItem.id);

                if (error) throw error;

                // Remove from current view
                setSavedResponses(prev => prev.filter(r => r.id !== selectedItem.id));
            }

            setMoveDialogOpen(false);
            setSelectedItem(null);
            setTargetFolder(null);
            setItemType(null);
            toast.success(`${itemType === 'folder' ? 'Folder' : 'Response'} moved successfully!`);
        } catch (error) {
            console.error('Error moving item:', error);
            toast.error(`Failed to move ${itemType === 'folder' ? 'folder' : 'response'}`);
        } finally {
            setLoading(false);
        }
    }

    const getFolderIdsRecursive = async (folderId: string): Promise<string[]> => {
        const ids = [folderId];

        // Get immediate subfolders
        const { data: subfolders, error } = await supabase
            .from('response_folders')
            .select('id')
            .eq('parent_folder', folderId);

        if (error) throw error;

        // Recursively get subfolder IDs
        for (const subfolder of subfolders || []) {
            const subIds = await getFolderIdsRecursive(subfolder.id);
            ids.push(...subIds);
        }

        return ids;
    }

    const isSubfolder = async (parentId: string, potentialChildId: string): Promise<boolean> => {
        if (parentId === potentialChildId) return true;

        // Get immediate subfolders of parent
        const { data: subfolders, error } = await supabase
            .from('response_folders')
            .select('id')
            .eq('parent_folder', parentId);

        if (error) throw error;

        // Check if potentialChildId is any of these subfolders or their children
        for (const subfolder of subfolders || []) {
            if (subfolder.id === potentialChildId) return true;
            if (await isSubfolder(subfolder.id, potentialChildId)) return true;
        }

        return false;
    }

    const fetchAllFolders = async () => {
        try {
            const { error, data } = await supabase
                .from('response_folders')
                .select('*')
                .eq('project_id', project.id)
                .order('name');

            if (error) throw error;
            setAllFolders(data || []);
        } catch (error) {
            console.error('Error fetching all folders:', error);
        }
    }

    const fetchFolders = async (parentFolderId: string | null = null) => {
        try {
            setLoading(true);
            let query = supabase.from('response_folders')
                .select('*')
                .eq('project_id', project.id)
                .order('created_at', { ascending: false });

            if (parentFolderId === null) {
                query = query.is('parent_folder', null);
            } else {
                query = query.eq('parent_folder', parentFolderId);
            }

            const { error, data } = await query;

            if (error) {
                console.error('Error fetching folders:', error);
                toast.error('Failed to load folders');
                return;
            }

            setFolders(data || []);
        } catch (error) {
            console.error('Error fetching folders:', error);
            toast.error('Failed to load folders');
        } finally {
            setLoading(false);
        }
    }

    const fetchSavedResponses = async (folderId: string) => {
        try {
            const { data, error } = await supabase
                .from('saved_responses')
                .select('*')
                .eq('folder_id', folderId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSavedResponses(data || []);
        } catch (error) {
            console.error('Error fetching saved responses:', error);
            toast.error('Failed to load saved responses');
        }
    };

    const navigateToFolder = async (folder: any) => {
        setCurrentFolder(folder);
        setBreadcrumb(prev => [...prev, folder]);
        await Promise.all([
            fetchFolders(folder.id),
            fetchSavedResponses(folder.id)
        ]);
    }

    const navigateToRoot = async () => {
        setCurrentFolder(null);
        setBreadcrumb([]);
        setSavedResponses([]);
        await fetchFolders(null);
    }

    const navigateToBreadcrumb = async (index: number) => {
        const targetFolder = breadcrumb[index];
        const newBreadcrumb = breadcrumb.slice(0, index + 1);

        setCurrentFolder(targetFolder);
        setBreadcrumb(newBreadcrumb);
        await Promise.all([
            fetchFolders(targetFolder.id),
            fetchSavedResponses(targetFolder.id)
        ]);
    }

    const goBack = async () => {
        if (breadcrumb.length === 0) return;

        if (breadcrumb.length === 1) {
            await navigateToRoot();
        } else {
            const newBreadcrumb = breadcrumb.slice(0, -1);
            const parentFolder = newBreadcrumb[newBreadcrumb.length - 1];

            setCurrentFolder(parentFolder);
            setBreadcrumb(newBreadcrumb);
            await Promise.all([
                fetchFolders(parentFolder.id),
                fetchSavedResponses(parentFolder.id)
            ]);
        }
    }

    const openEditFolderDialog = (folder: any) => {
        setSelectedItem(folder);
        setItemType('folder');
        setEditFolderTitle(folder.name);
        setEditFolderDialogOpen(true);
    }

    const openEditResponseDialog = (response: any) => {
        setSelectedItem(response);
        setItemType('response');
        setEditResponseTitle(response.title);
        setEditResponseContent(response.content);
        setEditResponseDialogOpen(true);
    }

    const openDeleteDialog = (item: any, type: 'folder' | 'response') => {
        setSelectedItem(item);
        setItemType(type);
        setDeleteIncludeContents(false);
        setDeleteDialogOpen(true);
    }

    const openMoveDialog = async (item: any, type: 'folder' | 'response') => {
        setSelectedItem(item);
        setItemType(type);
        setTargetFolder(null);
        await fetchAllFolders();
        setMoveDialogOpen(true);
    }

    useEffect(() => {
        if (project?.id) {
            fetchFolders(null);
        }
    }, [project?.id]);

    return (
        <div className="space-y-6 p-4">
            <div className='flex gap-3 p-5 rounded-lg'>
                <Folder size={65} className="" />
                <div>
                    <p className='text-4xl font-bold'>Response Library</p>
                    <p className='text-sm text-gray-600 mt-1'>Manage your saved responses and folders</p>
                </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm border">
                <button
                    onClick={navigateToRoot}
                    className="flex items-center gap-1 transition-colors font-medium"
                >
                    <Home size={16} />
                    Root
                </button>

                {breadcrumb.map((folder, index) => (
                    <div key={folder.id} className="flex items-center gap-2">
                        <ChevronRight size={16} className="text-gray-400" />
                        <button
                            onClick={() => navigateToBreadcrumb(index)}
                            className="text-blue-600 hover:text-blue-800 transition-colors font-medium"
                        >
                            {folder.name}
                        </button>
                    </div>
                ))}

                {breadcrumb.length > 0 && (
                    <div className="ml-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goBack}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className='flex gap-2 cursor-pointer'>
                            <FolderPlus size={18} /> Add Folder
                            {currentFolder && (
                                <span className="text-sm">
                                    in "{currentFolder.name}"
                                </span>
                            )}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add a new Folder</DialogTitle>
                            <DialogDescription>
                                Add a new folder {currentFolder ? `in "${currentFolder.name}"` : 'to save your responses in'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Input
                                placeholder='Folder name'
                                value={folderTitle}
                                onChange={(e) => setNewFolderTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && folderTitle.trim()) {
                                        addFolder();
                                    }
                                }}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={addFolder} disabled={loading || !folderTitle.trim()}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Add Folder
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Loading...</span>
                </div>
            ) : (
                <>
                    {/* Subfolders Section */}
                    {folders.length > 0 && (
                        <div className="rounded-lg shadow-sm border p-4">
                            <h3 className="text-xl font-semibold mb-4">
                                {currentFolder ? `Subfolders in "${currentFolder.name}"` : 'Folders'}
                            </h3>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8'>
                                {folders.map((folder: any) => (
                                    <div
                                        key={folder.id}
                                        className='p-4 border rounded-lg hover:shadow-md transition-shadow group relative'
                                    >
                                        <div
                                            className="flex items-center gap-3 cursor-pointer"
                                            onClick={() => navigateToFolder(folder)}
                                        >
                                            <Folder className="h-6 w-6 text-blue-500 group-hover:text-blue-600" />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium">
                                                    {folder.name}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {folder.created_at ? new Date(folder.created_at).toLocaleDateString() : 'Recently created'}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditFolderDialog(folder);
                                                }}
                                                className="h-7 w-7 rounded-full"
                                                title="Rename folder"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openMoveDialog(folder, 'folder');
                                                }}
                                                className="h-7 w-7 rounded-full"
                                                title="Move folder"
                                            >
                                                <Move className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeleteDialog(folder, 'folder');
                                                }}
                                                className="h-7 w-7 rounded-full text-red-500 hover:text-red-700"
                                                title="Delete folder"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Saved Responses Section */}
                    {savedResponses.length > 0 && (
                        <div className="rounded-lg shadow-sm border p-4">
                            <h3 className="text-xl font-semibold mb-4">
                                Saved Responses in "{currentFolder?.name || 'Root'}"
                            </h3>
                            <div className="grid gap-4">
                                {savedResponses.map((response) => (
                                    <div key={response.id} className="p-4 border rounded-lg flex items-start gap-3 group relative">
                                        <FileText className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => openEditResponseDialog(response)}
                                        >
                                            <h4 className="font-medium mb-2">{response.title}</h4>
                                            <p className="text-sm text-gray-600 line-clamp-3">{response.content.toString().slice(0, 40)}</p>
                                            <div className="mt-2 text-xs text-gray-500">
                                                {new Date(response.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openEditResponseDialog(response)}
                                                className="h-7 w-7 rounded-full"
                                                title="Edit response"
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openMoveDialog(response, 'response')}
                                                className="h-7 w-7 rounded-full"
                                                title="Move response"
                                            >
                                                <Move className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => openDeleteDialog(response, 'response')}
                                                className="h-7 w-7 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                                                title="Delete response"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {folders.length === 0 && savedResponses.length === 0 && (
                        <div className="text-center py-12 rounded-lg shadow-sm border">
                            <Folder className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium">
                                {currentFolder ? 'No subfolders or responses yet' : 'No folders yet'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {currentFolder
                                    ? `Create your first subfolder or save responses in "${currentFolder.name}"`
                                    : 'Create your first folder to organize your responses'
                                }
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Edit Folder Dialog */}
            <Dialog open={editFolderDialogOpen} onOpenChange={setEditFolderDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Folder</DialogTitle>
                        <DialogDescription>
                            Enter a new name for the folder "{selectedItem?.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Input
                            placeholder='Folder name'
                            value={editFolderTitle}
                            onChange={(e) => setEditFolderTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && editFolderTitle.trim()) {
                                    editFolder();
                                }
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditFolderDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={editFolder} disabled={loading || !editFolderTitle.trim()}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Rename Folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Response Dialog */}
            <Dialog open={editResponseDialogOpen} onOpenChange={setEditResponseDialogOpen}>
                <DialogContent className="w-5xl h-[900px] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Edit Response</DialogTitle>
                        <DialogDescription>
                            Update the title and content of your saved response.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                        <Input
                            placeholder="Response title"
                            value={editResponseTitle}
                            onChange={(e) => setEditResponseTitle(e.target.value)}
                        />

                        <Tabs defaultValue="edit" className="flex flex-col flex-1 overflow-hidden">
                            <TabsList className="mb-2 gap-3">
                                <TabsTrigger value="edit">Edit</TabsTrigger>
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                            </TabsList>

                            <TabsContent value="edit" className="flex-1 overflow-auto">
                                <Textarea
                                    placeholder="Response content"
                                    value={editResponseContent}
                                    onChange={(e) => setEditResponseContent(e.target.value)}
                                    className="h-full resize-none"
                                />
                            </TabsContent>

                            <TabsContent
                                value="preview"
                                className="flex-1 overflow-auto border rounded-md p-4"
                            >
                                <MarkdownRenderer content={editResponseContent} />
                            </TabsContent>
                        </Tabs>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditResponseDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={editResponse}
                            disabled={loading || !editResponseTitle.trim() || !editResponseContent.trim()}
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Update Response
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Delete Item Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the {itemType} "{selectedItem?.name || selectedItem?.title}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {itemType === 'folder' && (
                        <div className="py-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="deleteContents"
                                    checked={deleteIncludeContents}
                                    onChange={(e) => setDeleteIncludeContents(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="deleteContents" className="text-sm font-medium leading-none">
                                    Delete all contents (subfolders and responses) inside this folder
                                </label>
                            </div>
                            <p className="text-xs mt-1">
                                If unchecked, all contents will be moved to the {currentFolder ? `parent folder "${currentFolder.name}"` : 'root'}.
                            </p>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={deleteItem}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Move Item Dialog */}
            <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Move {itemType === 'folder' ? 'Folder' : 'Response'}</DialogTitle>
                        <DialogDescription>
                            Select a destination for the {itemType} "{selectedItem?.name || selectedItem?.title}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-60 overflow-y-auto py-2">
                        <div
                            className={`p-3 rounded border cursor-pointer flex items-center gap-2 ${!targetFolder ? 'border-blue-300' : 'hover:bg-background'}`}
                            onClick={() => setTargetFolder(null)}
                        >
                            <Home className="h-4 w-4" />
                            <span className="font-medium">Root</span>
                        </div>

                        {allFolders
                            .filter(f => f.id !== selectedItem?.id)
                            .map((folder) => (
                                <div
                                    key={folder.id}
                                    className={`p-3 rounded border cursor-pointer flex items-center gap-2 ${targetFolder?.id === folder.id ? 'border-blue-300' : ''}`}
                                    onClick={() => setTargetFolder(folder)}
                                >
                                    <Folder className="h-4 w-4" />
                                    <span className="font-medium">{folder.name}</span>
                                </div>
                            ))
                        }
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={moveItem} disabled={loading || !targetFolder}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Move {itemType === 'folder' ? 'Folder' : 'Response'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

const ProjectPage = () => {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = params.projectId;
    const [project, setProject] = useState<any>({})
    const [error, setError] = useState('')
    const { user } = useUser();
    const [loading, setLoading] = useState(true)

    // Get current tab from URL params, default to 'overview'
    const activeTab = searchParams.get('tab') || 'overview';

    const fetchProjectDetails = async () => {
        const { data, error } = await supabase.from('projects')
            .select('*')
            .eq('user_id', user?.id)
            .eq('id', projectId)
            .single();

        if (error) setError(error.message);
        setProject(data)
        setLoading(false)
    }

    useEffect(() => {
        if (user) fetchProjectDetails();
    }, [user]);

    // Function to handle tab switching
    const handleTabSwitch = (tab: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        router.push(url.pathname + url.search);
    };

    // Function to render active tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return <OverviewTab project={project} />;
            case 'chat':
                return <Chat project={project} supabase={supabase} />;
            case 'agents':
                return <Agents project={project} />;
            case 'context':
                return <Context project={project} />;
            case 'settings':
                return <SettingsTab project={project} />;
            case 'responseLib':
                return <ResponseLibrary project={project} />;
            default:
                return <OverviewTab project={project} />;
        }
    };

    if (loading) {
        return (
            <div className='p-6'>
                <div className='m-auto rounded-full h-[40px] w-[40px] border-t-3 border-blue-600 animate-spin'></div>
            </div>
        )
    }

    if (loading == false && user?.id != project.user_id) {
        return (
            <div className='p-6'>
                <div className='text-center'>
                    <p className='text-5xl'>Sorry, we couldn't find this project from your account...</p>
                    <Button onClick={() => router.push('/')}>Take me back home...</Button>
                </div>
            </div>
        )
    }

    return (
        <div className='px-6'>
            {error && <p className='text-red-500'>{error}</p>}
            {!error &&
                <div>
                    <p className='text-5xl mb-5'>{project.title}</p>
                    <div className="flex border-t">
                        {/* 
                            The className "dark:border-gray-700" will only apply if your app or a parent element has the "dark" class on it.
                            If you are not seeing the dark border, make sure:
                            1. Your Tailwind config has "darkMode" enabled (e.g., "class" or "media").
                            2. The <html> or <body> tag (or a parent) has the "dark" class applied when in dark mode.
                            3. You are not overriding the border color elsewhere.
                        */}
                        <aside className="w-64 min-h-screen border-r mr-8 p-4">
                            <nav className="flex flex-col gap-2">
                                <Button
                                    variant={activeTab === 'overview' ? 'default' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => handleTabSwitch('overview')}
                                >
                                    Overview
                                </Button>
                                <Button
                                    variant={activeTab === 'chat' ? 'default' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => handleTabSwitch('chat')}
                                >
                                    Chat
                                </Button>
                                <Button
                                    variant={activeTab === 'responseLib' ? 'default' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => handleTabSwitch('responseLib')}
                                >
                                    Response Library
                                </Button>
                                <Button
                                    variant={activeTab === 'context' ? 'default' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => handleTabSwitch('context')}
                                >
                                    Context
                                </Button>
                                <Button
                                    variant={activeTab === 'agents' ? 'default' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => handleTabSwitch('agents')}
                                >
                                    Agents
                                </Button>
                                <Button
                                    variant={activeTab === 'settings' ? 'default' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => handleTabSwitch('settings')}
                                >
                                    Settings
                                </Button>
                            </nav>
                        </aside>
                        <main className="flex-1">
                            <div className="">
                                {renderTabContent()}
                            </div>
                        </main>
                    </div>
                </div>
            }
        </div>
    );
};

export default ProjectPage;