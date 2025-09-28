"use client"

import { useState, useEffect, useCallback } from 'react';
import { Bot, Folder, ChevronRight, X, Home, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import supabase from '@/lib/supabase';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { textModelOptions, imageModelOptions, videoModelOptions, speechModelOptions } from './(agentData)/models';

// Types
interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  instructions: string;
  context_type: string;
  context_folder: any;
  model_params: any;
  output_type: string;
}

interface Folder {
  id: string;
  name: string;
  parent_folder: string | null;
  created_at: string;
}

export interface ModelOption {
  value: string;
  label: string;
  supportsWebSearch?: boolean;
  category?: string;
}

const Agents = ({ project }: { project: any }) => {
  // State management
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false);

  // Add form states
  const [addAgentName, setAddAgentName] = useState('');
  const [addAgentDescription, setAddAgentDescription] = useState('');
  const [addAgentInstructions, setAddAgentInstructions] = useState('');
  const [addAgentModel, setAddAgentModel] = useState('google/gemini-2.0-flash');
  const [addAgentContextType, setAddAgentContextType] = useState('all');
  const [addAgentContextFolder, setAddAgentContextFolder] = useState(null as any);
  const [addAgentModelParams, setAddAgentModelParams] = useState({} as any);
  const [addAgentOutputType, setAddAgentOutputType] = useState('text');

  // Edit form states
  const [editAgentName, setEditAgentName] = useState('');
  const [editAgentDescription, setEditAgentDescription] = useState('');
  const [editAgentInstructions, setEditAgentInstructions] = useState('');
  const [editAgentModel, setEditAgentModel] = useState('google/gemini-2.0-flash');
  const [editAgentContextType, setEditAgentContextType] = useState('all');
  const [editAgentContextFolder, setEditAgentContextFolder] = useState(null as any);
  const [editAgentModelParams, setEditAgentModelParams] = useState({} as any);
  const [editAgentOutputType, setEditAgentOutputType] = useState('text');

  // Edit agent state
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Folder selection state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderView, setCurrentFolderView] = useState<any>(null);
  const [folderBreadcrumb, setFolderBreadcrumb] = useState<any[]>([]);
  const [folderLoading, setFolderLoading] = useState(false);

  // Error Dialog
  const [errorText, setErrorText] = useState('');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  // Get models based on output type
  const getModelsByOutputType = (outputType: string): ModelOption[] => {
    switch (outputType) {
      case 'image':
        return imageModelOptions;
      case 'video':
        return videoModelOptions;
      case 'audio':
        return speechModelOptions;
      case 'text':
      default:
        return textModelOptions;
    }
  };

  // Memoized fetch functions (same as before)
  const fetchAllFolders = useCallback(async (): Promise<Folder[]> => {
    try {
      const { data, error } = await supabase
        .from('response_folders')
        .select('*')
        .eq('project_id', project.id)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all folders:', error);
      return [];
    }
  }, [project.id]);

  const fetchFoldersForDialog = useCallback(async (parentFolderId: string | null = null) => {
    try {
      setFolderLoading(true);
      let query = supabase.from('response_folders')
        .select('*')
        .eq('project_id', project.id)
        .order('name');

      if (parentFolderId === null) {
        query = query.is('parent_folder', null);
      } else {
        query = query.eq('parent_folder', parentFolderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      setFolders([]);
    } finally {
      setFolderLoading(false);
    }
  }, [project.id]);

  const fetchAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('agents')
        .select(`
          *,
          context_folder:response_folders(id, name)
        `)
        .eq('project_id', project.id);

      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  const addAgent = async () => {
    try {
      if (!addAgentName.trim()) {
        setErrorText('Please enter a name for the agent');
        setErrorDialogOpen(true);
        return;
      }

      if (!addAgentInstructions.trim()) {
        setErrorText('Please enter instructions for the agent');
        setErrorDialogOpen(true);
        return;
      }

      const { error } = await supabase.from('agents')
        .insert({
          project_id: project.id,
          name: addAgentName,
          description: addAgentDescription,
          model: addAgentModel,
          instructions: addAgentInstructions,
          context_type: addAgentContextType,
          context_folder: addAgentContextFolder?.id || null,
          model_params: addAgentModelParams,
          output_type: addAgentOutputType,
        });

      if (error) throw error;

      // Reset form
      setAddAgentName('');
      setAddAgentDescription('');
      setAddAgentInstructions('');
      setAddAgentModel('google/gemini-2.0-flash');
      setAddAgentContextType('all');
      setAddAgentContextFolder(null);
      setAddAgentModelParams({});
      setAddAgentOutputType('text');
      setAddDialogOpen(false);
      fetchAgents();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateAgent = async () => {
    if (!editingAgent) return;

    try {
      if (!editAgentName.trim()) {
        setErrorText('Please enter a name for the agent');
        setErrorDialogOpen(true);
        return;
      }
      if (!editAgentInstructions.trim()) {
        setErrorText('Please enter instructions for the agent');
        setErrorDialogOpen(true);
        return;
      }

      const { error } = await supabase
        .from('agents')
        .update({
          name: editAgentName,
          description: editAgentDescription,
          model: editAgentModel,
          instructions: editAgentInstructions,
          context_type: editAgentContextType,
          context_folder: editAgentContextFolder?.id || null,
          model_params: editAgentModelParams,
          output_type: editAgentOutputType
        })
        .eq('id', editingAgent.id);

      if (error) throw error;

      setEditDialogOpen(false);
      setEditingAgent(null);
      // Don't reset edit states here to avoid flickering during close animation
      fetchAgents();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("agents")
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDeleteDialog(false);
      fetchAgents();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const openEditDialog = (agent: Agent) => {
    setEditingAgent(agent);
    setEditAgentName(agent.name);
    setEditAgentDescription(agent.description);
    setEditAgentInstructions(agent.instructions || '');
    setEditAgentModel(agent.model);
    setEditAgentContextType(agent.context_type);
    setEditAgentContextFolder(agent.context_folder || null);
    setEditAgentModelParams(agent.model_params || {});
    setEditAgentOutputType(agent.output_type || 'text');
    setEditDialogOpen(true);
  };

  // Reset edit states when dialog closes
  useEffect(() => {
    if (!editDialogOpen) {
      // Small timeout to allow closing animation to complete
      const timer = setTimeout(() => {
        setEditAgentName('');
        setEditAgentDescription('');
        setEditAgentInstructions('');
        setEditAgentModel('google/gemini-2.0-flash');
        setEditAgentContextType('all');
        setEditAgentContextFolder(null);
        setEditAgentModelParams({});
        setEditAgentOutputType('text');
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [editDialogOpen]);

  // Folder dialog navigation functions (same as before)
  const navigateToFolderInDialog = async (folder: any) => {
    setCurrentFolderView(folder);
    setFolderBreadcrumb(prev => [...prev, folder]);
    await fetchFoldersForDialog(folder.id);
  };

  const navigateToRootInDialog = async () => {
    setCurrentFolderView(null);
    setFolderBreadcrumb([]);
    await fetchFoldersForDialog(null);
  };

  const navigateToBreadcrumbInDialog = async (index: number) => {
    const targetFolder = folderBreadcrumb[index];
    const newBreadcrumb = folderBreadcrumb.slice(0, index + 1);

    setCurrentFolderView(targetFolder);
    setFolderBreadcrumb(newBreadcrumb);
    await fetchFoldersForDialog(targetFolder.id);
  };

  const goBackInDialog = async () => {
    if (folderBreadcrumb.length === 0) return;

    if (folderBreadcrumb.length === 1) {
      await navigateToRootInDialog();
    } else {
      const newBreadcrumb = folderBreadcrumb.slice(0, -1);
      const parentFolder = newBreadcrumb[newBreadcrumb.length - 1];

      setCurrentFolderView(parentFolder);
      setFolderBreadcrumb(newBreadcrumb);
      await fetchFoldersForDialog(parentFolder.id);
    }
  };

  const openFolderDialog = async (isEdit: boolean = false) => {
    // Reset dialog state
    setCurrentFolderView(null);
    setFolderBreadcrumb([]);
    await fetchFoldersForDialog(null);

    if (isEdit) {
      setEditFolderDialogOpen(true);
    } else {
      setFolderDialogOpen(true);
    }
  };

  const selectFolder = (folder: any, isEdit: boolean = false) => {
    if (isEdit) {
      setEditAgentContextFolder(folder);
      setEditFolderDialogOpen(false);
    } else {
      setAddAgentContextFolder(folder);
      setFolderDialogOpen(false);
    }
  };

  const clearFolderSelection = (isEdit: boolean = false) => {
    if (isEdit) {
      setEditAgentContextFolder(null);
      setEditFolderDialogOpen(false);
    } else {
      setAddAgentContextFolder(null);
      setFolderDialogOpen(false);
    }
  };

  const currentEditModels = getModelsByOutputType(editAgentOutputType);
  const currentEditModel = currentEditModels.find((m: any) => m.value === editAgentModel);

  // Reset model when output type changes if current model is not available for the new output type
  useEffect(() => {
    if (!currentEditModels.some((m: any) => m.value === editAgentModel)) {
      setEditAgentModel(currentEditModels[0]?.value || '');
    }
  }, [editAgentOutputType, currentEditModels]);

  const currentAddModels = getModelsByOutputType(addAgentOutputType);
  const currentAddModel = currentAddModels.find((m: any) => m.value === addAgentModel);

  // Reset model when output type changes if current model is not available for the new output type
  useEffect(() => {
    if (!currentAddModels.some((m: any) => m.value === addAgentModel)) {
      setAddAgentModel(currentAddModels[0]?.value || '');
    }
  }, [addAgentOutputType, currentAddModels]);


  // Effects
  useEffect(() => {
    if (project.id) {
      fetchAgents();
    }
  }, [project.id, fetchAgents]);

  // Reusable dialog components
  const FolderDialog = ({ isEdit }: { isEdit: boolean }) => (
    <Dialog open={isEdit ? editFolderDialogOpen : folderDialogOpen}
      onOpenChange={isEdit ? setEditFolderDialogOpen : setFolderDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Context Folder</DialogTitle>
          <DialogDescription>
            Choose a folder for the agent to use responses from as context.
          </DialogDescription>
        </DialogHeader>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-gray-50 text-sm">
          <button
            onClick={navigateToRootInDialog}
            className="flex items-center gap-1 hover:text-blue-600 transition-colors"
          >
            <Home size={14} />
            Root
          </button>

          {folderBreadcrumb.map((folder, index) => (
            <div key={folder.id} className="flex items-center gap-1">
              <ChevronRight size={14} className="text-gray-400" />
              <button
                onClick={() => navigateToBreadcrumbInDialog(index)}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                {folder.name}
              </button>
            </div>
          ))}

          {folderBreadcrumb.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={goBackInDialog}
              className="ml-auto h-6 px-2"
            >
              <ArrowLeft size={14} />
            </Button>
          )}
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {/* Option to select no folder */}
          <div
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
            onClick={() => clearFolderSelection(isEdit)}
          >
            <Home className="h-5 w-5 text-gray-500" />
            <div>
              <p className="font-medium">No specific folder</p>
              <p className="text-xs text-gray-500">Use all responses</p>
            </div>
          </div>

          {currentFolderView && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-blue-50 cursor-pointer border-blue-200"
              onClick={() => selectFolder(currentFolderView, isEdit)}
            >
              <Folder className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Select "{currentFolderView.name}"</p>
                <p className="text-xs text-gray-500">Use responses from this folder</p>
              </div>
            </div>
          )}

          {folderLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            folders.map((folder) => (
              <div
                key={folder.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                onClick={() => navigateToFolderInDialog(folder)}
              >
                <Folder className="h-5 w-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium">{folder.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(folder.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => isEdit ? setEditFolderDialogOpen(false) : setFolderDialogOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-red-500">
            {errorText}
          </DialogDescription>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setErrorDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Sheet open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <SheetContent className="w-xl p-5">
          <SheetHeader>
            <SheetTitle>
              <Bot className="w-10 h-10 mb-2" />
              Edit Agent
            </SheetTitle>
            <SheetDescription>
              Update your agent's configuration.
            </SheetDescription>
          </SheetHeader>
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
              value={editAgentOutputType}
              onValueChange={(value) => setEditAgentOutputType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Output Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                {/* <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem> */}
              </SelectContent>
            </Select>
            <Select
              value={editAgentModel}
              onValueChange={(value) => setEditAgentModel(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                {currentEditModels.map((model) => (
                  <SelectItem
                    key={model.value}
                    value={model.value}
                    className={model.supportsWebSearch ? 'border-l-2 border-blue-500' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{model.label}</span>
                      {model.category && (
                        <span className="text-xs text-blue-500 ml-2">{model.category}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentEditModel?.supportsWebSearch && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-2">
                <div className="font-medium mb-1">Web Search Enabled</div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-deep-search"
                    checked={editAgentModelParams.search_mode === 'academic'}
                    onCheckedChange={(checked: any) => {
                      setEditAgentModelParams((prev: any) => ({
                        ...prev,
                        search_mode: checked ? 'academic' : undefined
                      }));
                    }}
                  />
                  <Label htmlFor="edit-deep-search">
                    Academic Search
                  </Label>
                </div>
                <p className="text-blue-700 dark:text-blue-300">
                  Deep Search provides more thorough results but may take longer.
                </p>
              </div>
            )}

            <Select
              value={editAgentContextType}
              onValueChange={(value) => setEditAgentContextType(value)}
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

            {/* Context Folder Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Context Folder (Optional)</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 justify-between"
                  onClick={() => openFolderDialog(true)}
                >
                  {editAgentContextFolder ? (
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span className="truncate">{editAgentContextFolder.name}</span>
                    </div>
                  ) : (
                    "Select folder..."
                  )}
                  <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {editAgentContextFolder && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setEditAgentContextFolder(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {editAgentContextFolder && (
                <p className="text-xs text-gray-500">
                  Agent will use responses from "{editAgentContextFolder.name}" folder for context
                </p>
              )}
            </div>

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
        </SheetContent>
      </Sheet>

      <Sheet open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <SheetTrigger asChild>
          <div className="border rounded-lg p-4 hover:border-black cursor-pointer">
            <div className="p-4 text-center text-3xl font-semibold">
              Add Agent
            </div>
          </div>
        </SheetTrigger>
        <SheetContent className="max-w-lg p-5">
          <SheetHeader>
            <SheetTitle>
              <Bot className="w-10 h-10 mb-2" />
              Add Agent
            </SheetTitle>
            <SheetDescription>
              Add a new agent to your project.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Name your Agent"
              value={addAgentName}
              onChange={(e) => setAddAgentName(e.target.value)}
            />
            <Input
              placeholder="Description for your Agent"
              value={addAgentDescription}
              onChange={(e) => setAddAgentDescription(e.target.value)}
            />
            <Textarea
              maxLength={2000}
              placeholder="Instructions for your Agent"
              value={addAgentInstructions}
              onChange={(e) => setAddAgentInstructions(e.target.value)}
            />
            <Select
              value={addAgentOutputType}
              onValueChange={(value) => setAddAgentOutputType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Output Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                {/* <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem> */}
              </SelectContent>
            </Select>
            <Select
              value={addAgentModel}
              onValueChange={(value) => setAddAgentModel(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                {currentAddModels.map((model) => (
                  <SelectItem
                    key={model.value}
                    value={model.value}
                    className={model.supportsWebSearch ? 'border-l-2 border-blue-500' : ''}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{model.label}</span>
                      {model.category && (
                        <span className="text-xs text-blue-500 ml-2">{model.category}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentEditModel?.supportsWebSearch && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-2">
                <div className="font-medium mb-1">Web Search Enabled</div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="deep-search"
                    checked={addAgentModelParams.search_mode === 'academic'}
                    onCheckedChange={(checked: any) => {
                      setAddAgentModelParams((prev: any) => ({
                        ...prev,
                        search_mode: checked ? 'academic' : undefined
                      }));
                    }}
                  />
                  <Label htmlFor="deep-search">
                    Academic Search
                  </Label>
                </div>
                <p className="text-blue-700 dark:text-blue-300">
                  Deep Search provides more thorough results but may take longer.
                </p>
              </div>
            )}

            <Select
              value={addAgentContextType}
              onValueChange={(value) => setAddAgentContextType(value)}
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

            {/* Context Folder Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Context Folder (Optional)</label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 justify-between"
                  onClick={() => openFolderDialog(false)}
                >
                  {addAgentContextFolder ? (
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span className="truncate">{addAgentContextFolder.name}</span>
                    </div>
                  ) : (
                    "Select folder..."
                  )}
                  <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
                {addAgentContextFolder && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setAddAgentContextFolder(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {addAgentContextFolder && (
                <p className="text-xs text-gray-500">
                  Agent will use responses from "{addAgentContextFolder.name}" folder for context
                </p>
              )}
            </div>

            <div className="flex space-x-2">
              <Button onClick={addAgent} className="flex-1 cursor-pointer">
                Add Agent
              </Button>
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                className="flex-1 cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Folder Selection Dialogs */}
      <FolderDialog isEdit={false} />
      <FolderDialog isEdit={true} />

      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}

      {agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-30">
          {agents.map((agent) => (
            <div key={agent.id} className="border rounded-lg p-4">
              <div className="p-4">
                <Bot className="w-10 h-10 mb-2" />
                <h3 className="text-lg font-semibold mb-2">{agent.name}</h3>
                <p className="text-gray-600 mb-2">{agent.description}</p>
                {agent.context_folder && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Folder className="h-4 w-4" />
                    <span>Context: {agent.context_folder.name}</span>
                  </div>
                )}
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
  );
};

export default Agents;