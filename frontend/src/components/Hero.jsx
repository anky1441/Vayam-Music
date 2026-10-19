import { useEffect, useState } from "react";
import "./Hero.css";

function Hero() {
    const covers = [
        "/images/music-cover-1.png",
        "/images/music-cover-2.jpg",
        "/images/music-cover-3.png",
    ];

    const [currentCover, setCurrentCover] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentCover((previous) => (previous + 1) % covers.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="hero" id="home">
            {/* Left side: Main heading and description */}
            <div className="hero-content">
                <p className="hero-tagline">YOUR MOOD. YOUR MUSIC.</p>

                <h1>
                    Feel Every
                    <span> Beat.</span>
                </h1>

                <p className="hero-description">
                    Discover music that matches your mood.
                    Find your rhythm, feel the moment, and
                    let the music speak.
                </p>

                <button className="hero-button">
                    Explore Music <span>↗</span>
                </button>
            </div>

            {/* Right side: Phone and floating music cards */}
            <div className="hero-visual">
                {/* Mobile mockup */}
                <div className="phone-mockup">
                    <div className="phone-screen">
                        <div className="phone-top">
                            <span className="phone-logo">vayam.</span>
                            <span className="phone-menu">♫</span>
                        </div>

                        <img
                            src={covers[currentCover]}
                            alt="Music artwork"
                            className="phone-music-image"
                        />

                        <div className="phone-content">
                            <p className="phone-tagline">
                                YOUR MOOD. YOUR MUSIC.
                            </p>

                            <h3>Feel every beat.</h3>

                            <p>
                                Find the sound that feels like you.
                            </p>

                            <button className="phone-get-started">
                                Get Started <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Floating music card 1 */}
                <div className="floating-card floating-card-one">
                    <div className="floating-art art-two">♫</div>

                    <div>
                        <strong>Golden Hour</strong>
                        <span>Feel the vibe</span>
                    </div>
                </div>

                {/* Floating music card 2 */}
                <div className="floating-card floating-card-two">
                    <div className="floating-art art-four">♪</div>

                    <div>
                        <strong>Dream State</strong>
                        <span>On repeat</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Hero;
