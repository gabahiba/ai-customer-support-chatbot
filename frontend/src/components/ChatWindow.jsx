import { useEffect, useRef, useState } from "react";
import { FiSend, FiPaperclip, FiMenu, FiLoader } from "react-icons/fi";
import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow({
  messages,
  onSendMessage,
  isSending,
  onUploadPdf,
  isUploading,
  uploadProgress,
  browserId,
  onOpenSidebar,
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    onSendMessage(trimmed);
    setInput("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUploadPdf(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full min-w-0 bg-gradient-to-b from-sky-50 to-white dark:from-black dark:to-slate-950">
      <header className="flex items-center justify-between px-4 py-3 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            <FiMenu size={18} />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              مساعد الدعم الفني الذكي
            </h1>
            <p className="text-[11px] text-slate-400">
              {browserId ? `المستخدم: ${browserId.slice(0, 8)}` : ""}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-2xl mb-2">
              💬
            </div>
            <p className="text-sm max-w-xs">
              ارفع ملف PDF ثم اسأل عنه — سيجيبك المساعد فقط من محتوى الملفات المرفوعة.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}

        {isSending && (
          <div className="flex items-center gap-2 text-slate-400 text-sm ps-11">
            <FiLoader className="animate-spin" size={14} />
            جارٍ التفكير...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 md:p-4 border-t border-black/5 dark:border-white/5">
        {isUploading && (
          <div className="mb-2 text-xs text-brand-600 dark:text-brand-300 flex items-center gap-2">
            <FiLoader className="animate-spin" size={12} />
            جارٍ رفع الملف ومعالجته... {uploadProgress}%
          </div>
        )}
        <div className="flex items-end gap-2 rounded-2xl bg-white dark:bg-slate-800 shadow-sm p-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-brand-500/10 transition-colors"
            title="رفع ملف PDF"
          >
            <FiPaperclip size={18} />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="اكتب سؤالك هنا..."
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none text-sm py-2 max-h-32 placeholder:text-slate-400"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="shrink-0 p-2.5 rounded-xl bg-gradient-to-l from-brand-500 to-brand-600 text-white
              disabled:opacity-40 disabled:cursor-not-allowed hover:from-brand-400 hover:to-brand-500 transition-colors"
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
