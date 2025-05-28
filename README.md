# 💬 HashChats

**HashChats** is a full-featured real-time chat application built with React, Node.js, Express, PostgreSQL, Socket.IO, and WebRTC. It supports private messaging, group chats, media sharing, and real-time audio/video calling.

---

## ✨ Features

### 🚪 Authentication
- **Login/Register:** Secure login and registration interface.
- **Session Persistence:** Keeps user logged in across sessions.

### 🧭 Navigation Sidebar
- **Chats:** View recent private chats.
- **Groups:** Access all group conversations.
- **Favourites:** Quickly access bookmarked chats.
- **Profile:** Manage user details and view media history.
- **Logout:** Sign out and update last seen timestamp.

### 💬 Chat Interface
- **Responsive Design:** Two-pane layout on desktop, tab-based view on mobile.
- **Message Actions:** Send, receive, edit, delete, reply, pin, and copy messages.
- **Media Support:** Share images, videos, and PDFs.
- **Real-Time Sync:** All updates happen instantly via WebSockets.

### 🧑‍🤝‍🧑 1-on-1 and Group Chats
- **Chat Tiles:** Shows avatar, name, last seen/active status.
- **Group Creation:** Create groups with name and multiple participants.
- **Chat Creation:** Start a new chat using an email address.

### 📞 Calls & Chat Header
- **Audio/Video Call:** One-click calling using WebRTC.
- **Chat Details:** Click on header to view chat info.

### 🔎 Chat Details Panel
- **1-on-1 Chat Info:** Avatar, username, email, description, and media scroll pane.
- **Group Info:** Group image, name, member list with removal option, add member input, and media history.

### 🙍‍♂️ Profile Management
- **Avatar Update**
- **Username and Description Edit**
- **Media Scroll Pane:** Browse all shared media.

---

## 🛠️ Tech Stack

| Layer          | Technology         |
|----------------|--------------------|
| Frontend       | React              |
| Backend        | Node.js, Express   |
| Database       | PostgreSQL         |
| Real-time Sync | Socket.IO          |
| Calls          | WebRTC             |

---

## 🧪 Getting Started

### 🔧 Prerequisites
- Node.js & npm
- PostgreSQL

### 🚀 Installation

```bash
# Clone the repository
git clone https://github.com/Alvin0305/HashChats.git
cd HashChats

# Install server dependencies
cd backend
npm install

# Run backend
node server.js

# In a new terminal, set up frontend
cd ../frontend
npm install
npm start
