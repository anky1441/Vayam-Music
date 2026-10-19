
import { useState } from "react";
import { Link } from "react-router-dom";
import "./Register.css";
import { useNavigate } from "react-router-dom";



function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError("Your passwords do not match.");
      return;
    }

    setPasswordError("");
    navigate("/");
  };

  return (
    <main className="auth-page register-page">
      <div className="auth-glow auth-glow-one"></div>
      <div className="auth-glow auth-glow-two"></div>

      <Link to="/" className="auth-brand">
        <span className="auth-brand-icon">♫</span>
        <span>vayam<span className="auth-brand-dot">.</span></span>
      </Link>

      <div className="auth-card register-card">
        <div className="auth-symbol">♫</div>

        <span className="auth-eyebrow">JOIN THE EXPERIENCE</span>
        <h1>Create your <span>account.</span></h1>
        <p className="auth-subtitle">
          Your next favourite song is waiting to be discovered.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="register-password">Password</label>
            <div className="auth-password-wrap">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError("");
                }}
                required
              />
              <button
                type="button"
                className="auth-show-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <span className="register-hint">Use at least 8 characters.</span>
          </div>

          <div className="auth-field">
            <label htmlFor="register-confirm-password">
              Confirm password
            </label>
            <div className="auth-password-wrap">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Enter your password again"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setPasswordError("");
                }}
                required
              />
              <button
                type="button"
                className="auth-show-password"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>

            {passwordError && (
              <p className="register-error" role="alert">
                {passwordError}
              </p>
            )}
          </div>

          <label className="auth-checkbox register-terms">
            <input type="checkbox" required />
            <span>
              I agree to the <a href="#terms">Terms of Use</a> and{" "}
              <a href="#privacy">Privacy Policy</a>.
            </span>
          </label>

          <button type="submit" className="auth-submit">
            Create account <span>→</span>
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </div>

        <div className="auth-bottom-note">
          <span>♫</span> YOUR MOOD. YOUR MUSIC.
        </div>
      </div>

      <Link to="/" className="auth-back-home">
        ← Back to home
      </Link>
    </main>
  );
}

export default Register;
