
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";




function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState("");
    const handleSubmit = (event) => {
        event.preventDefault();
        setLoginError(
            "Login is not connected yet. Please try again after authentication is set up."
        );
    };

    return (
        <main className="auth-page">
            <div className="auth-glow auth-glow-one"></div>
            <div className="auth-glow auth-glow-two"></div>

            <Link to="/" className="auth-brand">
                <span className="auth-brand-icon">♫</span>
                <span>vayam<span className="auth-brand-dot">.</span></span>
            </Link>

            <div className="auth-card">
                <div className="auth-symbol">♫</div>

                <span className="auth-eyebrow">WELCOME BACK</span>
                <h1>Good to see you <span>again.</span></h1>
                <p className="auth-subtitle">
                    Your music, your mood, your space.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <div className="auth-label-row">
                            <label htmlFor="login-password">Password</label>
                            <button
                                type="button"
                                className="auth-text-button"
                                onClick={() =>
                                    alert("Password recovery will be available after backend integration.")
                                }
                            >
                                Forgot password?
                            </button>
                        </div>

                        <div className="auth-password-wrap">
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                autoComplete="current-password"
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
                    </div>

                    <label className="auth-checkbox">
                        <input type="checkbox" />
                        <span>Remember me</span>
                    </label>

                    <button type="submit" className="auth-submit">
                        Log in <span>→</span>
                    </button>
                    {loginError && (
                        <p className="auth-error" role="alert">
                            {loginError}
                        </p>
                    )}
                </form>

                <div className="auth-switch">
                    Don't have an account? <Link to="/register">Create one</Link>
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

export default Login;
