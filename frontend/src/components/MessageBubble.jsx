import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { FiUser, FiCpu } from "react-icons/fi";

export default function MessageBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""} animate-fade-in`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-brand-500 text-white"
            : "bg-gradient-to-br from-brand-400 to-brand-600 text-white"
        }`}
      >
        {isUser ? <FiUser size={15} /> : <FiCpu size={15} />}
      </div>

      <div
        className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed markdown-content ${
          isUser
            ? "bg-brand-500 text-white rounded-tr-sm"
            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-sm"
        }`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
