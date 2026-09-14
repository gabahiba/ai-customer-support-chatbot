import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar.jsx";
import ChatWindow from "./components/ChatWindow.jsx";
import {
  getOrCreateBrowserId,
  clearBrowserId,
  fetchSessions,
  createSession,
  renameSession,
  deleteSession,
  fetchMessages,
  sendMessage,
  uploadPdf,
} from "./services/api.js";

export default function App() {
  const [browserId] = useState(() => getOrCreateBrowserId());
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("chat-dark-mode") === "true"
  );

  const loadSessions = useCallback(async () => {
    try {
      const data = await fetchSessions(browserId);
      setSessions(data);
      return data;
    } catch (err) {
      console.error("تعذّر جلب الجلسات:", err);
      return [];
    }
  }, [browserId]);

  // تحميل أولي
  useEffect(() => {
    (async () => {
      const data = await loadSessions();
      if (data.length > 0) {
        setActiveSessionId(data[0].session_id);
      } else {
        // ✅ إنشاء جلسة جديدة بـ session_id فريد
        const newSessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
        const created = await createSession(newSessionId, "محادثة جديدة", browserId);
        setSessions([created]);
        setActiveSessionId(created.session_id);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تحميل الرسائل عند تغيير الجلسة
  useEffect(() => {
    if (!activeSessionId) return;
    (async () => {
      try {
        const data = await fetchMessages(activeSessionId, browserId);
        setMessages(data);
      } catch (err) {
        console.error("تعذّر جلب الرسائل:", err);
        setMessages([]);
      }
    })();
  }, [activeSessionId, browserId]);

  const handleNewSession = async () => {
    // ✅ جلسة جديدة بـ session_id فريد
    const newSessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
    const created = await createSession(newSessionId, "محادثة جديدة", browserId);
    setSessions((prev) => [created, ...prev]);
    setActiveSessionId(created.session_id);
    setMessages([]);
  };

  const handleSelectSession = (sessionId) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    setIsSidebarOpen(false);
  };

  const handleRenameSession = async (sessionId, title) => {
    const updated = await renameSession(sessionId, title, browserId);
    setSessions((prev) => prev.map((s) => (s.session_id === sessionId ? updated : s)));
  };

  const handleDeleteSession = async (sessionId) => {
    await deleteSession(sessionId, browserId);
    const remaining = sessions.filter((s) => s.session_id !== sessionId);
    setSessions(remaining);

    if (sessionId === activeSessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].session_id);
      } else {
        const newSessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
        const created = await createSession(newSessionId, "محادثة جديدة", browserId);
        setSessions([created]);
        setActiveSessionId(created.session_id);
        setMessages([]);
      }
    }
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || isSending) return;

    let currentSessionId = activeSessionId;
    if (!currentSessionId) {
      // ✅ إنشاء جلسة جديدة إذا لم توجد
      currentSessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
      try {
        await createSession(currentSessionId, text.slice(0, 40), browserId);
        setActiveSessionId(currentSessionId);
        await loadSessions();
      } catch (error) {
        console.error('فشل في إنشاء محادثة:', error);
        return;
      }
    }

    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);

    try {
      const result = await sendMessage(currentSessionId, text, browserId);
      const assistantMsg = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.response,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (messages.length === 0) {
        await handleRenameSession(currentSessionId, text.slice(0, 40));
      } else {
        await loadSessions();
      }
    } catch (err) {
      console.error("فشل إرسال الرسالة:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "عذراً، حدث خطأ أثناء الاتصال بالخادم. الرجاء المحاولة مرة أخرى.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleUploadPdf = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadPdf(file, setUploadProgress);
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          role: "assistant",
          content: `✅ ${result.message} (${result.chunks_stored} جزء مفهرس). يمكنك الآن طرح أسئلتك حوله.`,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("فشل رفع الملف:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `upload-error-${Date.now()}`,
          role: "assistant",
          content: "عذراً، تعذّر رفع الملف أو معالجته.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLogout = () => {
    clearBrowserId();
    window.location.reload();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-800 dark:text-slate-100">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleNewSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((v) => !v)}
        onLogout={handleLogout}
        browserId={browserId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <ChatWindow
        messages={messages}
        onSendMessage={handleSendMessage}
        isSending={isSending}
        onUploadPdf={handleUploadPdf}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        browserId={browserId}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />
    </div>
  );
}