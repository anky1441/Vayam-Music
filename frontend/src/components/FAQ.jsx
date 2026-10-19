
import { useState } from "react";
import "./FAQ.css";

const faqs = [
  {
    question: "What is Vayam Music?",
    answer:
      "Vayam is a personalized music discovery platform designed to help you find music that fits your mood, activities, and moments.",
  },
  {
    question: "How does mood-based music discovery work?",
    answer:
      "Choose the mood or vibe you're feeling, and Vayam helps you explore music that matches the kind of experience you're looking for.",
  },
  {
    question: "Can Vayam create playlists from a prompt?",
    answer:
      "The AI Playlist Generator is designed around simple prompts such as a night drive, a study session, a relaxing evening, or a workout.",
  },
  {
    question: "What is StorySong?",
    answer:
      "StorySong is a concept that connects a photo or a selected vibe with music suggestions and short explanations for why the songs fit the moment.",
  },
  {
    question: "Can I create playlists with my friends?",
    answer:
      "Vayam's collaborative playlist concept lets friends contribute songs to a shared playlist and discover music together.",
  },
  {
    question: "Is Vayam free to use?",
    answer:
      "Vayam's final pricing and access details have not been established yet. The current project focuses on its music discovery experience rather than subscription plans.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index) => {
    setOpenIndex((currentIndex) =>
      currentIndex === index ? -1 : index
    );
  };

  return (
    <section className="faq-section" id="faq">
      <div className="faq-layout">
        <div className="faq-intro">
          <span className="faq-eyebrow">GOT QUESTIONS?</span>

          <h2>
            A little more
            <br />
            <span>about Vayam.</span>
          </h2>

          <p>
            Everything you need to know about discovering music
            that fits your world.
          </p>

          <div className="faq-note">
            <span className="faq-note-icon">♫</span>
            <div>
              <strong>Your Mood. Your Music.</strong>
              <span>Every moment has its own soundtrack.</span>
            </div>
          </div>
        </div>

        <div className="faq-list">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                className={`faq-item ${isOpen ? "active" : ""}`}
                key={faq.question}
              >
                <button
                  className="faq-question"
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                >
                  <span className="faq-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="faq-question-text">
                    {faq.question}
                  </span>

                  <span className="faq-toggle" aria-hidden="true">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                {isOpen && (
                  <div
                    className="faq-answer"
                    id={`faq-answer-${index}`}
                  >
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
