import { Button } from "@/components/ui/button";
import { Copy, Save, Folder, Home, ChevronRight, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from "sonner";
import supabase from "@/lib/supabase";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface MarkdownRendererProps {
    content: string;
    projectId?: string;
    agentId?: string;
    chatId?: string;
    originalMessageId?: string;
}

const MarkdownRenderer = ({
    content,
    projectId,
    agentId,
    chatId,
    originalMessageId
}: MarkdownRendererProps) => {
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [selectedCodeContent, setSelectedCodeContent] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [folders, setFolders] = useState<any[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Code copied to clipboard!');
    };

    const fetchFolders = async () => {
        if (!projectId) return;
        
        try {
            const { data, error } = await supabase
                .from('response_folders')
                .select('*')
                .eq('project_id', projectId)
                .order('name');

            if (error) throw error;
            setFolders(data || []);
        } catch (error) {
            console.error('Error fetching folders:', error);
            toast.error('Failed to load folders');
        }
    };

    const getSubfolders = (parentId: string | null) => {
        return folders.filter(folder => folder.parent_folder === parentId);
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

    const renderFolderTree = (parentId: string | null = null, level = 0) => {
        const subfolders = getSubfolders(parentId);

        return subfolders.map(folder => (
            <div key={folder.id}>
                <div
                    className={`flex items-center p-2 rounded cursor-pointer ${selectedFolderId === folder.id ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                    onClick={() => setSelectedFolderId(folder.id)}
                    style={{ marginLeft: level * 20 }}
                >
                    {/* Expand/Collapse Button */}
                    {getSubfolders(folder.id).length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleFolder(folder.id);
                            }}
                            className="p-1 mr-1 hover:bg-gray-200 rounded"
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

                {/* Render subfolders if expanded */}
                {expandedFolders.has(folder.id) && renderFolderTree(folder.id, level + 1)}
            </div>
        ));
    };

    const openSaveDialog = (text: string, language: string) => {
        if (!projectId) {
            toast.error('Project ID not available');
            return;
        }
        
        setSelectedCodeContent(text);
        setSelectedLanguage(language);
        setSelectedFolderId(null); // Default to root
        fetchFolders();
        setSaveDialogOpen(true);
    };

    const saveToResponses = async () => {
        if (!projectId || !selectedCodeContent) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('saved_responses')
                .insert({
                    project_id: projectId,
                    folder_id: selectedFolderId,
                    title: `${selectedLanguage} Code Block`,
                    content: selectedCodeContent,
                    agent_id: agentId || null,
                    chat_id: chatId || null,
                    original_message_id: originalMessageId || null,
                    type: 'code'
                });

            if (error) throw error;

            toast.success('Code saved to Response Library!');
            setSaveDialogOpen(false);
        } catch (error) {
            console.error('Error saving code:', error);
            toast.error('Failed to save code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="prose prose-sm max-w-none dark:prose-invert overflow-hidden">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';

                        if (!inline && match) {
                            return (
                                <div className="relative group my-4">
                                    <div className="flex items-center justify-between bg-gray-900 text-gray-300 px-4 py-2 rounded-t-lg text-sm">
                                        <span>{language}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <SyntaxHighlighter
                                            style={oneDark}
                                            language={language}
                                            PreTag="div"
                                            className="!mt-0 !rounded-t-none !rounded-b-lg"
                                            customStyle={{
                                                margin: 0,
                                                borderRadius: '0 0 0.5rem 0.5rem',
                                            }}
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-70 hover:opacity-100 transition-opacity h-6 px-2 text-gray-400 hover:text-white"
                                             onClick={() => openSaveDialog(String(children).replace(/\n$/, ''), language)}
                                            title="Save to Response Library"
                                        >
                                            <Save className="h-3 w-3" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="opacity-70 hover:opacity-100 transition-opacity h-6 px-2 text-gray-400 hover:text-white"
                                            onClick={() => copyToClipboard(String(children).replace(/\n$/, ''))}
                                            title="Copy code"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </Button>
                                    </div>
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
            
            {/* Save Code Dialog */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Save className="h-5 w-5" />
                            Save Code to Response Library
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-sm text-gray-600 mb-2">
                                Save <code className="bg-gray-100 px-1 rounded">{selectedLanguage}</code> code block
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Select Folder
                            </label>
                            <div className="border rounded-md p-2 max-h-60 overflow-y-auto">
                                {/* Root Level Option */}
                                <div
                                    className={`flex items-center p-2 rounded cursor-pointer ${selectedFolderId === null ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
                                    onClick={() => setSelectedFolderId(null)}
                                >
                                    <Home className="h-4 w-4 mr-2 text-gray-500" />
                                    <span className="text-sm font-medium">Root Level</span>
                                </div>
                                
                                {/* Hierarchical Folder Tree */}
                                {renderFolderTree(null)}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setSaveDialogOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={saveToResponses}
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            {loading ? 'Saving...' : 'Save Code'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MarkdownRenderer;