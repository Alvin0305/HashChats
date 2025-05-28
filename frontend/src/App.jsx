import "./App.css";
import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import LoginPage from "./pages/auth/login/LoginPage";
import RegisterPage from "./pages/auth/register/RegisterPage";
import ChatPage from "./pages/chatpage/ChatPage";
import { UserProvider } from "./contexts/userContext";
import { ChatProvider } from "./contexts/chatContext";
import { ChatListProvider } from "./contexts/chatlistContext";
import { ToastContainer } from "react-toastify";
import { TabProvider } from "./contexts/tabContext";

function App() {
  return (
    <UserProvider>
      <ChatProvider>
        <ChatListProvider>
          <TabProvider>
            <Router>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/chat" element={<ChatPage />} />
              </Routes>
            </Router>
          </TabProvider>
        </ChatListProvider>
      </ChatProvider>
    </UserProvider>
  );
}

export default App;
