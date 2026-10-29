import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { ML_BASE_URL, getSimilarRecommendations } from "../api/musicApi";
import { sameId, unwrapSong } from "../utils/music";

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
    const activeSongIdRef = useRef(null);

    useEffect(() => {
        queueRef.current = queue;
    }, [queue]);

    useEffect(() => {
        queueIndexRef.current = queueIndex;
    }, [queueIndex]);

    // Configure native HTML5 Audio listeners
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
            if (playNextRef.current) {
                playNextRef.current();
            }
        };
        const handleError = (e) => {
            console.warn("Audio element error notification:", e);
        };

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("waiting", handleWaiting);
        audio.addEventListener("playing", handlePlaying);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("waiting", handleWaiting);
            audio.removeEventListener("playing", handlePlaying);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("error", handleError);
        };
    }, [volume]);

    // Play a specific song and optionally update the active queue
    const playSong = async (song, newQueue = null) => {
        if (!song) return;
        const unwrapped = unwrapSong(song);
        const audio = audioRef.current;
        const songIdentifier = unwrapped.id || `${unwrapped.title}-${unwrapped.artist}`;
        activeSongIdRef.current = songIdentifier;

        // Stop current playback
        try {
            audio.pause();
            audio.currentTime = 0;
        } catch {}

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
        setCurrentTime(0);
        setIsLoadingAudio(true);

        // Instant catalog metadata & quick-start preview
        let catalogPreviewUrl = "";
        const queryTerm = encodeURIComponent(`${unwrapped.title} ${unwrapped.artist || ""}`.trim());
        const catalogPromise = fetch(`https://itunes.apple.com/search?term=${queryTerm}&entity=song&limit=1`)
            .then((r) => r.json())
            .then((catData) => {
                const hit = catData.results?.[0];
                if (hit?.artworkUrl100 && !unwrapped.coverUrl) {
                    const cover = hit.artworkUrl100.replace("100x100bb", "600x600bb");
                    setCurrentSong((prev) => (prev ? { ...prev, coverUrl: cover } : prev));
                }
                if (hit?.previewUrl) {
                    catalogPreviewUrl = hit.previewUrl;
                }
                return hit;
            })
            .catch(() => null);

        // Smart endpoint prioritizing: when on localhost, localhost:8000 is checked FIRST (no 6s Render delay!)
        const isLocal =
            typeof window !== "undefined" &&
            (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

        const rawEndpoints = isLocal
            ? ["http://localhost:8000", ML_BASE_URL, "https://vayam-music-ml-api.onrender.com"]
            : [ML_BASE_URL, "https://vayam-music-ml-api.onrender.com", "http://localhost:8000"];

        const uniqueEndpoints = [...new Set(rawEndpoints.filter(Boolean))];

        // Background prefetch for next song in queue
        const activeList = newQueue || currentQ;
        const nextTrack = activeList[targetIdx + 1];
        if (nextTrack && nextTrack.title) {
            const bestEndpoint = uniqueEndpoints.find(
                (ep) => !(typeof window !== "undefined" && window.location.protocol === "https:" && ep.startsWith("http://"))
            );
            if (bestEndpoint) {
                fetch(`${bestEndpoint}/audio/prefetch?title=${encodeURIComponent(nextTrack.title)}&artist=${encodeURIComponent(nextTrack.artist || "")}`)
                    .catch(() => {});
            }
        }

        let fullStreamStarted = false;

        // 1. Try Direct Full-Length Google CDN Stream URL
        for (const endpoint of uniqueEndpoints) {
            if (fullStreamStarted || activeSongIdRef.current !== songIdentifier) break;
            const isMixed =
                typeof window !== "undefined" &&
                window.location.protocol === "https:" &&
                endpoint.startsWith("http://");
            if (isMixed) continue;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                const res = await fetch(
                    `${endpoint}/audio/stream?title=${encodeURIComponent(
                        unwrapped.title
                    )}&artist=${encodeURIComponent(unwrapped.artist || "")}`,
                    { signal: controller.signal }
                );
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data.stream_url && activeSongIdRef.current === songIdentifier) {
                        try {
                            const prevTime = audio.currentTime || 0;
                            audio.src = data.stream_url;
                            audio.load();
                            if (prevTime > 0 && prevTime < (data.duration || 100)) {
                                audio.currentTime = prevTime;
                            }
                            await audio.play();
                            fullStreamStarted = true;
                            setIsPlaying(true);
                            setIsLoadingAudio(false);
                            if (data.duration) setDuration(data.duration);
                            if (data.thumbnail && !unwrapped.coverUrl) {
                                setCurrentSong((prev) => (prev ? { ...prev, coverUrl: data.thumbnail } : prev));
                            }
                            return;
                        } catch (playErr) {
                            console.warn("Direct stream play rejected, falling back to proxy:", playErr);
                        }
                    }
                }
            } catch (fetchErr) {
                console.warn(`Stream fetch error from ${endpoint}:`, fetchErr);
            }
        }

        // 2. Try Backend Audio Streaming Proxy (Bypasses Google CDN 403 Forbidden on remote clients)
        for (const endpoint of uniqueEndpoints) {
            if (fullStreamStarted || activeSongIdRef.current !== songIdentifier) break;
            const isMixed =
                typeof window !== "undefined" &&
                window.location.protocol === "https:" &&
                endpoint.startsWith("http://");
            if (isMixed) continue;

            try {
                const proxyUrl = `${endpoint}/audio/proxy?title=${encodeURIComponent(
                    unwrapped.title
                )}&artist=${encodeURIComponent(unwrapped.artist || "")}`;

                const prevTime = audio.currentTime || 0;
                audio.src = proxyUrl;
                audio.load();
                if (prevTime > 0) audio.currentTime = prevTime;
                await audio.play();
                fullStreamStarted = true;
                setIsPlaying(true);
                setIsLoadingAudio(false);
                return;
            } catch (proxyErr) {
                console.warn(`Proxy stream error from ${endpoint}:`, proxyErr);
            }
        }

        // 3. Instant Catalog Fallback if backend stream is not available
        if (!fullStreamStarted && activeSongIdRef.current === songIdentifier) {
            await catalogPromise;
            if (catalogPreviewUrl) {
                try {
                    audio.src = catalogPreviewUrl;
                    audio.load();
                    await audio.play();
                    setIsPlaying(true);
                    setIsLoadingAudio(false);
                    return;
                } catch {}
            }
        }

        setIsLoadingAudio(false);
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
