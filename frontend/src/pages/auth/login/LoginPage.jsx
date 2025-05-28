import React, { useState } from "react";
import "../auth.css";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../../services/authService";
import { useUser } from "../../../contexts/userContext";
import { useTab } from "../../../contexts/tabContext";
import { toast } from "react-toastify";

const LoginPage = () => {
  const [userData, setUserData] = useState({ email: "", password: "" });
  const { setUser } = useUser();
  const navigate = useNavigate();
  const { setCurrentTab } = useTab();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("trying to loggin");

    try {
      const response = await loginUser(userData);
      setUser(response.data);
      console.log(response.data);
      navigate("/chat");
      setCurrentTab("chat-list");
    } catch (err) {
      if (err.response && err.response.status === 404) {
        toast.error("Invalid Email");
      } else if (err.response && err.response.status === 401) {
        toast.error("Invalid Password");
      } else {
        toast.error("Unhandled Error occured");
      }
      console.error(err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2 className="auth-heading">SIGN IN TO #CHATS</h2>
        <form onSubmit={(e) => handleLogin(e)} className="auth-form">
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
            SIGN IN
          </button>
        </form>
        <p>
          Don't Have An Account{" "}
          <a href="/register" className="auth-link">
            SIGN UP
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
