import React, { useState } from "react";
import "../auth.css";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../../services/authService";
import { useUser } from "../../../contexts/userContext";
import { useTab } from "../../../contexts/tabContext";

const RegisterPage = () => {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const { setUser } = useUser();
  const { setCurrentTab } = useTab();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    console.log("trying to register");

    try {
      const response = await registerUser(userData);
      setUser(response.data);
      console.log(response.data);
      navigate("/chat");
      setCurrentTab("chat-list");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="auth-heading">SIGN UP TO #CHATS</h2>
        <form onSubmit={(e) => handleRegister(e)} className="auth-form">
          <input
            type="name"
            value={userData.username}
            placeholder="Username..."
            onChange={(e) =>
              setUserData({ ...userData, username: e.target.value })
            }
            className="auth-field"
          />
          <input
            type="email"
            value={userData.email}
            placeholder="Email..."
            onChange={(e) =>
              setUserData({ ...userData, email: e.target.value })
            }
            className="auth-field"
          />
          <input
            type="password"
            value={userData.password}
            placeholder="Password..."
            onChange={(e) =>
              setUserData({ ...userData, password: e.target.value })
            }
            className="auth-field"
          />
          <button className="auth-button" type="submit">
            SIGN UP
          </button>
        </form>
        <p>
          Already Have An Account{" "}
          <a href="/" className="auth-link">
            SIGN IN
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
