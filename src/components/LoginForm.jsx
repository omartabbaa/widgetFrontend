// LoginForm.jsx
import React from "react";
import "./LoginForm.css";
const LoginForm = ({ 
  loginEmail, 
  setLoginEmail, 
  loginPassword, 
  setLoginPassword, 
  handleLogin, 
  authError, 
  switchToSignup 
}) => (
  <div className="login-form">
    <h3>Login</h3>
    {authError && <p style={{ color: "red" }}>{authError}</p>}
    <input
      type="email"
      placeholder="Email"
      value={loginEmail}
      onChange={(e) => setLoginEmail(e.target.value)}
    />
    <input
      type="password"
      placeholder="Password"
      value={loginPassword}
      onChange={(e) => setLoginPassword(e.target.value)}
    />
    <button onClick={handleLogin}>Login</button>
    <p>
      Don't have an account?{" "}
      <span onClick={switchToSignup} className="link-button">
        Sign up
      </span>
    </p>
  </div>
);

export default LoginForm;
