# 🛒 Kirana Expiry Shield

A full-stack, mobile-responsive inventory management platform designed to help small retail shops (Kiranas) track perishable stock, automate expiry date entry, and mitigate financial liquidation losses.

## 🚀 The Problem & Solution
Free-tier cloud servers (like Render's 512MB RAM limit) crash when running heavy AI/OCR image processing locally. 
**The Solution:** Engineered a lightweight microservice architecture that offloads image processing to an external Cloud OCR API, allowing the FastAPI backend to seamlessly extract manufacturing and expiry dates from packaging photos without exceeding memory limits.

## 💻 Tech Stack
* **Frontend:** React, Bootstrap 5, HTML5 QR Scanner
* **Backend:** FastAPI, Python
* **Database:** Supabase (PostgreSQL)
* **AI / RAG:** LangChain, Groq API (Llama 3), HuggingFace Embeddings
* **External APIs:** Cloud OCR for date extraction, WhatsApp Click-to-Chat

## ✨ Key Features
* **Automated Data Entry:** Scan barcodes and use a phone camera to auto-extract expiry dates from packaging via OCR.
* **Smart Liquidation Dashboard:** Automatically calculates financial risk and generates one-click WhatsApp promotional messages (e.g., 20% or 50% discounts) for stock expiring within 30 days.
* **Kirana AI Assistant:** A built-in RAG chatbot that reads the live Supabase inventory database to answer natural language queries (e.g., "Which items expire in December?").
* **Mobile-First Design:** Fully responsive UI with adaptive Light/Dark mode tailored for busy shop owners using mobile devices in the aisles.

## 🛠️ Local Setup
1. Clone the repository.
2. Install frontend dependencies: `npm install`
3. Run the frontend development server: `npm run dev`
4. Set up the Python FastAPI backend and start the server: `uvicorn main:app --reload`