// SignupForm.jsx
import React from "react";
import "./SignupForm.css";

const SignupForm = ({ 
  signupDetails, 
  setSignupDetails, 
  handleSignup, 
  authError, 
  switchToLogin 
}) => (
  <div className="signup-form">
    <h3>Sign Up</h3>
    {authError && <p style={{ color: "red" }}>{authError}</p>}

    <input
      type="text"
      placeholder="Name"
      value={signupDetails.name}
      onChange={(e) =>
        setSignupDetails({ ...signupDetails, name: e.target.value })
      }
    />
    <input
      type="email"
      placeholder="Email"
      value={signupDetails.email}
      onChange={(e) =>
        setSignupDetails({ ...signupDetails, email: e.target.value })
      }
    />
    <input
      type="password"
      placeholder="Password"
      value={signupDetails.password}
      onChange={(e) =>
        setSignupDetails({ ...signupDetails, password: e.target.value })
      }
    />
    <button onClick={handleSignup}>Sign Up</button>
    <p>
      Already have an account?{" "}
      <span onClick={switchToLogin} className="link-button">
        Log in
      </span>
    </p>
  </div>
);

export default SignupForm;
