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
    const ytPlayerRef = useRef(null);
    const ytReadyRef = useRef(false);
    const activePlayerRef = useRef("none"); // "audio" | "youtube" | "none"
    const pendingSongRef = useRef(null);

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

    // Initialize YouTube IFrame API bridge on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        const initYT = () => {
            if (ytPlayerRef.current || !window.YT || !window.YT.Player) return;
            const container = document.getElementById("vayam-yt-bridge");
            if (!container) return;

            try {
                ytPlayerRef.current = new window.YT.Player("vayam-yt-bridge", {
                    height: "1",
                    width: "1",
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        disablekb: 1,
                        fs: 0,
                        rel: 0,
                        playsinline: 1,
                    },
                    events: {
                        onReady: () => {
                            ytReadyRef.current = true;
                            if (pendingSongRef.current) {
                                const { videoId, query } = pendingSongRef.current;
                                pendingSongRef.current = null;
                                playInYouTube(videoId, query);
                            }
                        },
                        onStateChange: (event) => {
                            if (activePlayerRef.current !== "youtube") return;
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                setIsPlaying(true);
                                setIsLoadingAudio(false);
                            } else if (event.data === window.YT.PlayerState.PAUSED) {
                                setIsPlaying(false);
                            } else if (event.data === window.YT.PlayerState.ENDED) {
                                setIsPlaying(false);
                                if (playNextRef.current) {
                                    playNextRef.current();
                                }
                            } else if (event.data === window.YT.PlayerState.BUFFERING) {
                                setIsLoadingAudio(true);
                            }
                        },
                        onError: (e) => {
                            console.warn("YouTube player bridge notice:", e.data);
                            setIsLoadingAudio(false);
                        },
                    },
                });
            } catch (err) {
                console.warn("YouTube bridge creation deferred:", err);
            }
        };

        if (!window.YT) {
            const existingScript = document.getElementById("vayam-yt-script");
            if (!existingScript) {
                const tag = document.createElement("script");
                tag.id = "vayam-yt-script";
                tag.src = "https://www.youtube.com/iframe_api";
                document.head.appendChild(tag);
            }
            const prevCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (typeof prevCallback === "function") prevCallback();
                initYT();
            };
        } else if (window.YT && window.YT.Player) {
            initYT();
        }
    }, []);

    // Ticker to sync current time and duration when active player is YouTube
    useEffect(() => {
        const timer = setInterval(() => {
            if (activePlayerRef.current === "youtube" && ytPlayerRef.current) {
                try {
                    const p = ytPlayerRef.current;
                    if (typeof p.getCurrentTime === "function") {
                        const ct = p.getCurrentTime() || 0;
                        const dur = p.getDuration() || 0;
                        setCurrentTime(ct);
                        if (dur > 0) setDuration(dur);
                    }
                } catch {}
            }
        }, 400);
        return () => clearInterval(timer);
    }, []);

    // Configure native HTML5 Audio listeners
    useEffect(() => {
        const audio = audioRef.current;
        audio.volume = volume;

        const handleTimeUpdate = () => {
            if (activePlayerRef.current === "audio") {
                setCurrentTime(audio.currentTime);
            }
        };
        const handleLoadedMetadata = () => {
            if (activePlayerRef.current === "audio") {
                setDuration(audio.duration || 0);
            }
        };
        const handleWaiting = () => {
            if (activePlayerRef.current === "audio") {
                setIsLoadingAudio(true);
            }
        };
        const handlePlaying = () => {
            if (activePlayerRef.current === "audio") {
                setIsLoadingAudio(false);
                setIsPlaying(true);
            }
        };
        const handleEnded = () => {
            if (activePlayerRef.current === "audio") {
                setIsPlaying(false);
                if (playNextRef.current) {
                    playNextRef.current();
                }
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

    // Helper: Stop playback on both engines
    const stopAllMedia = () => {
        const audio = audioRef.current;
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch {}

        if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === "function") {
            try {
                ytPlayerRef.current.pauseVideo();
            } catch {}
        }
    };

    // Helper: Play directly in YouTube bridge
    const playInYouTube = (videoId, query) => {
        const player = ytPlayerRef.current;
        if (!player || !ytReadyRef.current || typeof player.loadVideoById !== "function") {
            pendingSongRef.current = { videoId, query };
            return;
        }

        try {
            if (videoId) {
                player.loadVideoById(videoId);
            } else {
                player.loadPlaylist({
                    listType: "search",
                    list: query || "music audio",
                    index: 0,
                    startSeconds: 0,
                });
            }
            player.playVideo();
            activePlayerRef.current = "youtube";
            setIsPlaying(true);
            setIsLoadingAudio(false);
        } catch (err) {
            console.warn("YouTube play invocation fallback:", err);
            activePlayerRef.current = "youtube";
            setIsPlaying(true);
            setIsLoadingAudio(false);
        }
    };

    // Play a specific song and optionally update active queue
    const playSong = async (song, newQueue = null) => {
        if (!song) return;
        const unwrapped = unwrapSong(song);
        const audio = audioRef.current;

        // Stop whatever is playing right now
        stopAllMedia();

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
        setCurrentTime(0);

        // Resolve cover art in background if missing
        if (!unwrapped.coverUrl) {
            try {
                const queryTerm = encodeURIComponent(
                    `${unwrapped.title} ${unwrapped.artist || ""}`.trim()
                );
                fetch(`https://itunes.apple.com/search?term=${queryTerm}&entity=song&limit=1`)
                    .then((r) => r.json())
                    .then((catData) => {
                        const hit = catData.results?.[0];
                        if (hit?.artworkUrl100) {
                            const cover = hit.artworkUrl100.replace("100x100bb", "600x600bb");
                            setCurrentSong((prev) => (prev ? { ...prev, coverUrl: cover } : prev));
                        }
                    })
                    .catch(() => {});
            } catch {}
        }

        const ytSearchQuery = `${unwrapped.title} ${unwrapped.artist || ""} audio`.trim();

        // 1. If song has a direct valid audio stream that is NOT a placeholder sound effect, try it!
        if (unwrapped.audioUrl && !isAudioPreviewOrPlaceholder(unwrapped.audioUrl)) {
            try {
                audio.src = unwrapped.audioUrl;
                audio.load();
                await audio.play();
                activePlayerRef.current = "audio";
                setIsPlaying(true);
                setIsLoadingAudio(false);
                return;
            } catch {
                // If direct stream fails, fall through to YouTube streaming engine
            }
        }

        // 2. Fetch live YouTube audio stream from ML engine or fallback to YouTube bridge
        let resolvedStreamUrl = null;
        let resolvedVideoId = unwrapped.videoId || unwrapped.video_id || null;

        const candidateEndpoints = [
            ML_BASE_URL,
            "https://vayam-music-ml-api.onrender.com",
            "http://localhost:8000",
        ].filter(Boolean);
        const uniqueEndpoints = [...new Set(candidateEndpoints)];

        for (const endpoint of uniqueEndpoints) {
            if (resolvedStreamUrl) break;
            const isMixed =
                typeof window !== "undefined" &&
                window.location.protocol === "https:" &&
                endpoint.startsWith("http://");
            if (isMixed) continue;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 7000);
                const response = await fetch(
                    `${endpoint}/audio/stream?title=${encodeURIComponent(
                        unwrapped.title
                    )}&artist=${encodeURIComponent(unwrapped.artist || "")}`,
                    { signal: controller.signal }
                );
                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data.stream_url) {
                        resolvedStreamUrl = data.stream_url;
                    }
                    if (data.video_id) {
                        resolvedVideoId = data.video_id;
                    }
                    if (data.thumbnail && !unwrapped.coverUrl) {
                        setCurrentSong((prev) =>
                            prev ? { ...prev, coverUrl: data.thumbnail } : prev
                        );
                    }
                    if (data.duration) {
                        setDuration(data.duration);
                    }
                    break;
                }
            } catch {
                // Connection or timeout - continue
            }
        }

        // 3. Play the resolved stream or fall back to resilient YouTube bridge
        if (resolvedStreamUrl) {
            try {
                audio.src = resolvedStreamUrl;
                audio.load();
                await audio.play();
                activePlayerRef.current = "audio";
                setIsPlaying(true);
                setIsLoadingAudio(false);
                return;
            } catch (audioErr) {
                console.warn("Direct HTML5 audio play error, switching to YouTube bridge:", audioErr);
            }
        }

        // 4. Resilient YouTube Player Bridge (Plays full audio everywhere without 403 or CORS)
        playInYouTube(resolvedVideoId, ytSearchQuery);
    };

    // Play next song in active queue (with AI auto-recommendations when reaching the end)
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

        // 2. Reached the end of queue: automatically query ML recommendation engine
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
        // Standard Reverse Behavior: If played > 3 seconds, replay from start (0:00)
        if (currentTime > 3) {
            seek(0);
            if (!isPlaying) {
                togglePlay();
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
    }, [currentTime, isPlaying]);

    // Keep playNextRef up to date for handleEnded listener
    useEffect(() => {
        playNextRef.current = playNext;
    }, [playNext]);

    const togglePlay = () => {
        if (!currentSong) return;

        if (activePlayerRef.current === "youtube" && ytPlayerRef.current) {
            try {
                if (isPlaying) {
                    ytPlayerRef.current.pauseVideo();
                    setIsPlaying(false);
                } else {
                    ytPlayerRef.current.playVideo();
                    setIsPlaying(true);
                }
                return;
            } catch {}
        }

        const audio = audioRef.current;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().catch(console.error);
            setIsPlaying(true);
        }
    };

    const seek = (timeInSeconds) => {
        if (activePlayerRef.current === "youtube" && ytPlayerRef.current) {
            try {
                ytPlayerRef.current.seekTo(timeInSeconds, true);
                setCurrentTime(timeInSeconds);
                return;
            } catch {}
        }

        const audio = audioRef.current;
        audio.currentTime = timeInSeconds;
        setCurrentTime(timeInSeconds);
    };

    const changeVolume = (newVolume) => {
        const audio = audioRef.current;
        audio.volume = newVolume;

        if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === "function") {
            try {
                ytPlayerRef.current.setVolume(newVolume * 100);
            } catch {}
        }

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
            {/* Resilient hidden YouTube player bridge for uninterrupted full music playback */}
            <div
                id="vayam-yt-bridge"
                aria-hidden="true"
                style={{
                    position: "fixed",
                    bottom: -9999,
                    left: -9999,
                    width: 1,
                    height: 1,
                    opacity: 0,
                    pointerEvents: "none",
                    zIndex: -100,
                }}
            />
        </PlayerContext.Provider>
    );
}

export const usePlayer = () => useContext(PlayerContext) || defaultPlayerContext;
