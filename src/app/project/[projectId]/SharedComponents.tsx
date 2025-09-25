'use client'

import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import supabase from '@/lib/supabase';
import { ChevronDown, ChevronRight, Folder, Home, Loader2, Save, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export const WebSearchResults = ({ sources }: { sources: any[] }) => {
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-4 p-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Web Search Results
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sources.map((source, index) => (
                    <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <p className="font-medium text-blue-600 dark:text-blue-400 truncate">{source.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{source.snippet}</p>
                    </a>
                ))}
            </div>
        </div>
    );
};

export const SaveResponseDialog = ({
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

    useEffect(() => {
        if (open) {
            fetchAllFolders();
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
                    className={`flex items-center p-2 rounded cursor-pointer ${selectedFolderId === folder.id ? 'bg-blue-100 text-black' : ''}`}
                    onClick={() => setSelectedFolderId(folder.id)}
                >
                    <div className="flex items-center flex-1">
                        <div className="w-4" style={{ marginLeft: level * 16 }} />

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

                        {getSubfolders(folder.id).length === 0 && (
                            <div className="w-5 mr-1" />
                        )}

                        <Folder className="h-4 w-4 mr-2 text-blue-500" />
                        <span className="text-sm">{folder.name}</span>
                    </div>
                </div>

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

                        {selectedFolderId && (
                            <div className="mb-2 p-2 rounded text-sm">
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
                                <div
                                    className={`flex items-center p-2 rounded cursor-pointer ${selectedFolderId === null ? 'bg-blue-100' : ''}`}
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


