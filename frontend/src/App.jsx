import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";

import { isAuthenticated } from "./api/api";

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
import About from "./pages/About";
import CollabPlaylists from "./pages/CollabPlaylists";
import CollabPlaylistDetail from "./pages/CollabPlaylistDetail";

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

// Pages that need a logged-in user send everyone else to /login.
function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<About />} />
      <Route path="/collab" element={<RequireAuth><CollabPlaylists /></RequireAuth>} />
      <Route path="/collab/:id" element={<RequireAuth><CollabPlaylistDetail /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
