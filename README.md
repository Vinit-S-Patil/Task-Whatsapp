# 📱 WhatsApp Web Clone - RapidQuest Task

A real-time chat application built using **MERN stack**, **Webhooks**, and **WebSockets**.  
Supports media attachments, emoji packs, contact search, and chat search — fully responsive.

---

## ⚠️ Important Note 

- **Performance:** Since this project is hosted on **free tiers** (Vercel for frontend + Render for backend),  
  it may load slower and certain actions like uploading attachments or fetching large media may take extra time.  
- **Attachments:** If uploading attachments (documents, photos, videos, audio) feels slow,  
  **check the browser console** to see the live upload progress.  
  - To open the console:  
    **Windows/Linux:** Press `Ctrl + Shift + I` → Go to **Console** tab  
    **Mac:** Press `Cmd + Option + I` → Go to **Console** tab  
- **Emoji Pack & Document Fetch:** These can be slightly slow due to free hosting limits.  
- **On Localhost:** The app will run **much faster** and all actions (uploads, fetches, real-time updates) will be instant.  
- **CPU Usage:** Around 0.1% on hosting — lightweight and optimized.  
- **.env:**  
  > The `.env` file is a simple text file used to store project configuration (like API URLs, keys, etc.).  
  > You don’t need to change these values unless you are running the project locally.  
  > We’ve provided `.env` **examples** below so you can understand what values are required.  
  > An actual `.env` file will be added in the project for testing.

---

## 🌐 Live Demo

**Frontend:** [https://rapidquest-whatsapp-vinit.vercel.app](https://rapidquest-whatsapp-vinit.vercel.app)  
**Backend API:** [https://task-whatsapp.onrender.com](https://task-whatsapp.onrender.com)  

---

## 🛠 Tech Stack

- **Frontend:** React.js (Vite) + Tailwind CSS  
- **Backend:** Node.js + Express  
- **Database:** MongoDB Atlas  
- **Real-Time Communication:** Socket.IO (WebSockets)  
- **File Storage:** Cloudinary  
- **Integration:** WhatsApp Webhooks  
- **Hosting:** Vercel (Frontend) & Render (Backend)  

---

## ✨ Features

- 🔍 **Search Contacts**
- 📎 **Attach Files**:
  - Documents
  - Photos & Videos
  - Audio
  - Contact cards
- 🔍 **Search Chat**
- 😀 **Emoji Pack**
- 📱 **Fully Responsive UI**
- 📡 **Real-time Messaging** with WebSockets

---

## 🚀 Running Locally

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
