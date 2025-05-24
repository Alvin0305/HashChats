import { createContext, useContext, useEffect, useState } from "react";

export const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [chat, setChat] = useState(() => {
    const storedChat = sessionStorage.getItem("chat");
    return storedChat ? JSON.parse(storedChat) : null;
  });

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "chat") {
        const newChat = event.newValue ? JSON.parse(event.newValue) : null;
        setChat(newChat);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (chat) {
      sessionStorage.setItem("chat", JSON.stringify(chat));
    } else {
      sessionStorage.removeItem("chat");
    }
  }, [chat]);

  return (
    <ChatContext.Provider value={{ chat, setChat }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
