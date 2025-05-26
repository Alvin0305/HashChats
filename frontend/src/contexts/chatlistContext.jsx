import { createContext, useContext, useEffect, useState } from "react";

export const ChatListContext = createContext(null);

export const ChatListProvider = ({ children }) => {
  const [chatlist, setChatList] = useState(() => {
    const storedChatList = sessionStorage.getItem("chatlist");
    return storedChatList ? JSON.parse(storedChatList) : null;
  });

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "chatlist") {
        const newChatList = event.newValue ? JSON.parse(event.newValue) : null;
        setChatList(newChatList);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (chatlist) {
      sessionStorage.setItem("chatlist", JSON.stringify(chatlist));
    } else {
      sessionStorage.removeItem("chatlist");
    }
  }, [chatlist]);

  return (
    <ChatListContext.Provider value={{ chatlist, setChatList }}>
      {children}
    </ChatListContext.Provider>
  );
};

export const useChatList = () => useContext(ChatListContext);
