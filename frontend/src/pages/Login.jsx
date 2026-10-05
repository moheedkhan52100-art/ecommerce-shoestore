import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("signin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const resetAuthForm = () => {
    setName("");
    setPassword("");
    setConfirmPassword("");
    setOtp("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "forgot-password") {
        const response = await axios.post(`${API_BASE_URL}/user/forgot-password`, { email });
        setMode("reset-password");
        setMessage(response.data.message || "If a verified account exists for that email, a reset code has been sent.");
        return;
      }

      if (mode === "reset-password") {
        if (password !== confirmPassword) {
          setError("Passwords do not match.");
          return;
        }
        const response = await axios.post(`${API_BASE_URL}/user/reset-password`, {
          email,
          code: otp,
          password,
          confirmPassword,
        });
        setMode("signin");
        resetAuthForm();
        setMessage(response.data.message || "Password reset successfully. You can now sign in.");
        return;
      }

      if (mode === "verify") {
        const response = await axios.post(`${API_BASE_URL}/user/verify-otp`, { email, otp });
        setMode("signin");
        resetAuthForm();
        setMessage(response.data.message || "Email verified successfully! Please sign in.");
        return;
      }

      if (mode === "signup") {
        const response = await axios.post(`${API_BASE_URL}/user/register`, { name, email, password });
        setMode("verify");
        setMessage(response.data.message || "Verification code sent to your email.");
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });

      localStorage.setItem("token", response.data.token);
      if (response.data.role === "admin") {
        localStorage.setItem("admin", JSON.stringify(response.data.admin));
        localStorage.removeItem("user");
        navigate("/admin");
      } else {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.removeItem("admin");
        navigate(location.state?.from?.pathname || "/user", { replace: true });
      }
    } catch (loginError) {
      if (loginError.response?.data?.isUnverified) {
        setMode("verify");
        setError(loginError.response?.data?.message || "Please verify your email before logging in.");
      } else if (mode === "forgot-password" && !loginError.response) {
        setError("Could not reach the password reset service. Please try again after the backend is available.");
      } else if (mode === "forgot-password" && loginError.response.status === 404) {
        setError("Password reset is not available on the running server yet. Restart the backend and try again.");
      } else {
        setError(loginError.response?.data?.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!email) {
      setError("Please enter your email first.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/user/resend-otp`, { email });
      setMessage(response.data.message || "A new verification code has been sent.");
    } catch (resendError) {
      setError(resendError.response?.data?.message || "Unable to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleModeToggle = () => {
    setError("");
    setMessage("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setMode((currentMode) => {
      if (currentMode === "signup") return "signin";
      if (currentMode !== "signin") return "signin";
      return "signup";
    });
  };

  const startPasswordReset = () => {
    setError("");
    setMessage("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address first.");
      return;
    }
    setMode("forgot-password");
  };

  const buttonLabel =
    loading ? "Please wait..." :
      mode === "signup" ? "Create account" :
        mode === "verify" ? "Verify OTP" :
          mode === "forgot-password" ? "Send reset code" :
            mode === "reset-password" ? "Reset password" : "Sign in";

  return (
    <main className="login-page">
      <video className="login-background-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
        <source src="/videos/signin-background.mp4" type="video/mp4" />
      </video>
      <section className="login-card">
        <p className="eyebrow">Khan account</p>
        <h1>
          {mode === "signup" ? "Create account" :
            mode === "verify" ? "Verify your email" :
              mode === "forgot-password" ? "Forgot password" :
                mode === "reset-password" ? "Reset password" : "Sign in"}
        </h1>
        <p>
          {mode === "verify"
            ? "Enter the 6-digit code sent to your email to activate your account."
            : mode === "forgot-password"
              ? "We’ll email you a code to reset your password."
              : mode === "reset-password"
                ? "Enter the code from your email and choose a new password."
                : "Sign in as a user or admin with one account form"}
        </p>

        <form onSubmit={handleLogin}>
          {mode === "signup" && (
            <div className="form-group">
              <label htmlFor="login-name">Name</label>
              <input id="login-name" type="text" placeholder="Your name" value={name} onChange={(event) => setName(event.target.value)} required />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {(mode === "signin" || mode === "signup" || mode === "reset-password") && (
            <div className="form-group">
              <label htmlFor="login-password">{mode === "reset-password" ? "New password" : "Password"}</label>
              <div className="password-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {mode === "reset-password" && (
            <div className="form-group">
              <label htmlFor="login-confirm-password">Confirm new password</label>
              <input
                id="login-confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                required
              />
            </div>
          )}

          {(mode === "verify" || mode === "reset-password") && (
            <div className="form-group">
              <label htmlFor="login-otp">{mode === "reset-password" ? "Password reset code" : "OTP code"}</label>
              <input
                id="login-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
          )}

          {error && <div className="login-error" role="alert">{error}</div>}
          {message && <div className="login-success" role="status">{message}</div>}

          <button className="login-submit" type="submit" disabled={loading}>
            {buttonLabel}
          </button>
        </form>

        {mode === "verify" && (
          <button className="login-create-link" type="button" onClick={resendOtp} disabled={loading}>
            Resend OTP
          </button>
        )}

        {mode === "signin" && email.trim() && (
          <button className="login-create-link" type="button" onClick={startPasswordReset} disabled={loading}>
            Forgot password?
          </button>
        )}

        <button className="login-create-link" type="button" onClick={handleModeToggle}>
          {mode === "signup" ? "Already have an account? Sign in" :
            ["verify", "forgot-password", "reset-password"].includes(mode) ? "Back to sign in" :
              "New here? Create a user account"}
        </button>

        <Link className="login-switch" to="/">Return to Khan storefront</Link>
      </section>
    </main>
  );
}

export default Login;
