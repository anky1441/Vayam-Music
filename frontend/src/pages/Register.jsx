import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/musicApi";
import { setToken, getApiErrorMessage } from "../api/api";
import { EyeIcon, GoogleIcon } from "../components/AuthIcons";
import "./Register.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [formError, setFormError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError("");

        const cleanName = name.trim();
        const cleanEmail = email.trim();

        if (!cleanName) {
            setFormError("Please enter your full name.");
            return;
        }

        if (!EMAIL_PATTERN.test(cleanEmail)) {
            setFormError("Please enter a valid email address, such as you@example.com.");
            return;
        }

        if (!PASSWORD_PATTERN.test(password)) {
            setFormError(
                "Password must be at least 8 characters and include at least one letter, one number, and one special character."
            );
            return;
        }

        if (password !== confirmPassword) {
            setFormError("Your passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const response = await registerUser({
                name: cleanName,
                email: cleanEmail,
                password,
            });

            const token = response.data?.token ?? response.data?.accessToken;

            if (token) {
                // Backend logs the user in automatically.
                setToken(token);
                navigate("/home", { replace: true });
            } else {
                // Account is created; ask the user to log in.
                navigate("/login", { replace: true, state: { registered: true } });
            }
        } catch (error) {
            setFormError(
                getApiErrorMessage(
                    error,
                    "Registration failed. Please check your details and try again."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    // Future: connect Google sign-up here, then call googleAuth() from musicApi.
    const handleGoogleSignup = () => {
        setFormError("Google sign-in is coming soon.");
    };

    const clearError = () => setFormError("");

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

                <button
                    type="button"
                    className="auth-google"
                    onClick={handleGoogleSignup}
                >
                    <GoogleIcon />
                    <span>Continue with Google</span>
                </button>

                <div className="auth-divider"><span>or</span></div>

                <form onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="register-name">Full name</label>
                        <input
                            id="register-name"
                            type="text"
                            placeholder="Enter your full name"
                            autoComplete="name"
                            value={name}
                            onChange={(e) => { setName(e.target.value); clearError(); }}
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
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); clearError(); }}
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
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); clearError(); }}
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
                        <span className="register-hint">
                            At least 8 characters, including a letter, a number, and a special character.
                        </span>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-confirm-password">Confirm password</label>
                        <div className="auth-password-wrap">
                            <input
                                id="register-confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Enter your password again"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                                required
                            />
                            <button
                                type="button"
                                className="auth-show-password"
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                aria-pressed={showConfirmPassword}
                            >
                                <EyeIcon visible={showConfirmPassword} />
                            </button>
                        </div>
                    </div>

                    {formError && (
                        <p className="register-error" role="alert">
                            {formError}
                        </p>
                    )}

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading ? "Creating account..." : <>Create account <span>→</span></>}
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