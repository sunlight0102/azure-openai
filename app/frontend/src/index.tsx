import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import { initializeIcons } from "@fluentui/react";

import "./index.css";

import Layout from "./pages/layout/Layout";
import NoPage from "./pages/NoPage";
import ChatGpt from "./pages/chatgpt/ChatGpt";
import Chat from './pages/chat/Chat';
import OneShot from "./pages/oneshot/OneShot";
import SqlAgent from "./pages/sqlagent/SqlAgent";
import Upload from "./pages/upload/Upload";
import Help from "./pages/help/Help";
import Edgar from "./pages/edgar/Edgar";
import BotChat from "./pages/botchat/BotChat";

initializeIcons();

export default function App() {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route path="upload" element={<Upload />} />
                    {/* <Route path="chat" element={<Chat />} /> */}
                    <Route path="qa" element={<OneShot />} />
                    <Route path="sql" element={<SqlAgent />} />
                    {/* <Route path="botchat" element={<BotChat />} /> */}
                    <Route path="edgar" element={<Edgar />} />
                    <Route index element={<ChatGpt />} />
                    <Route path="help" index element={<Help />} />
                    <Route path="*" element={<NoPage />} />
                </Route>
            </Routes>
        </HashRouter>
    );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
