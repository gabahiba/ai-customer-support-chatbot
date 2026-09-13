# AI Customer Support Chatbot 🤖

بوت دعم فني ذكي يعتمد على تقنية RAG (Retrieval-Augmented Generation) للإجابة **حصراً** من محتوى ملفات PDF التي يرفعها المستخدم، مبني وفق Clean Architecture.

## البنية

```
project/
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── core/            # الإعدادات وقاعدة البيانات
│   │   ├── models/          # نماذج SQLAlchemy
│   │   ├── schemas/         # نماذج Pydantic
│   │   ├── routers/         # نقاط النهاية (chat, upload, sessions)
│   │   └── services/        # منطق العمل (RAG, Gemini, PDF, Sessions)
│   ├── main.py
│   └── requirements.txt
└── frontend/                 # React + Vite + Tailwind
    └── src/
        ├── components/       # Sidebar, SessionItem, ChatWindow, MessageBubble
        ├── services/         # api.js
        └── utils/            # dateUtils.js
```

## التشغيل محلياً

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # على ويندوز: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # ثم ضع GEMINI_API_KEY الخاص بك
uvicorn main:app --reload
```

الخادم سيعمل على `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env       # يشير افتراضياً إلى http://localhost:8000
npm run dev
```

الواجهة ستعمل على `http://localhost:5173`.

## النشر (Deployment)

### Backend على Render

1. أنشئ خدمة "Web Service" جديدة واربطها بمستودع GitHub.
2. **Root Directory**: `backend`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. أضف متغير البيئة `GEMINI_API_KEY` في تبويب Environment.

> ملف `render.yaml` في جذر المشروع يوفّر هذا الإعداد تلقائياً إن استخدمت "Blueprints" في Render.

### Frontend على Vercel

1. استورد المستودع في Vercel.
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite
4. أضف متغير البيئة `VITE_API_URL` بقيمة رابط خدمة Render.

## ملاحظات تقنية

- تُستخدم `fastembed` مع نموذج `BAAI/bge-small-en-v1.5` لتوليد التضمينات، وتُخزَّن مباشرة في ملف SQLite منفصل (`rag_data.db`) كـ BLOB، دون الاعتماد على ChromaDB لتفادي استهلاك الذاكرة على خطط الاستضافة المجانية.
- لا يوجد نظام تسجيل دخول: يُعرَّف كل متصفح عبر `browser_id` فريد يُخزَّن في `localStorage` ويُستخدم لعزل المحادثات.
- عند بدء تشغيل الخادم، يُحذف ملف `chatbot.db` تلقائياً لضمان إنشاء الجداول بالهيكل الصحيح.
- البوت مقيّد بنص تعليمات صارم (`system_instruction`) يمنعه من الإجابة خارج نطاق المستندات المرفوعة.
