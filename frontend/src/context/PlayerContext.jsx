import { createContext, useContext, useState, useRef, useEffect } from "react";

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
    const audioRef = useRef(new Audio());
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    // Configure audio listeners
    useEffect(() => {
        const audio = audioRef.current;
        audio.volume = volume;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration || 0);
        const handleWaiting = () => setIsLoadingAudio(true);
        const handlePlaying = () => {
            setIsLoadingAudio(false);
            setIsPlaying(true);
        };
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("waiting", handleWaiting);
        audio.addEventListener("playing", handlePlaying);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("waiting", handleWaiting);
            audio.removeEventListener("playing", handlePlaying);
            audio.removeEventListener("ended", handleEnded);
        };
    }, []);

    // Play a specific song
    const playSong = async (song) => {
        if (!song) return;
        const audio = audioRef.current;

        setCurrentSong(song);
        setIsLoadingAudio(true);

        try {
            let streamUrl = null;

            // 1. Fetch live stream URL from our FastAPI ML backend
            try {
                const response = await fetch(
                    `http://localhost:8000/audio/stream?title=${encodeURIComponent(
                        song.title
                    )}&artist=${encodeURIComponent(song.artist || "")}`
                );

                if (response.ok) {
                    const data = await response.json();
                    if (data.stream_url) {
                        streamUrl = data.stream_url;
                    }
                }
            } catch (backendErr) {
                console.warn("FastAPI backend error, checking fallback:", backendErr);
            }

            // 2. Fallback to song.audioUrl if backend stream is not available
            if (!streamUrl && song.audioUrl) {
                streamUrl = song.audioUrl;
            }

            if (!streamUrl) {
                throw new Error("No playable audio stream found for this song.");
            }

            audio.src = streamUrl;
            await audio.play();
            setIsPlaying(true);
        } catch (err) {
            console.error("Playback error:", err);
            setIsPlaying(false);
        } finally {
            setIsLoadingAudio(false);
        }
    };

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!currentSong) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().catch(console.error);
            setIsPlaying(true);
        }
    };

    const seek = (timeInSeconds) => {
        const audio = audioRef.current;
        audio.currentTime = timeInSeconds;
        setCurrentTime(timeInSeconds);
    };

    const changeVolume = (newVolume) => {
        const audio = audioRef.current;
        audio.volume = newVolume;
        setVolume(newVolume);
    };

    return (
        <PlayerContext.Provider
            value={{
                currentSong,
                isPlaying,
                isLoadingAudio,
                currentTime,
                duration,
                volume,
                playSong,
                togglePlay,
                seek,
                changeVolume,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => useContext(PlayerContext);
