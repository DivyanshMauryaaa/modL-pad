"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bot, RefreshCw, Save, Play, Pause, Download } from "lucide-react";
import MarkdownRenderer from "./markdown";
import { SaveResponseDialog, WebSearchResults } from "./page";

interface MessageBubbleProps {
  message: any;
  agents: any[];
  onRetry?: () => void;
  projectId: string;
  chatId: string;
  responseStatus: 'loading' | 'completed' | 'error';
}

const MessageBubble = ({
  message,
  agents,
  onRetry,
  projectId,
  chatId,
  responseStatus
}: MessageBubbleProps) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [responseLoading, setResponseLoading] = useState(responseStatus);

  // Handle different output types
  const renderMediaContent = () => {
    switch (message.output_type) {
      case 'image':
        return (
          <div className="mt-3">
            <img
              src={message.media_url}
              alt={message.content}
              className="rounded-lg max-w-full h-auto max-h-96 object-contain border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            {message.content && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <MarkdownRenderer 
                    content={message.content} 
                    projectId={projectId}
                    agentId={message.agent_id}
                    chatId={chatId}
                    originalMessageId={message.id}
                />
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="mt-3">
            <video
              src={message.media_url}
              controls
              className="rounded-lg max-w-full h-auto max-h-96 border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            >
              Your browser does not support the video tag.
            </video>
            {message.content && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <MarkdownRenderer 
                    content={message.content} 
                    projectId={projectId}
                    agentId={message.agent_id}
                    chatId={chatId}
                    originalMessageId={message.id}
                />
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="mt-3">
            <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                className="rounded-full w-10 h-10 p-0"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <div className="flex-1">
                <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = message.media_url;
                  link.download = `audio-${message.id}.mp3`;
                  link.click();
                }}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
            
            <audio
              src={message.media_url}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onTimeUpdate={(e) => {
                const audio = e.currentTarget;
                const progress = (audio.currentTime / audio.duration) * 100;
                setAudioProgress(progress);
              }}
              onError={(e) => {
                console.error('Audio loading error:', e);
              }}
            />
            
            {message.content && (
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <MarkdownRenderer 
                    content={message.content} 
                    projectId={projectId}
                    agentId={message.agent_id}
                    chatId={chatId}
                    originalMessageId={message.id}
                />
              </div>
            )}
          </div>
        );

      default: // text
        return <MarkdownRenderer 
                    content={message.content} 
                    projectId={projectId}
                    agentId={message.agent_id}
                    chatId={chatId}
                    originalMessageId={message.id}
                />;
    }
  };

  const getAgentName = () => {
    if (message.role !== 'assistant' || message.isError) return null;
    
    const agent = agents.find(a => a.id === message.agent_id);
    if (!agent) return 'AI Assistant';
    
    return `${agent.name} (${agent.output_type})`;
  };

  return (
    <>
      <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-[90%] rounded-2xl p-4 chat-message ${
          message.role === 'user'
            ? 'bg-card'
            : message.isError
            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
            : 'bg-card'
        }`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {message.role === 'assistant' && !message.isError && (
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {getAgentName()}
                  </span>
                </div>
              )}

              {message.isError ? (
                <div dangerouslySetInnerHTML={{ __html: message.content }} />
              ) : (
                renderMediaContent()
              )}
            </div>
          </div>

          {/* Sources */}
          {message.sources && <WebSearchResults sources={message.sources} />}

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            {message.role === 'assistant' && onRetry && (
              <Button
                size="sm"
                onClick={onRetry}
                className="text-xs h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
              </Button>
            )}
            
            {message.role === 'assistant' && !message.isError && message.output_type === 'text' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSaveDialogOpen(true)}
                className="h-8"
                title="Save Response"
              >
                <Save className="h-3 w-3" />
              </Button>
            )}

            {/* Download button for media */}
            {message.role === 'assistant' && !message.isError && message.media_url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = message.media_url;
                  
                  // Set appropriate file extension based on output type
                  const extension = message.output_type === 'image' ? 'png' : 
                                  message.output_type === 'video' ? 'mp4' : 
                                  message.output_type === 'audio' ? 'mp3' : 'txt';
                  
                  link.download = `${message.output_type}-${message.id}.${extension}`;
                  link.click();
                }}
                className="h-8"
                title={`Download ${message.output_type}`}
              >
                <Download className="h-3 w-3" />
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

export default MessageBubble;