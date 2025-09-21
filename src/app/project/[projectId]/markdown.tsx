import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from "sonner";

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

export default MarkdownRenderer;