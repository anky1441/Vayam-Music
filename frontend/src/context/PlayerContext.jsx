import { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { ML_BASE_URL, getSimilarRecommendations } from "../api/musicApi";
import { sameId, unwrapSong } from "../utils/music";

const isSoundEffectUrl = (url) => {
    if (!url || typeof url !== "string") return true;
    return url.includes("actions.google.com/sounds");
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

        // Track playback state across parallel resolvers
        let playbackStarted = false;

        const attemptPlay = async (audioSource, trackDuration = null) => {
            if (activeSongIdRef.current !== songIdentifier || !audioSource) return false;
            try {
                if (audio.src !== audioSource) {
                    const prevTime = audio.currentTime || 0;
                    audio.src = audioSource;
                    audio.load();
                    if (prevTime > 0 && trackDuration && prevTime < trackDuration) {
                        try {
                            audio.currentTime = prevTime;
                        } catch {}
                    }
                }
                await audio.play();
                playbackStarted = true;
                setIsPlaying(true);
                setIsLoadingAudio(false);
                if (trackDuration) setDuration(trackDuration);
                return true;
            } catch (err) {
                console.warn("Audio play attempt rejected by browser:", err);
                return false;
            }
        };

        // 1. FAST-START: If song already has an audioUrl (database seed or cached), play instantly
        if (unwrapped.audioUrl && typeof unwrapped.audioUrl === "string" && !isSoundEffectUrl(unwrapped.audioUrl)) {
            attemptPlay(unwrapped.audioUrl);
        }

        // 2. Parallel Fast Catalog Lookup: Worldwide Apple CDN responds in ~150-250ms
        const queryTerm = encodeURIComponent(`${unwrapped.title} ${unwrapped.artist || ""}`.trim());
        const catalogPromise = fetch(`https://itunes.apple.com/search?term=${queryTerm}&entity=song&limit=1`)
            .then((r) => r.json())
            .then((catData) => {
                const hit = catData.results?.[0];
                if (hit?.artworkUrl100 && !unwrapped.coverUrl) {
                    const cover = hit.artworkUrl100.replace("100x100bb", "600x600bb");
                    setCurrentSong((prev) => (prev ? { ...prev, coverUrl: cover } : prev));
                }
                return hit;
            })
            .catch(() => null);

        // As soon as catalog metadata resolves, immediately play preview if not yet playing
        catalogPromise.then((hit) => {
            if (!playbackStarted && hit?.previewUrl && activeSongIdRef.current === songIdentifier) {
                const previewSec = hit.trackTimeMillis ? Math.round(hit.trackTimeMillis / 1000) : 30;
                attemptPlay(hit.previewUrl, previewSec);
            }
        });

        // 3. Smart ML endpoint resolving (local first on localhost, then cloud)
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

        // 4. Query ML audio stream endpoint with 3s timeout
        for (const endpoint of uniqueEndpoints) {
            if (activeSongIdRef.current !== songIdentifier) break;
            const isMixed =
                typeof window !== "undefined" &&
                window.location.protocol === "https:" &&
                endpoint.startsWith("http://");
            if (isMixed) continue;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);
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
                        const upgraded = await attemptPlay(data.stream_url, data.duration);
                        if (upgraded) {
                            if (data.thumbnail && !unwrapped.coverUrl) {
                                setCurrentSong((prev) => (prev ? { ...prev, coverUrl: data.thumbnail } : prev));
                            }
                            return;
                        }
                    }
                }
            } catch (err) {
                // Endpoint offline, timed out or blocked
            }
        }

        // 5. Ultimate Fallback: Ensure audio playback is running via catalog preview or backup
        if (!playbackStarted && activeSongIdRef.current === songIdentifier) {
            const hit = await catalogPromise;
            if (hit?.previewUrl) {
                await attemptPlay(hit.previewUrl);
            } else if (unwrapped.audioUrl && !isSoundEffectUrl(unwrapped.audioUrl)) {
                await attemptPlay(unwrapped.audioUrl);
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
