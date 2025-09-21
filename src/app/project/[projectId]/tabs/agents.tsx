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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

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

interface ModelOption {
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

  // Agent form state
  const [agentForm, setAgentForm] = useState({
    name: '',
    description: '',
    model: 'google/gemini-2.0-flash',
    instructions: '',
    contextType: 'all',
    contextFolder: null as any,
    modelParams: {} as any,
    outputType: 'text'
  });

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editFolderDialogOpen, setEditFolderDialogOpen] = useState(false);

  // Edit agent state
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Folder selection state
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentFolderView, setCurrentFolderView] = useState<any>(null);
  const [folderBreadcrumb, setFolderBreadcrumb] = useState<any[]>([]);
  const [folderLoading, setFolderLoading] = useState(false);

  // Model options by output type
  const textModelOptions: ModelOption[] = [
    // OpenAI GPT-4o and variants
    { value: 'openai/gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-2024-08-06', label: 'GPT-4o 2024-08-06' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'chatgpt-4o-latest', label: 'ChatGPT-4o Latest' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'o1-mini', label: 'O1 Mini' },
    { value: 'o3-mini', label: 'O3 Mini' },
    { value: 'gpt-4o-audio-preview', label: 'GPT-4o Audio Preview' },
    { value: 'gpt-4o-mini-audio-preview', label: 'GPT-4o Mini Audio Preview' },
    { value: 'gpt-4o-search-preview', label: 'GPT-4o Search Preview', supportsWebSearch: true, category: 'Web Search' },
    { value: 'gpt-4o-mini-search-preview', label: 'GPT-4o Mini Search Preview', supportsWebSearch: true, category: 'Web Search' },
    { value: 'openai/gpt-4.1-2025-04-14', label: 'GPT-4.1 2025-04-14' },
    { value: 'gpt-4.1-2025-04-14', label: 'GPT-4.1 2025-04-14' },
    { value: 'openai/gpt-4.1-mini-2025-04-14', label: 'GPT-4.1 Mini 2025-04-14' },
    { value: 'gpt-4.1-mini-2025-04-14', label: 'GPT-4.1 Mini 2025-04-14' },
    { value: 'openai/gpt-4.1-nano-2025-04-14', label: 'GPT-4.1 Nano 2025-04-14' },
    { value: 'gpt-4.1-nano-2025-04-14', label: 'GPT-4.1 Nano 2025-04-14' },
    { value: 'openai/o4-mini-2025-04-16', label: 'O4 Mini 2025-04-16' },
    { value: 'o4-mini-2025-04-16', label: 'O4 Mini 2025-04-16' },
    { value: 'openai/o3-2025-04-16', label: 'O3 2025-04-16' },
    { value: 'o3-2025-04-16', label: 'O3 2025-04-16' },
    { value: 'o1', label: 'O1' },
    { value: 'openai/gpt-5-2025-08-07', label: 'GPT-5 2025-08-07' },
    { value: 'gpt-5-2025-08-07', label: 'GPT-5 2025-08-07' },
    { value: 'openai/gpt-5-mini-2025-08-07', label: 'GPT-5 Mini 2025-08-07' },
    { value: 'gpt-5-mini-2025-08-07', label: 'GPT-5 Mini 2025-08-07' },
    { value: 'openai/gpt-5-nano-2025-08-07', label: 'GPT-5 Nano 2025-08-07' },
    { value: 'gpt-5-nano-2025-08-07', label: 'GPT-5 Nano 2025-08-07' },
    { value: 'openai/gpt-5-chat-latest', label: 'GPT-5 Chat Latest' },
    { value: 'gpt-5-chat-latest', label: 'GPT-5 Chat Latest' },

    // Qwen, Mistral, Llama, etc.
    { value: 'Qwen/Qwen2-72B-Instruct', label: 'Qwen2-72B Instruct' },
    { value: 'mistralai/Mixtral-8x7B-Instruct-v0.1', label: 'Mixtral 8x7B Instruct v0.1' },
    { value: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Instruct Turbo' },
    { value: 'meta-llama/Llama-3.2-3B-Instruct-Turbo', label: 'Llama 3.2 3B Instruct Turbo' },
    { value: 'meta-llama/Llama-Guard-3-11B-Vision-Turbo', label: 'Llama Guard 3 11B Vision Turbo' },
    { value: 'Qwen/Qwen2.5-7B-Instruct-Turbo', label: 'Qwen2.5 7B Instruct Turbo' },
    { value: 'Qwen/Qwen2.5-Coder-32B-Instruct', label: 'Qwen2.5 Coder 32B Instruct' },
    { value: 'meta-llama/Meta-Llama-3-8B-Instruct-Lite', label: 'Meta-Llama 3 8B Instruct Lite' },
    { value: 'meta-llama/Llama-3-70b-chat-hf', label: 'Llama 3 70B Chat HF' },
    { value: 'Qwen/Qwen2.5-72B-Instruct-Turbo', label: 'Qwen2.5 72B Instruct Turbo' },
    { value: 'Qwen/QwQ-32B', label: 'QwQ 32B' },
    { value: 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo', label: 'Meta-Llama 3.1 405B Instruct Turbo' },
    { value: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', label: 'Meta-Llama 3.1 8B Instruct Turbo' },
    { value: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', label: 'Meta-Llama 3.1 70B Instruct Turbo' },
    { value: 'mistralai/Mistral-7B-Instruct-v0.2', label: 'Mistral 7B Instruct v0.2' },
    { value: 'meta-llama/LlamaGuard-2-8b', label: 'LlamaGuard 2 8B' },
    { value: 'mistralai/Mistral-7B-Instruct-v0.1', label: 'Mistral 7B Instruct v0.1' },
    { value: 'mistralai/Mistral-7B-Instruct-v0.3', label: 'Mistral 7B Instruct v0.3' },
    { value: 'meta-llama/Meta-Llama-Guard-3-8B', label: 'Meta-Llama Guard 3 8B' },
    { value: 'meta-llama/llama-4-scout', label: 'Llama 4 Scout' },
    { value: 'meta-llama/Llama-4-Scout-17B-16E-Instruct', label: 'Llama 4 Scout 17B 16E Instruct' },
    { value: 'meta-llama/llama-4-maverick', label: 'Llama 4 Maverick' },
    { value: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', label: 'Llama 4 Maverick 17B 128E Instruct FP8' },
    { value: 'Qwen/Qwen3-235B-A22B-fp8-tput', label: 'Qwen3 235B A22B FP8 TPUT' },

    // Anthropic Claude
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus 20240229', category: 'Anthropic' },
    { value: 'anthropic/claude-3-opus-20240229', label: 'Claude 3 Opus 20240229', category: 'Anthropic' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus', category: 'Anthropic' },
    { value: 'claude-3-opus-latest', label: 'Claude 3 Opus Latest', category: 'Anthropic' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku 20240307', category: 'Anthropic' },
    { value: 'anthropic/claude-3-haiku-20240307', label: 'Claude 3 Haiku 20240307', category: 'Anthropic' },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', category: 'Anthropic' },
    { value: 'claude-3-haiku-latest', label: 'Claude 3 Haiku Latest', category: 'Anthropic' },
    { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet 20240620', category: 'Anthropic' },
    { value: 'anthropic/claude-3.5-sonnet-20240620', label: 'Claude 3.5 Sonnet 20240620', category: 'Anthropic' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet 20241022', category: 'Anthropic' },
    { value: 'anthropic/claude-3.5-sonnet-20241022', label: 'Claude 3.5 Sonnet 20241022', category: 'Anthropic' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', category: 'Anthropic' },
    { value: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet Latest', category: 'Anthropic' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku 20241022', category: 'Anthropic' },
    { value: 'anthropic/claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku 20241022', category: 'Anthropic' },
    { value: 'anthropic/claude-3-5-haiku', label: 'Claude 3.5 Haiku', category: 'Anthropic' },
    { value: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku Latest', category: 'Anthropic' },
    { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet 20250219', category: 'Anthropic' },
    { value: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet Latest', category: 'Anthropic' },
    { value: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet', category: 'Anthropic' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 20250514', category: 'Anthropic' },
    { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4', category: 'Anthropic' },
    { value: 'anthropic/claude-sonnet-4-20250514', label: 'Claude Sonnet 4 20250514', category: 'Anthropic' },
    { value: 'claude-sonnet-4-latest', label: 'Claude Sonnet 4 Latest', category: 'Anthropic' },
    { value: 'claude-opus-4-20250514', label: 'Claude Opus 4 20250514', category: 'Anthropic' },
    { value: 'anthropic/claude-opus-4', label: 'Claude Opus 4', category: 'Anthropic' },
    { value: 'anthropic/claude-opus-4-20250514', label: 'Claude Opus 4 20250514', category: 'Anthropic' },
    { value: 'claude-opus-4-latest', label: 'Claude Opus 4 Latest', category: 'Anthropic' },
    { value: 'claude-opus-4-1-20250805', label: 'Claude Opus 4.1 20250805', category: 'Anthropic' },
    { value: 'claude-opus-4-1', label: 'Claude Opus 4.1', category: 'Anthropic' },
    { value: 'anthropic/claude-opus-4.1', label: 'Claude Opus 4.1', category: 'Anthropic' },

    // Gemini
    { value: 'google/gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Exp' },
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash Exp' },
    { value: 'google/gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
    { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'google/gemini-2.5-flash-lite-preview', label: 'Gemini 2.5 Flash Lite Preview' },

    // DeepSeek
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek/deepseek-chat-v3-0324', label: 'DeepSeek Chat v3 0324' },
    { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
    { value: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
    { value: 'deepseek/deepseek-chat-v3.1', label: 'DeepSeek Chat v3.1' },
    { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek/deepseek-reasoner-v3.1', label: 'DeepSeek Reasoner v3.1' },
    { value: 'deepseek/deepseek-reasoner', label: 'DeepSeek Reasoner' },
    { value: 'deepseek/deepseek-prover-v2', label: 'DeepSeek Prover v2' },

    // Alibaba Qwen
    { value: 'alibaba/qwen-max', label: 'Qwen Max' },
    { value: 'qwen-max', label: 'Qwen Max' },
    { value: 'alibaba/qwen-plus', label: 'Qwen Plus' },
    { value: 'qwen-plus', label: 'Qwen Plus' },
    { value: 'alibaba/qwen-turbo', label: 'Qwen Turbo' },
    { value: 'qwen-turbo', label: 'Qwen Turbo' },
    { value: 'alibaba/qwen-max-2025-01-25', label: 'Qwen Max 2025-01-25' },
    { value: 'qwen-max-2025-01-25', label: 'Qwen Max 2025-01-25' },
    { value: 'alibaba/qwen3-coder-480b-a35b-instruct', label: 'Qwen3 Coder 480B A35B Instruct' },
    { value: 'qwen3-coder-480b-a35b-instruct', label: 'Qwen3 Coder 480B A35B Instruct' },
    { value: 'alibaba/qwen3-32b', label: 'Qwen3 32B' },
    { value: 'qwen3-32b', label: 'Qwen3 32B' },
    { value: 'alibaba/qwen3-max-preview', label: 'Qwen3 Max Preview' },
    { value: 'qwen3-max-preview', label: 'Qwen3 Max Preview' },
    { value: 'alibaba/qwen3-235b-a22b-thinking-2507', label: 'Qwen3 235B A22B Thinking 2507' },
    { value: 'qwen3-235b-a22b-thinking-2507', label: 'Qwen3 235B A22B Thinking 2507' },
    { value: 'alibaba/qwen3-next-80b-a3b-thinking', label: 'Qwen3 Next 80B A3B Thinking' },
    { value: 'qwen3-next-80b-a3b-thinking', label: 'Qwen3 Next 80B A3B Thinking' },
    { value: 'alibaba/qwen3-next-80b-a3b-instruct', label: 'Qwen3 Next 80B A3B Instruct' },
    { value: 'qwen3-next-80b-a3b-instruct', label: 'Qwen3 Next 80B A3B Instruct' },

    // Mistral
    { value: 'mistralai/mistral-tiny', label: 'Mistral Tiny' },
    { value: 'mistralai/mistral-nemo', label: 'Mistral Nemo' },
    { value: 'mistralai/codestral-2501', label: 'Codestral 2501' },

    // Anthracite, Nvidia, MiniMax, Bagoodex, Moonshot, Grok, Perplexity, Zhipu
    { value: 'anthracite-org/magnum-v4-72b', label: 'Magnum v4 72B' },
    { value: 'nvidia/llama-3.1-nemotron-70b-instruct', label: 'Llama 3.1 Nemotron 70B Instruct' },
    { value: 'google/gemma-3-4b-it', label: 'Gemma 3 4B IT' },
    { value: 'google/gemma-3-12b-it', label: 'Gemma 3 12B IT' },
    { value: 'google/gemma-3-27b-it', label: 'Gemma 3 27B IT' },
    { value: 'google/gemma-3n-e4b-it', label: 'Gemma 3N E4B IT' },
    { value: 'cohere/command-a', label: 'Cohere Command A' },
    { value: 'openai/gpt-oss-120b', label: 'GPT OSS 120B' },
    { value: 'openai/gpt-oss-20b', label: 'GPT OSS 20B' },
    { value: 'nousresearch/hermes-4-405b', label: 'Hermes 4 405B' },
    { value: 'MiniMax-Text-01', label: 'MiniMax Text 01' },
    { value: 'minimax/m1', label: 'MiniMax M1' },
    { value: 'MiniMax-M1', label: 'MiniMax M1' },
    { value: 'bagoodex/bagoodex-search-v1', label: 'AI Search Engine', category: 'AI Agent' },
    { value: 'moonshot/kimi-k2-preview', label: 'Moonshot Kimi K2 Preview', supportsWebSearch: true, category: 'Web Search' },
    { value: 'kimi-k2-0711-preview', label: 'Kimi K2 0711 Preview' },
    { value: 'x-ai/grok-4-07-09', label: 'Grok 4 07-09' },
    { value: 'grok-4-0709', label: 'Grok 4 0709' },
    { value: 'x-ai/grok-3-beta', label: 'Grok 3 Beta' },
    { value: 'grok-3', label: 'Grok 3' },
    { value: 'x-ai/grok-3-mini-beta', label: 'Grok 3 Mini Beta' },
    { value: 'grok-3-mini', label: 'Grok 3 Mini' },
    { value: 'x-ai/grok-code-fast-1', label: 'Grok Code Fast 1' },
    { value: 'grok-code-fast-1', label: 'Grok Code Fast 1' },
    { value: 'perplexity/sonar', label: 'Perplexity Sonar', supportsWebSearch: true, category: 'Web Search' },
    { value: 'sonar', label: 'Sonar', supportsWebSearch: true, category: 'Web Search' },
    { value: 'perplexity/sonar-pro', label: 'Perplexity Sonar Pro', supportsWebSearch: true, category: 'Web Search' },
    { value: 'sonar-pro', label: 'Sonar Pro', supportsWebSearch: true, category: 'Web Search' },
    { value: 'zhipu/glm-4.5', label: 'GLM 4.5' },
    { value: 'glm-4.5', label: 'GLM 4.5' },
    { value: 'zhipu/glm-4.5-air', label: 'GLM 4.5 Air' },
    { value: 'glm-4.5-air', label: 'GLM 4.5 Air' },
  ];

  const imageModelOptions: ModelOption[] = [
    { value: 'openai/dall-e-3', label: 'DALL-E 3' },
    { value: 'openai/dall-e-2', label: 'DALL-E 2' },
    { value: 'stability-ai/stable-diffusion-3.5-large', label: 'Stable Diffusion 3.5 Large' },
    { value: 'stability-ai/stable-diffusion-3-medium', label: 'Stable Diffusion 3 Medium' },
    { value: 'stability-ai/stable-diffusion-xl-1024-v1-0', label: 'Stable Diffusion XL 1024 v1.0' },
    { value: 'stability-ai/sdxl-turbo', label: 'SDXL Turbo' },
    { value: 'stability-ai/stable-video-diffusion-img2vid-xt-1-1', label: 'Stable Video Diffusion' },
    { value: 'midjourney/midjourney-v6', label: 'Midjourney v6' },
    { value: 'midjourney/midjourney-v5.2', label: 'Midjourney v5.2' },
    { value: 'playgroundai/playground-v2-5-1024px-aesthetic', label: 'Playground v2.5 1024px Aesthetic' },
    { value: 'black-forest-labs/black-forest-labs-flux-1-schnell', label: 'FLUX.1 Schnell' },
    { value: 'black-forest-labs/flux-1-dev', label: 'FLUX.1 Dev' },
    { value: 'black-forest-labs/flux-1-pro', label: 'FLUX.1 Pro' },
    { value: 'ideogram/ideogram-1.0', label: 'Ideogram 1.0' },
    { value: 'ideogram/ideogram-1.0-alpha', label: 'Ideogram 1.0 Alpha' },
    { value: 'ideogram/ideogram-1.0-ultra', label: 'Ideogram 1.0 Ultra' },
    { value: 'leptonai/lepton-llama-3.2-11b-vision-instruct', label: 'Lepton Llama 3.2 11B Vision Instruct' },
    { value: 'google/imagen-3', label: 'Imagen 3' },
    { value: 'google/imagen-3-fast', label: 'Imagen 3 Fast' },
    { value: 'google/imagen-3-ultra', label: 'Imagen 3 Ultra' },
    { value: 'fireworksai/fireworks-vision', label: 'Fireworks Vision' },
    { value: 'anthropic/claude-3-7-sonnet-vision', label: 'Claude 3.7 Sonnet Vision', category: 'Anthropic' },
    { value: 'anthropic/claude-3-5-sonnet-vision', label: 'Claude 3.5 Sonnet Vision', category: 'Anthropic' },
    { value: 'openai/gpt-4o-vision', label: 'GPT-4o Vision' },
    { value: 'openai/gpt-4o-mini-vision', label: 'GPT-4o Mini Vision' },
    { value: 'qwen/qwen2-vl-72b-instruct', label: 'Qwen2 VL 72B Instruct' },
    { value: 'meta-llama/llama-4-scout-vision-17b-16e-instruct', label: 'Llama 4 Scout Vision 17B 16E Instruct' },
    { value: 'meta-llama/llama-4-maverick-vision-17b-128e-instruct', label: 'Llama 4 Maverick Vision 17B 128E Instruct' },
  ];

  const videoModelOptions: ModelOption[] = [
    { value: 'openai/sora', label: 'Sora' },
    { value: 'openai/sora-1.0', label: 'Sora 1.0' },
    { value: 'openai/sora-1.0-turbo', label: 'Sora 1.0 Turbo' },
    { value: 'stability-ai/stable-video-diffusion-img2vid-xt-1-1', label: 'Stable Video Diffusion Img2Vid XT 1.1' },
    { value: 'stability-ai/stable-video-diffusion-img2vid', label: 'Stable Video Diffusion Img2Vid' },
    { value: 'runwayml/gen-3-alpha', label: 'Runway Gen-3 Alpha' },
    { value: 'runwayml/gen-3', label: 'Runway Gen-3' },
    { value: 'runwayml/gen-2', label: 'Runway Gen-2' },
    { value: 'luma-labs/dream-machine', label: 'Luma Dream Machine' },
    { value: 'klingai/kling-v1', label: 'Kling v1' },
    { value: 'google/veo', label: 'Veo' },
    { value: 'google/veo-1.0', label: 'Veo 1.0' },
    { value: 'google/veo-1.0-pro', label: 'Veo 1.0 Pro' },
    { value: 'openai/sora-mini', label: 'Sora Mini' },
    { value: 'openai/sora-mini-1.0', label: 'Sora Mini 1.0' },
    { value: 'stability-ai/stable-video-3d', label: 'Stable Video 3D' },
    { value: 'pika-labs/pika-1.5', label: 'Pika 1.5' },
    { value: 'pika-labs/pika-1.0', label: 'Pika 1.0' },
    { value: 'animatediff/animatediff-xl', label: 'AnimateDiff XL' },
  ];

  const speechModelOptions: ModelOption[] = [
    { value: 'openai/whisper-1', label: 'Whisper v1' },
    { value: 'openai/whisper-large-v3', label: 'Whisper Large v3' },
    { value: 'openai/whisper-large-v3-turbo', label: 'Whisper Large v3 Turbo' },
    { value: 'openai/tts-1', label: 'TTS-1' },
    { value: 'openai/tts-1-hd', label: 'TTS-1 HD' },
    { value: 'openai/tts-1-1106', label: 'TTS-1 1106' },
    { value: 'openai/tts-1-hd-1106', label: 'TTS-1 HD 1106' },
    { value: 'elevenlabs/eleven-multilingual-v2', label: 'Eleven Multilingual v2' },
    { value: 'elevenlabs/eleven-multilingual-v1', label: 'Eleven Multilingual v1' },
    { value: 'elevenlabs/eleven-english-v2', label: 'Eleven English v2' },
    { value: 'elevenlabs/eleven-turbo-v2', label: 'Eleven Turbo v2' },
    { value: 'elevenlabs/eleven-turbo-v2-5', label: 'Eleven Turbo v2.5' },
    { value: 'google/gemini-2.0-flash-thinking-exp-01-21', label: 'Gemini 2.0 Flash Thinking Exp' },
    { value: 'google/text-to-speech', label: 'Google Text-to-Speech' },
    { value: 'google/text-to-speech-premium', label: 'Google Text-to-Speech Premium' },
    { value: 'google/wavenet', label: 'Google WaveNet' },
    { value: 'amazon/polly', label: 'Amazon Polly' },
    { value: 'microsoft/azure-speech', label: 'Azure Speech' },
    { value: 'openai/voice-cloning-v1', label: 'OpenAI Voice Cloning v1' },
    { value: 'elevenlabs/voice-cloning-v1', label: 'ElevenLabs Voice Cloning v1' },
    { value: 'openai/whisper-realtime-v1', label: 'Whisper Realtime v1' },
    { value: 'openai/whisper-realtime-v1-2024-12-17', label: 'Whisper Realtime v1 2024-12-17' },
  ];

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

  // Memoized fetch functions
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
      const { error } = await supabase.from('agents')
        .insert({
          project_id: project.id,
          name: agentForm.name,
          description: agentForm.description,
          model: agentForm.model,
          instructions: agentForm.instructions,
          context_type: agentForm.contextType,
          context_folder: agentForm.contextFolder?.id || null,
          model_params: agentForm.modelParams,
          output_type: agentForm.outputType,
        });

      if (error) throw error;

      // Reset form
      setAgentForm({
        name: '',
        description: '',
        model: 'google/gemini-2.0-flash',
        instructions: '',
        contextType: 'all',
        contextFolder: null,
        modelParams: {},
        outputType: 'text'
      });

      setAddDialogOpen(false);
      fetchAgents();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const updateAgent = async () => {
    if (!editingAgent) return;

    try {
      const { error } = await supabase
        .from('agents')
        .update({
          name: agentForm.name,
          description: agentForm.description,
          model: agentForm.model,
          instructions: agentForm.instructions,
          context_type: agentForm.contextType,
          context_folder: agentForm.contextFolder?.id || null,
          model_params: agentForm.modelParams,
          output_type: agentForm.outputType
        })
        .eq('id', editingAgent.id);

      if (error) throw error;

      setEditDialogOpen(false);
      setEditingAgent(null);
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
    setAgentForm({
      name: agent.name,
      description: agent.description,
      model: agent.model,
      instructions: agent.instructions || '',
      contextType: agent.context_type,
      contextFolder: agent.context_folder || null,
      modelParams: agent.model_params || {},
      outputType: agent.output_type || 'text'
    });
    setEditDialogOpen(true);
  };

  // Folder dialog navigation functions
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
    setAgentForm(prev => ({ ...prev, contextFolder: folder }));
    if (isEdit) {
      setEditFolderDialogOpen(false);
    } else {
      setFolderDialogOpen(false);
    }
  };

  const clearFolderSelection = (isEdit: boolean = false) => {
    setAgentForm(prev => ({ ...prev, contextFolder: null }));
    if (isEdit) {
      setEditFolderDialogOpen(false);
    } else {
      setFolderDialogOpen(false);
    }
  };

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

  const AgentForm = ({ isEdit }: { isEdit: boolean }) => {
    const currentModels = getModelsByOutputType(agentForm.outputType);
    const currentModel = currentModels.find(m => m.value === agentForm.model);

    // Reset model when output type changes if current model is not available for the new output type
    useEffect(() => {
      if (!currentModels.some(m => m.value === agentForm.model)) {
        setAgentForm(prev => ({
          ...prev,
          model: currentModels[0]?.value || ''
        }));
      }
    }, [agentForm.outputType, currentModels]);

    return (
      <div className="space-y-4 pt-4">
        <Input
          placeholder="Name your Agent"
          value={agentForm.name}
          onChange={(e) => setAgentForm(prev => ({ ...prev, name: e.target.value }))}
        />
        <Input
          placeholder="Description for your Agent"
          value={agentForm.description}
          onChange={(e) => setAgentForm(prev => ({ ...prev, description: e.target.value }))}
        />
        <Textarea
          maxLength={2000}
          placeholder="Instructions for your Agent"
          value={agentForm.instructions}
          onChange={(e) => setAgentForm(prev => ({ ...prev, instructions: e.target.value }))}
        />
        <Select
          value={agentForm.outputType}
          onValueChange={(value) => setAgentForm(prev => ({ ...prev, outputType: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Output Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="image">Image</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={agentForm.model}
          onValueChange={(value) => setAgentForm(prev => ({ ...prev, model: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Model" />
          </SelectTrigger>
          <SelectContent>
            {currentModels.map((model) => (
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

        {currentModel?.supportsWebSearch && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-2">
            <div className="font-medium mb-1">Web Search Enabled</div>
            <div className="flex items-center space-x-2">
              <Switch
                id={isEdit ? "edit-deep-search" : "deep-search"}
                checked={agentForm.modelParams.search_mode === 'academic'}
                onCheckedChange={(checked: any) => {
                  setAgentForm(prev => ({
                    ...prev,
                    modelParams: { ...prev.modelParams, search_mode: checked ? 'academic' : undefined }
                  }));
                }}
              />
              <Label htmlFor={isEdit ? "edit-deep-search" : "deep-search"}>
                {isEdit ? "Deep Search" : "Academic Search"}
              </Label>
            </div>
            <p className="text-blue-700 dark:text-blue-300">
              Deep Search provides more thorough results but may take longer.
            </p>
          </div>
        )}

        <Select
          value={agentForm.contextType}
          onValueChange={(value) => setAgentForm(prev => ({ ...prev, contextType: value }))}
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
              onClick={() => openFolderDialog(isEdit)}
            >
              {agentForm.contextFolder ? (
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span className="truncate">{agentForm.contextFolder.name}</span>
                </div>
              ) : (
                "Select folder..."
              )}
              <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
            {agentForm.contextFolder && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAgentForm(prev => ({ ...prev, contextFolder: null }))}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {agentForm.contextFolder && (
            <p className="text-xs text-gray-500">
              Agent will use responses from "{agentForm.contextFolder.name}" folder for context
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          <Button onClick={isEdit ? updateAgent : addAgent} className="flex-1 cursor-pointer">
            {isEdit ? 'Update' : 'Add'} Agent
          </Button>
          <Button
            variant="outline"
            onClick={() => isEdit ? setEditDialogOpen(false) : setAddDialogOpen(false)}
            className="flex-1 cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
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
          <AgentForm isEdit={true} />
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

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <div className="border rounded-lg p-4 hover:border-black cursor-pointer">
                <div className="p-4 text-center text-3xl font-semibold">
                  Add Agent
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  <Bot className="w-10 h-10 mb-2" />
                  Add Agent
                </DialogTitle>
                <DialogDescription>
                  Add a new agent to your project.
                </DialogDescription>
              </DialogHeader>
              <AgentForm isEdit={false} />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default Agents;