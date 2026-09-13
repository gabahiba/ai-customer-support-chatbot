import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export const getOrCreateBrowserId = () => {
  let browserId = localStorage.getItem("chat-browser-id");
  if (!browserId) {
    browserId = crypto.randomUUID();
    localStorage.setItem("chat-browser-id", browserId);
  }
  return browserId;
};

export const clearBrowserId = () => {
  localStorage.removeItem("chat-browser-id");
};

export const fetchSessions = async (browserId) => {
  const { data } = await api.get("/sessions/", { params: { browser_id: browserId } });
  return data;
};

export const createSession = async (sessionId, title = 'محادثة جديدة', browserId) => {
  try {
    const url = browserId ? `/sessions/?browser_id=${browserId}` : '/sessions/';
    const response = await apiClient.post(url, {
      session_id: sessionId,  // ✅ تأكدي من هذا السطر
      title: title,
    });
    return response.data;
  } catch (error) {
    console.error('خطأ في إنشاء الجلسة:', error);
    throw new Error('فشل في إنشاء محادثة جديدة.');
  }
};

export const renameSession = async (sessionId, title) => {
  const { data } = await api.put(`/sessions/${sessionId}`, { title });
  return data;
};

export const deleteSession = async (sessionId) => {
  const { data } = await api.delete(`/sessions/${sessionId}`);
  return data;
};

export const fetchMessages = async (sessionId) => {
  const { data } = await api.get(`/sessions/${sessionId}/messages`);
  return data;
};

export const sendMessage = async (sessionId, message, browserId) => {
  try {
    const response = await apiClient.post('/chat/', {
      session_id: sessionId,
      message: message,
      browser_id: browserId,
    });
    return response.data;  // ✅ سيرجع { session_id, response }
  } catch (error) {
    console.error('خطأ في الاتصال بالخادم:', error);
    throw new Error('عذراً، حدث خلل في الاتصال بالخادم.');
  }
};

export const uploadPdf = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/upload/pdf", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
  return data;
};

export default api;
