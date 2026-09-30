import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("signin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const resetAuthForm = () => {
    setName("");
    setPassword("");
    setOtp("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "verify") {
        const response = await axios.post("http://localhost:5000/api/user/verify-otp", { email, otp });
        setMode("signin");
        resetAuthForm();
        setMessage(response.data.message || "Email verified successfully! Please sign in.");
        return;
      }

      if (mode === "signup") {
        const response = await axios.post("http://localhost:5000/api/user/register", { name, email, password });
        setMode("verify");
        setMessage(response.data.message || "Verification code sent to your email.");
        return;
      }

      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });

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
      const response = await axios.post("http://localhost:5000/api/user/resend-otp", { email });
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
    setMode((currentMode) => {
      if (currentMode === "signup") return "signin";
      if (currentMode === "verify") return "signin";
      return "signup";
    });
  };

  const buttonLabel =
    loading ? "Please wait..." : mode === "signup" ? "Create account" : mode === "verify" ? "Verify OTP" : "Sign in";

  return (
    <main className="login-page">
      <video className="login-background-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
        <source src="/videos/signin-background.mp4" type="video/mp4" />
      </video>
      <section className="login-card">
        <p className="eyebrow">Khan account</p>
        <h1>{mode === "signup" ? "Create account" : mode === "verify" ? "Verify your email" : "Sign in"}</h1>
        <p>
          {mode === "verify"
            ? "Enter the 6-digit code sent to your email to activate your account."
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

          {mode !== "verify" && (
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
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

          {mode === "verify" && (
            <div className="form-group">
              <label htmlFor="login-otp">OTP code</label>
              <input
                id="login-otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
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

        <button className="login-create-link" type="button" onClick={handleModeToggle}>
          {mode === "signup" ? "Already have an account? Sign in" : mode === "verify" ? "Back to sign in" : "New here? Create a user account"}
        </button>

        <Link className="login-switch" to="/">Return to Khan storefront</Link>
      </section>
    </main>
  );
}

export default Login;
