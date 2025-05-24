import "./App.css";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import LoginPage from "./pages/auth/login/LoginPage";
import RegisterPage from "./pages/auth/register/RegisterPage";
import ChatPage from "./pages/chatpage/ChatPage";
import { UserProvider } from "./contexts/userContext";
import { ChatProvider } from "./contexts/chatContext";

function App() {
  return (
    <UserProvider>
      <ChatProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Routes>
        </Router>
      </ChatProvider>
    </UserProvider>
  );
}

export default App;
