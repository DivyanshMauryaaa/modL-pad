import { Bot } from "lucide-react";

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

export default TypingAnimation;