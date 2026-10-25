import { PlayerProvider } from "./context/PlayerContext";
import Player from "./components/Player";
import "./App.css";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturesSection from "./components/FeaturesSection";
import MusicMoments from "./components/MusicMoments";
import HowItWorks from "./components/HowItWorks";
import Reviews from "./components/Reviews";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

import HomePage from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <FeaturesSection />
      <MusicMoments />
      <HowItWorks />
      <Reviews />
      <FAQ />
      <Footer />
    </>
  );
}

function App() {
  return (
    <PlayerProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      <Player />
    </PlayerProvider>
  );
}


export default App;
