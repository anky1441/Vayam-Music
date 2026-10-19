
import "./HowItWorks.css";

const steps = [
  {
    number: "01",
    label: "STEP ONE",
    title: "Choose Your Vibe",
    description:
      "Pick a mood, describe your moment, or tell Vayam what kind of music you're looking for.",
    icon: "◉",
    className: "vibe-step-one",
  },
  {
    number: "02",
    label: "STEP TWO",
    title: "Discover Your Music",
    description:
      "Explore personalised song recommendations and playlists inspired by your mood and taste.",
    icon: "♫",
    className: "vibe-step-two",
  },
  {
    number: "03",
    label: "STEP THREE",
    title: "Make It Your Moment",
    description:
      "Find your soundtrack, explore new favourites, and keep the music that means something to you.",
    icon: "✦",
    className: "vibe-step-three",
  },
];

function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-heading">
        <p className="how-eyebrow">YOUR JOURNEY WITH VAYAM</p>

        <h2>
          From a Feeling
          <span> to a Soundtrack.</span>
        </h2>

        <p className="how-intro">
          Great music starts with a moment.
          Here's how Vayam helps you find the sound for it.
        </p>
      </div>

      <div className="how-steps">
        <div className="how-connecting-line" aria-hidden="true" />

        {steps.map((step) => (
          <article
            className={`how-step ${step.className}`}
            key={step.number}
          >
            <div className="how-step-visual">
              <div className="how-step-glow" />
              <span className="how-step-icon">{step.icon}</span>
              <span className="how-step-number">{step.number}</span>
            </div>

            <div className="how-step-copy">
              <p className="how-step-label">{step.label}</p>
              <h3>{step.title}</h3>
              <p className="how-step-description">
                {step.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;
