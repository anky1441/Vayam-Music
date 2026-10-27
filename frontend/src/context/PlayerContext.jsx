import { createContext, useContext, useState, useRef, useEffect } from "react";
import { ML_BASE_URL } from "../api/musicApi";

const isSoundEffectUrl = (url) => {
    if (!url || typeof url !== "string") return false;
    return url.includes("actions.google.com/sounds") || url.includes("soundhelix.com");
};

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

        // 1. If song already has a direct valid audio stream that is NOT a placeholder sound effect, use it!
        if (song.audioUrl && !isSoundEffectUrl(song.audioUrl)) {
            streamUrl = song.audioUrl;
        }

        // 2. Fetch live full stream URL from YouTube streaming engine
        if (!streamUrl) {
            const isMixedContent =
                typeof window !== "undefined" &&
                window.location.protocol === "https:" &&
                ML_BASE_URL.startsWith("http://");

            if (!isMixedContent) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    const response = await fetch(
                        `${ML_BASE_URL}/audio/stream?title=${encodeURIComponent(
                            song.title
                        )}&artist=${encodeURIComponent(song.artist || "")}`,
                        { signal: controller.signal }
                    );
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        if (data.stream_url) {
                            streamUrl = data.stream_url;
                        }
                        if (data.thumbnail && !song.coverUrl) {
                            setCurrentSong((prev) =>
                                prev ? { ...prev, coverUrl: data.thumbnail } : prev
                            );
                        }
                    }
                } catch (backendErr) {
                    console.warn(
                        "YouTube streaming engine fetch error:",
                        backendErr
                    );
                }
            }
        }

        // 3. Fallback: If YouTube stream is unreachable (e.g. remote visitor on live site or ML server offline),
        // resolve HD cover & public catalog audio stream so music ALWAYS plays for normal visitors
        if (!streamUrl || !song.coverUrl) {
            try {
                const queryTerm = encodeURIComponent(
                    `${song.title} ${song.artist || ""}`.trim()
                );
                const catRes = await fetch(
                    `https://itunes.apple.com/search?term=${queryTerm}&entity=song&limit=1`
                );
                if (catRes.ok) {
                    const catData = await catRes.json();
                    const hit = catData.results?.[0];
                    if (!streamUrl && hit?.previewUrl) {
                        streamUrl = hit.previewUrl;
                    }
                    if (!song.coverUrl && hit?.artworkUrl100) {
                        const cover = hit.artworkUrl100.replace(
                            "100x100bb",
                            "600x600bb"
                        );
                        setCurrentSong((prev) =>
                            prev ? { ...prev, coverUrl: cover } : prev
                        );
                    }
                }
            } catch (catErr) {
                console.warn("Catalog audio stream fallback failed:", catErr);
            }
        }

        if (!streamUrl) {
            throw new Error(`Unable to resolve playable audio stream for "${song.title}".`);
        }

        audio.src = streamUrl;
        audio.load();
        try {
            await audio.play();
            setIsPlaying(true);
        } catch (playErr) {
            console.warn("Direct play error:", playErr);
            setIsPlaying(!audio.paused);
        }
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
