import { useMemo, useState } from "react";
import { FiPlus, FiSearch, FiMoon, FiSun, FiLogOut, FiX } from "react-icons/fi";
import SessionItem from "./SessionItem.jsx";
import { groupSessionsByDate } from "../utils/dateUtils.js";

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  browserId,
  isOpen,
  onClose,
}) {
  const [query, setQuery] = useState("");

  const filteredSessions = useMemo(() => {
    if (!query.trim()) return sessions;
    const q = query.trim().toLowerCase();
    return sessions.filter((s) => (s.title || "").toLowerCase().includes(q));
  }, [sessions, query]);

  const groups = useMemo(() => groupSessionsByDate(filteredSessions), [filteredSessions]);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 right-0 z-40 w-72 shrink-0 flex flex-col
          bg-gradient-to-b from-brand-50 to-white dark:from-slate-950 dark:to-black
          border-l border-black/5 dark:border-white/5
          transition-transform duration-200 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"}`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 md:hidden">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">المحادثات</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            <FiX size={18} />
          </button>
        </div>

        <div className="px-4 pt-4 md:pt-4 pb-3">
          <button
            onClick={onNewSession}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5
              bg-gradient-to-l from-brand-500 to-brand-600 text-white font-medium text-sm
              shadow-sm shadow-brand-500/30 hover:from-brand-400 hover:to-brand-500 transition-colors"
          >
            <FiPlus size={16} />
            محادثة جديدة
          </button>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50" size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في المحادثات..."
              className="w-full rounded-lg bg-black/5 dark:bg-white/5 text-sm pr-9 pl-3 py-2
                outline-none focus:ring-2 focus:ring-brand-400/50 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-4">
          {groups.length === 0 && (
            <p className="text-center text-xs text-slate-400 mt-8">لا توجد محادثات مطابقة</p>
          )}
          {groups.map(([label, items]) => (
            <div key={label}>
              <p className="px-3 mb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                {label}
              </p>
              <div className="space-y-0.5">
                {items.map((session) => (
                  <SessionItem
                    key={session.session_id}
                    session={session}
                    isActive={session.session_id === activeSessionId}
                    onSelect={(id) => {
                      onSelectSession(id);
                      onClose();
                    }}
                    onRename={onRenameSession}
                    onDelete={onDeleteSession}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-black/5 dark:border-white/5 p-3 space-y-1">
          <button
            onClick={onToggleDarkMode}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
              text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
          >
            {isDarkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
            {isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
          </button>

          <div className="flex items-center justify-between px-3 py-2 rounded-lg">
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              مستخدم: {browserId?.slice(0, 8)}
            </span>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-md hover:bg-red-500/15 hover:text-red-500 text-slate-400"
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <FiLogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
