import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../services/api";

function UserLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/user/login`, {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.removeItem("admin");
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/user");
    } catch (loginError) {
      setError(loginError.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">Customer access</p>
        <h1>User Login</h1>
        <p>Sign in to your user account</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="user-email">Email</label>
            <input
              id="user-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="user-password">Password</label>
            <input
              id="user-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <Link className="login-switch" to="/login">Admin login</Link>
      </section>
    </main>
  );
}

export default UserLogin;
