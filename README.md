# 🏡 RedNest – Full Stack Airbnb Clone with AI Travel Agent

RedNest is a full-stack web application inspired by Airbnb.  
It allows travelers to book properties, owners to manage listings, and integrates an **AI travel assistant** powered by **FastAPI + LangChain + Anthropic Claude** for itinerary planning and chat assistance.

---

## 🚀 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Frontend** | React (Vite), Axios |
| **Backend API** | Node.js (Express) |
| **Database** | MySQL |
| **AI Agent** | FastAPI (Python), LangChain, Anthropic Claude |
| **Auth** | Express-Session (Cookie-based) |


---

## 🌟 Key Features

- 🧍 **Traveler Dashboard**
  - Browse and search properties  
  - Book stays and manage reservations  
  - Favorite / Unfavorite properties  

- 🏠 **Owner Dashboard**
  - Add, edit, and manage property listings  
  - View and accept traveler bookings  

- 🤖 **AI Travel Agent**
  - Chat for trip ideas, itineraries, and packing suggestions  
  - Uses LangChain + Anthropic Claude via FastAPI microservice  

- 🔐 **Authentication**
  - Session-based login/signup for owners and travelers  

---

## 🧩 System Architecture
<img width="1134" height="502" alt="image" src="https://github.com/user-attachments/assets/cc3c9d53-a4bb-4cbe-a0b3-cf72fc0bb6eb" />

# 🏡 StayBnB – Local Development Setup Guide

This comprehensive guide will help you set up and run the **RedNest** application locally, including the MySQL database, Node.js backend, React frontend, and FastAPI AI agent.

---

## ⚙️ Prerequisites

Ensure you have the following software installed on your system. Using the specified versions will help avoid compatibility issues.

* **Node.js** v18 or higher 🟢
* **Python** 3.10 or higher 🐍
* **MySQL** 8.x 🐬


---

## 🗄️ Step 1: MySQL Database Setup

1.  Open your **MySQL terminal** or a GUI client (e.g., TablePlus, MySQL Workbench).
   
2.  Run the DB_setup script to setup the mysql.
    
3.  **Important:** Note down your MySQL username and password—you will use them in the backend `.env` file.

---

## 🧠 Step 2: Backend Setup (Node.js + Express – Port 8000)

The backend handles the core API logic.

1.  Navigate into the `backend` directory and install dependencies:

    ```bash
    cd backend
    npm install
    ```

2.  Create a file named **`.env`** inside the `backend/` folder and populate it with your database credentials and configuration:

    ```env
    PORT=8000
    SESSION_SECRET=dev-secret
    DB_HOST=localhost
    DB_USER=root # Replace with your MySQL username
    DB_PASSWORD=yourpassword # Replace with your MySQL password
    DB_NAME=RedNest
    CORS_ORIGINS=http://localhost:5173
    ```

3.  Start the backend server:

    ```bash
    npm run dev
    ```

    ✅ The **backend API** will be running at: **`http://localhost:8000`**

---

## 💻 Step 3: Frontend Setup (React + Vite – Port 5173)

The frontend provides the user interface for StayBnB.

1.  Navigate back up and into the `frontend` directory, then install dependencies:

    ```bash
    cd ../frontend
    npm install
    ```

2.  Create a file named **`.env`** inside the `frontend/` folder to specify the API location:

    ```env
    VITE_API_URL=http://localhost:8000
    ```

3.  Start the frontend application:

    ```bash
    npm run dev
    ```

    ✅ The **frontend** will be running at: **`http://localhost:5173`**

---

## 🤖 Step 4: FastAPI Agent Setup (AI Travel Assistant – Port 9000)

This agent powers the AI-driven travel assistant features.

1.  Navigate back up and into the `agent` directory, then install the Python dependencies:

    ```bash
    cd ../agent
    pip install -r requirements.txt
    ```

2.  Create a file named **`.env`** inside the `agent/` folder and include your required API keys:

    ```env
    ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx # Your Anthropic API Key
    OPENWEATHER_API_KEY=xxxxxxxxxxxxxxxxxxxx # Your OpenWeather API Key
    ```

3.  Start the FastAPI agent server:

    ```bash
    uvicorn app:app --host 0.0.0.0 --port 9000 --reload
    ```

    ✅ The **FastAPI AI Agent** will be running at: **`http://localhost:9000`**

---

## 🧪 Step 5: Quick API Tests (cURL)

You can use these cURL commands to quickly test the running backend and agent services.

| Action | Command |
| :--- | :--- |
| **Traveler Login** (Saves cookie for subsequent requests) | `curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -c cookie.txt -d '{"email":"traveler1@example.com","password":"traveler123"}'` |
| **Check Authenticated Session** | `curl http://localhost:8000/api/auth/me -b cookie.txt` |
| **List Favorites** | `curl http://localhost:8000/api/favorites/mine -b cookie.txt` |
| **AI Agent Chat** | `curl -X POST http://localhost:9000/ai/chat -H "Content-Type: application/json" -d '{"question":"Suggest a 3-day Miami itinerary"}'` |

---

## 🔌 Port Summary

| Service | Port | URL |
| :--- | :--- | :--- |
| **Frontend (React)** | 5173 | `http://localhost:5173` |
| **Backend (Node.js)** | 8000 | `http://localhost:8000` |
| **FastAPI Agent** | 9000 | `http://localhost:9000` |


---

## 📁 Folder Structure

<img width="621" height="531" alt="image" src="https://github.com/user-attachments/assets/6434285c-64f8-44c2-b045-48b483843618" />

## 🏁 Conclusion

The **RedNest** project successfully integrates modern web technologies to deliver a full-stack, intelligent vacation rental platform inspired by Airbnb.  

It demonstrates the seamless interaction between:
- **React (Vite)** for an interactive and responsive user interface,  
- **Node.js + Express** for secure and scalable REST APIs handling bookings, authentication, and user management,  
- **MySQL** for structured, relational data storage, and  
- **FastAPI (Python)** with **LangChain + Anthropic AI** to power intelligent trip planning and conversational assistance.  

By combining these layers, StayBnB provides:
- Role-based dashboards for **owners** and **travelers**,  
- End-to-end workflows like **listing, booking, favorites, and approval**,  
- And an AI-driven assistant that enhances trip discovery and planning.

This project showcases how **AI + full-stack engineering** can come together to create smart, user-friendly web applications ready for real-world scalability.

