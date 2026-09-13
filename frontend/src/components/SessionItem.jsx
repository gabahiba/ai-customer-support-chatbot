import { useState, useRef, useEffect } from "react";
import { FiMessageSquare, FiEdit2, FiTrash2, FiCheck, FiX } from "react-icons/fi";

export default function SessionItem({ session, isActive, onSelect, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(session.title || "محادثة جديدة");
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== session.title) {
      onRename(session.session_id, trimmed);
    } else {
      setTitle(session.title || "محادثة جديدة");
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(session.title || "محادثة جديدة");
    setIsEditing(false);
  };

  return (
    <div
      onClick={() => !isEditing && onSelect(session.session_id)}
      className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
        isActive
          ? "bg-brand-500/15 text-brand-700 dark:text-brand-300"
          : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
      }`}
    >
      <FiMessageSquare className="shrink-0 opacity-70" size={16} />

      {isEditing ? (
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") handleCancel();
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-transparent border-b border-brand-400 text-sm outline-none py-0.5"
        />
      ) : (
        <span className="flex-1 min-w-0 truncate text-sm">{session.title || "محادثة جديدة"}</span>
      )}

      <div
        className={`flex items-center gap-1 shrink-0 ${
          isEditing ? "" : "opacity-0 group-hover:opacity-100"
        } transition-opacity`}
      >
        {isEditing ? (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="p-1 rounded-md hover:bg-brand-500/20 text-brand-600 dark:text-brand-300"
              aria-label="حفظ"
            >
              <FiCheck size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10"
              aria-label="إلغاء"
            >
              <FiX size={14} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10"
              aria-label="إعادة تسمية"
            >
              <FiEdit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.session_id);
              }}
              className="p-1 rounded-md hover:bg-red-500/15 hover:text-red-500"
              aria-label="حذف"
            >
              <FiTrash2 size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
