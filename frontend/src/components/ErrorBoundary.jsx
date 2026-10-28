import React from "react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Vayam UI ErrorBoundary caught error:", error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        minHeight: "100vh",
                        background: "#0a0612",
                        color: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        textAlign: "center",
                        fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                >
                    <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#c084fc" }}>
                        Something unexpected happened
                    </h2>
                    <p style={{ color: "#a8a29e", marginBottom: "20px", maxWidth: "480px", lineHeight: "1.5" }}>
                        An interface error was caught safely. Click below to reload and continue listening.
                    </p>
                    <button
                        onClick={this.handleReload}
                        style={{
                            background: "linear-gradient(135deg, #a855f7, #6366f1)",
                            color: "#fff",
                            border: "none",
                            padding: "10px 24px",
                            borderRadius: "999px",
                            fontSize: "14px",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 4px 15px rgba(168, 85, 247, 0.4)",
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
