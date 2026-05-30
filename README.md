# 🌍 Tourist Safety Web Application

A comprehensive, state-of-the-art web application designed to ensure the safety and security of tourists traveling across India, with a specific focus on Himachal Pradesh. The application features real-time risk zone mapping, AI-powered travel assistance, automated SOS alerts, blockchain-based secure logging, and incident reporting.

---

## 🔗 Live Deployments

*   **Frontend (Vercel):** [https://tourist-safty.vercel.app](https://tourist-safty.vercel.app)
*   **Backend (Render):** [https://tourist-safty.onrender.com](https://tourist-safty.onrender.com)

---

## ✨ Key Features

1.  **🗺️ Interactive Map & Location Services**
    *   Integrates **Google Maps API** to view tourist spots, nearby hospitals, and police stations.
    *   Visualizes high-risk zones using dynamic red overlays (hover to see danger descriptions).
2.  **🚨 SOS Emergency Alerts**
    *   One-click **Emergency SOS** trigger.
    *   Sends real-time email notifications (SMTP) to pre-configured emergency contacts containing the user's location.
3.  **🤖 Smart AI Assistant**
    *   Conversational assistant tailored to Indian travel safety, food, hotels, transport, and places.
    *   **Robust Fallback Architecture:** Automatically cycles through multiple free AI models (Gemini, Llama, DeepSeek) on OpenRouter to handle API rate limits and ensure high availability.
    *   Pre-configured local map-action keywords (e.g. typing "hospital" or "police") to guide users on the map directly.
4.  **🔗 On-Chain Security Audits (Blockchain)**
    *   Logs incident data onto the **Polygon Amoy Testnet** blockchain using Smart Contracts (`logContract.sol`) for immutable, decentralized storage of emergency events.
5.  **✍️ Incident Reporting**
    *   Allows tourists to report real-time safety issues or crimes in their area, automatically updating the risk zone maps for other users.
6.  **👥 User & Admin Portals**
    *   Secure user authentication using JWT and bcrypt.
    *   Admin dashboard to manage reported incidents, review broadcast updates, and view system statistics.

---

## 🛠️ Tech Stack

*   **Frontend:** React (Vite), Tailwind CSS, Framer Motion, React Router DOM, React Icons
*   **Backend:** Node.js, Express, MongoDB (Mongoose), Nodemailer (SMTP), Ethers.js
*   **AI Engine:** OpenRouter API (Gemini-4, DeepSeek, Llama-3, etc.)
*   **Blockchain:** Solidity, Hardhat, Polygon Amoy Testnet (Ethers v6)

---

## 📁 Directory Structure

```text
tourist-safety-app/
├── client/          # React + Vite frontend application
├── server/          # Node.js + Express backend API
├── blockchain/      # Smart contracts and Hardhat deployment scripts
├── ai-module/       # Machine learning risk classification scripts
└── README.md        # Project documentation
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB Atlas (or local instance)
*   Google Maps API Key
*   OpenRouter API Key

### 1. Backend Setup (`server/`)
1.  Navigate into the server folder:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `server/` directory and configure the variables:
    ```env
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    OPENROUTER_API_KEY=your_openrouter_api_key
    CLIENT_ORIGIN=http://localhost:5173
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your_email@gmail.com
    SMTP_PASS=your_email_app_password
    PRIVATE_KEY=your_wallet_private_key
    AMOY_RPC_URL=https://rpc-amoy.polygon.technology
    CONTRACT_ADDRESS=your_deployed_contract_address
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

### 2. Frontend Setup (`client/`)
1.  Navigate into the client folder:
    ```bash
    cd ../client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `client/` directory:
    ```env
    VITE_GOOGLE_MAP_KEY=your_google_maps_api_key
    VITE_API_URL=http://localhost:5000/api
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```

### 3. Smart Contract Deployment (`blockchain/`)
To deploy your own instance of the logging smart contract:
1.  Navigate into the blockchain folder:
    ```bash
    cd ../blockchain
    ```
2.  Configure your private keys and RPC URLs in `hardhat.config.js`.
3.  Run the deployment script:
    ```bash
    npx hardhat run scripts/deploy.js --network amoy
    ```

---

## 🛡️ API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register new tourist/admin |
| **POST** | `/api/auth/login` | Login user and retrieve JWT |
| **POST** | `/api/ai/chat` | Chat with the fallback AI safety assistant |
| **POST** | `/api/incidents` | Report a safety incident |
| **GET** | `/api/location/risk-zones` | Retrieve all current unsafe zones |
| **POST** | `/api/alert/sos` | Trigger emergency alert to contacts |
| **POST** | `/api/blockchain/log` | Write security alert log to Polygon Amoy |
