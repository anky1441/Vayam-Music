import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { loginUser } from "../api/musicApi";
import { setToken, getApiErrorMessage } from "../api/api";
import { EyeIcon } from "../components/AuthIcons";
import GoogleAuthButton from "../components/GoogleAuthButton";
import "./Login.css";

function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const justRegistered = location.state?.registered;

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoginError("");
        setLoading(true);

        try {
            const response = await loginUser({
                email: email.trim(),
                password,
            });

            const token = response.data?.token ?? response.data?.accessToken;

            if (!token) {
                setLoginError("Login failed. Please try again.");
                return;
            }

            setToken(token);
            navigate("/home", { replace: true });
        } catch (error) {
            setLoginError(
                getApiErrorMessage(
                    error,
                    "Login failed. Please check your email and password."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-split">
            <section className="auth-page">
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

                    {justRegistered && (
                        <p className="auth-success" role="status">
                            Account created. Please log in.
                        </p>
                    )}

                    <GoogleAuthButton text="signin_with" onError={setLoginError} />

                    <div className="auth-divider"><span>or</span></div>

                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label htmlFor="login-email">Email address</label>
                            <input
                                id="login-email"
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    setLoginError("");
                                }}
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="login-password">Password</label>
                            <div className="auth-password-wrap">
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => {
                                        setPassword(event.target.value);
                                        setLoginError("");
                                    }}
                                    required
                                />
                                <button
                                    type="button"
                                    className="auth-show-password"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    aria-pressed={showPassword}
                                >
                                    <EyeIcon visible={showPassword} />
                                </button>
                            </div>
                        </div>

                        {loginError && (
                            <p className="auth-error" role="alert">
                                {loginError}
                            </p>
                        )}

                        <button type="submit" className="auth-submit" disabled={loading}>
                            {loading ? "Logging in..." : <>Log in <span>→</span></>}
                        </button>
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
            </section>
            <aside className="auth-visual">
                <img className="auth-visual-img" src="/images/auth-singer.png" alt="" />

                <div className="auth-visual-card">
                    <div className="auth-visual-logo">
                        <span>♫</span>
                        <span>vayam<span className="auth-brand-dot">.</span> music</span>
                    </div>
                    <p className="auth-visual-text">
                        Every voice has a story. Find the sound that feels like yours.
                    </p>
                    <div className="auth-eq" aria-hidden="true">
                        <span></span><span></span><span></span><span></span><span></span>
                    </div>
                </div>
            </aside>

        </main>
    );
}

export default Login;