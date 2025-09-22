'use client'

import { Button } from '@/components/ui/button';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import supabase from '@/lib/supabase';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, Bot, ChevronDown, ChevronRight, Edit3, FileText, Folder, FolderPlus, Home, Loader2, MessageCircle, Move, Save, Settings, Sparkles, Trash2, X, ZoomIn } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
// Add these imports
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import Link from 'next/link';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import MarkdownRenderer from './markdown';
import Chat from './tabs/chat';
import Agents from './tabs/agents';

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
        </div>
        <div className='flex gap-3'>
            <Link href={`/project/${project.id}?tab=chat`} className='w-[200px]'>
                <Card>
                    <CardHeader>
                        <MessageCircle />
                        <CardTitle>Chat</CardTitle>
                    </CardHeader>
                </Card>
            </Link>
            <Link href={`/project/${project.id}?tab=responseLib`} className='w-[200px]'>
                <Card>
                    <CardHeader>
                        <Folder />
                        <CardTitle>Response Library</CardTitle>
                    </CardHeader>
                </Card>
            </Link>
            <Link href={`/project/${project.id}?tab=agents`} className='w-[200px]'>
                <Card>
                    <CardHeader>
                        <Bot />
                        <CardTitle>Agents</CardTitle>
                    </CardHeader>
                </Card>
            </Link>
            <Link href={`/project/${project.id}?tab=settings`} className='w-[200px]'>
                <Card>
                    <CardHeader>
                        <Settings />
                        <CardTitle>Settings</CardTitle>
                    </CardHeader>
                </Card>
            </Link>
        </div>
    </div>
);

// Add this interface for mention data
interface MentionData {
    id: string;
    display: string;
}

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

const SettingsTab = ({ project }: { project: any }) => {
    const [name, setNewName] = useState(project.title);
    const [confirmationName, setConfirmation] = useState('');
    const router = useRouter();

    const deleteProj = async () => {
        if (confirmationName === project.title) {
            const { error } = await supabase.from('projects')
                .delete()
                .eq('id', project.id)

            if (error) toast.error(error.message); return;
            router.push('/')
        } else if (confirmationName != project.title) {
            toast.error("Confirmation name isn't matching the Project name")
        } else {
            return;
        }
    }

    const updateProj = async () => {
        const { error } = await supabase.from('projects')
            .update({
                title: name
            })
            .eq('id', project.id)

        if (error) toast.error('Error renaming project ' + error.message);
        else if (!error) toast.success('Changed name successfuly!');
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Project Settings</h2>
            <div className="space-y-4">
                <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4">General Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Project Name</label>
                            <Input
                                type="text"
                                defaultValue={name}
                                onChange={(e) => { setNewName(e.target.value) }}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        {name != project.title && (
                            <Button onClick={updateProj}>Save Changes</Button>
                        )}
                    </div>
                </div>
                <div className="border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
                    <p className="text-red-600 mb-4">Permanently delete this project and all its data.</p>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="destructive">Delete Project</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogTitle>Delete Project Confirmation</DialogTitle>
                            <Input placeholder='Enter the name of the project' value={confirmationName} onChange={(e) => { setConfirmation(e.target.value) }} />
                            <Button onClick={deleteProj}>Yes, Delete</Button>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    )
}

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
    const [responseType, setResponseType] = useState('md');

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

    const fetchSavedResponses = async (folderId: string | null) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('saved_responses')
                .select('*')
                .eq('project_id', project.id)
                .eq('folder_id', folderId)
                .order('created_at', { ascending: false });

            if (error) {
                if (folderId === null) {
                    return;
                } else {
                    console.error('Error fetching responses:', error.message);
                    toast.error('Failed to load responses');
                }
                return;
            }

            setSavedResponses(data || []);
        } catch (error) {
            console.error('Error fetching responses:', error);
            toast.error('Failed to load responses');
        } finally {
            setLoading(false);
        }
    }

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
        await Promise.all([
            fetchFolders(null),
            fetchSavedResponses(null)
        ]);
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
        setResponseType(response.type);
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
            navigateToRoot();
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
                    {currentFolder && savedResponses.length > 0 && (
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
            <Sheet open={editResponseDialogOpen} onOpenChange={setEditResponseDialogOpen}>
                <SheetContent className="w-5xl flex flex-col p-5">
                    <SheetHeader>
                        <SheetTitle>Edit Response</SheetTitle>
                        <SheetDescription>
                            Update the title and content of your saved response.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                        <Input
                            placeholder="Response title"
                            value={editResponseTitle}
                            onChange={(e) => setEditResponseTitle(e.target.value)}
                        />

                        <Tabs defaultValue="preview" className="flex flex-col flex-1 overflow-hidden">
                            <TabsList className="mb-2 gap-3 flex">
                                <TabsTrigger value="edit">Edit</TabsTrigger>
                                <TabsTrigger value="preview">Preview</TabsTrigger>
                            </TabsList>

                            <TabsContent value="edit" className="flex-1 overflow-auto">
                                {responseType === 'md' && (
                                    <Textarea
                                        placeholder="Response content"
                                        value={editResponseContent}
                                        onChange={(e) => setEditResponseContent(e.target.value)}
                                        className="h-full resize-none"
                                    />
                                )}
                            </TabsContent>

                            <TabsContent
                                value="preview"
                                className="flex-1 overflow-auto border rounded-md p-4"
                            >
                                <MarkdownRenderer content={editResponseContent} projectId={project.id} />
                            </TabsContent>
                        </Tabs>
                    </div>

                    <SheetFooter>
                        <Button variant="outline" onClick={() => setEditResponseDialogOpen(false)} className='cursor-pointer'>
                            Cancel
                        </Button>
                        <Button
                            onClick={editResponse}
                            disabled={loading || !editResponseTitle.trim() || !editResponseContent.trim()}
                            className='cursor-pointer'
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Update Response
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>


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
                    <div className="flex border-t">
                        {/* 
                            The className "dark:border-gray-700" will only apply if your app or a parent element has the "dark" class on it.
                            If you are not seeing the dark border, make sure:
                            1. Your Tailwind config has "darkMode" enabled (e.g., "class" or "media").
                            2. The <html> or <body> tag (or a parent) has the "dark" class applied when in dark mode.
                            3. You are not overriding the border color elsewhere.
                        */}
                        <aside className="w-64 min-h-[100vh] border-r mr-8 p-4">
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
                                {/* <Button
                                    variant={activeTab === 'context' ? 'default' : 'ghost'}
                                    className="justify-start"
                                    onClick={() => handleTabSwitch('context')}
                                >
                                    Context
                                </Button> */}
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