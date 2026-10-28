import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { ML_BASE_URL, getSimilarRecommendations } from "../api/musicApi";
import { sameId, unwrapSong } from "../utils/music";

const isAudioPreviewOrPlaceholder = (url) => {
    if (!url || typeof url !== "string") return true;
    return (
        url.includes("actions.google.com/sounds") ||
        url.includes("soundhelix.com") ||
        url.includes("apple.com") ||
        url.includes("itunes") ||
        url.includes("mzstatic.com")
    );
};

const defaultPlayerContext = {
    currentSong: null,
    isPlaying: false,
    isLoadingAudio: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    queue: [],
    queueIndex: -1,
    playSong: () => {},
    playNext: () => {},
    playPrevious: () => {},
    togglePlay: () => {},
    seek: () => {},
    changeVolume: () => {},
    hasNext: false,
    hasPrevious: false,
};

const PlayerContext = createContext(defaultPlayerContext);

export function PlayerProvider({ children }) {
    const audioRef = useRef(new Audio());
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);

    // Queue management state
    const [queue, setQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(-1);

    const queueRef = useRef([]);
    const queueIndexRef = useRef(-1);
    const playNextRef = useRef();

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    useEffect(() => {
        queueIndexRef.current = queueIndex;
    }, [queueIndex]);

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
        const handleEnded = () => {
            setIsPlaying(false);
            // Automatically advance to the next track if a queue exists
            if (playNextRef.current) {
                playNextRef.current();
            }
        };

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
    }, [volume]);

    // Play a specific song and optionally update the active queue
    const playSong = async (song, newQueue = null) => {
        if (!song) return;
        const unwrapped = unwrapSong(song);
        const audio = audioRef.current;

        // Handle Queue logic
        let currentQ = queueRef.current;
        let targetIdx = -1;

        if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
            const cleanQueue = newQueue.map((item) => unwrapSong(item));
            setQueue(cleanQueue);
            queueRef.current = cleanQueue;
            currentQ = cleanQueue;
            targetIdx = cleanQueue.findIndex(
                (s) =>
                    sameId(s.id, unwrapped.id) ||
                    (s.title === unwrapped.title && (!unwrapped.artist || s.artist === unwrapped.artist))
            );
            if (targetIdx === -1) targetIdx = 0;
        } else {
            // Check if unwrapped song already exists in current queue
            targetIdx = currentQ.findIndex(
                (s) =>
                    sameId(s.id, unwrapped.id) ||
                    (s.title === unwrapped.title && (!unwrapped.artist || s.artist === unwrapped.artist))
            );
            if (targetIdx === -1) {
                const updated = [...currentQ, unwrapped];
                setQueue(updated);
                queueRef.current = updated;
                targetIdx = updated.length - 1;
            }
        }

        setQueueIndex(targetIdx);
        queueIndexRef.current = targetIdx;
        setCurrentSong(unwrapped);
        setIsLoadingAudio(true);

        try {
            let streamUrl = null;

            // 1. If song already has a direct valid audio stream that is NOT a placeholder or 30s preview, use it!
            if (unwrapped.audioUrl && !isAudioPreviewOrPlaceholder(unwrapped.audioUrl)) {
                streamUrl = unwrapped.audioUrl;
            }

            // 2. Fetch live full stream URL from YouTube streaming engine (Google CDN m4a)
            if (!streamUrl) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 12000);
                    const response = await fetch(
                        `${ML_BASE_URL}/audio/stream?title=${encodeURIComponent(
                            unwrapped.title
                        )}&artist=${encodeURIComponent(unwrapped.artist || "")}`,
                        { signal: controller.signal }
                    );
                    clearTimeout(timeoutId);

                    if (response.ok) {
                        const data = await response.json();
                        if (data.stream_url) {
                            streamUrl = data.stream_url;
                        }
                        if (data.thumbnail && !unwrapped.coverUrl) {
                            setCurrentSong((prev) =>
                                prev ? { ...prev, coverUrl: data.thumbnail } : prev
                            );
                        }
                    }
                } catch (backendErr) {
                    console.warn("YouTube streaming engine fetch error:", backendErr);
                }
            }

            // 3. Fallback for HD cover art ONLY (NEVER use Apple preview audio for playback!)
            if (!unwrapped.coverUrl) {
                try {
                    const queryTerm = encodeURIComponent(
                        `${unwrapped.title} ${unwrapped.artist || ""}`.trim()
                    );
                    const catRes = await fetch(
                        `https://itunes.apple.com/search?term=${queryTerm}&entity=song&limit=1`
                    );
                    if (catRes.ok) {
                        const catData = await catRes.json();
                        const hit = catData.results?.[0];
                        if (hit?.artworkUrl100) {
                            const cover = hit.artworkUrl100.replace("100x100bb", "600x600bb");
                            setCurrentSong((prev) =>
                                prev ? { ...prev, coverUrl: cover } : prev
                            );
                        }
                    }
                } catch (catErr) {
                    console.warn("Catalog cover art fallback error:", catErr);
                }
            }

            if (!streamUrl) {
                throw new Error(`Unable to resolve YouTube audio stream for "${unwrapped.title}". Please ensure the audio streaming service is active.`);
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

    // Play next song in the active queue (with AI auto-recommendation when reaching the end)
    const playNext = useCallback(async () => {
        const curQ = queueRef.current;
        const curIdx = queueIndexRef.current;
        if (!curQ || curQ.length === 0) return;

        // 1. If there is an upcoming song in the queue, play it immediately
        if (curIdx < curQ.length - 1) {
            const nextSong = curQ[curIdx + 1];
            if (nextSong) {
                playSong(nextSong);
            }
            return;
        }

        // 2. Reached the end of queue (or single song): automatically query ML recommendation engine
        const currentSongObj = curQ[curIdx];
        if (currentSongObj?.title) {
            try {
                const similarSongs = await getSimilarRecommendations(currentSongObj.title, 5);
                if (Array.isArray(similarSongs) && similarSongs.length > 0) {
                    const newTracks = similarSongs.filter(
                        (s) =>
                            !curQ.some(
                                (existing) =>
                                    sameId(existing.id, s.id) ||
                                    (existing.title?.toLowerCase() === s.title?.toLowerCase() &&
                                     existing.artist?.toLowerCase() === s.artist?.toLowerCase())
                            )
                    );

                    if (newTracks.length > 0) {
                        const expandedQueue = [...curQ, ...newTracks];
                        setQueue(expandedQueue);
                        queueRef.current = expandedQueue;
                        playSong(newTracks[0]);
                        return;
                    }
                }
            } catch (err) {
                console.warn("Recommendation auto-advance fallback:", err);
            }
        }

        // 3. Fallback: Loop to beginning of queue
        const nextIdx = (curIdx + 1) % curQ.length;
        const nextSong = curQ[nextIdx];
        if (nextSong) {
            playSong(nextSong);
        }
    }, []);

    // Reverse / Previous playback
    const playPrevious = useCallback(() => {
        const audio = audioRef.current;

        // Standard Reverse Behavior: If played > 3 seconds, replay from start (0:00)
        if (audio && audio.currentTime > 3) {
            audio.currentTime = 0;
            setCurrentTime(0);
            if (audio.paused) {
                audio.play().catch(console.error);
                setIsPlaying(true);
            }
            return;
        }

        // If played <= 3 seconds, go to previous track in queue
        const curQ = queueRef.current;
        const curIdx = queueIndexRef.current;
        if (!curQ || curQ.length === 0) return;

        const prevIdx = curIdx > 0 ? curIdx - 1 : curQ.length - 1;
        const prevSong = curQ[prevIdx];
        if (prevSong) {
            playSong(prevSong);
        }
    }, []);

    // Keep playNextRef up to date for handleEnded listener
    useEffect(() => {
        playNextRef.current = playNext;
    }, [playNext]);

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
                queue,
                queueIndex,
                playSong,
                playNext,
                playPrevious,
                togglePlay,
                seek,
                changeVolume,
                hasNext: queue.length > 1,
                hasPrevious: queue.length > 1 || currentTime > 3,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => useContext(PlayerContext) || defaultPlayerContext;
