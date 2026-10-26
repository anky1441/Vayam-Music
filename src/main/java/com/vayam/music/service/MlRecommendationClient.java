package com.vayam.music.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vayam.music.dto.ml.MlPlaylistResponse;
import com.vayam.music.dto.ml.MlRecommendationsResponse;
import com.vayam.music.dto.ml.MlSongDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class MlRecommendationClient {
    private static final Logger log = LoggerFactory.getLogger(MlRecommendationClient.class);

    private static final Set<String> VALID_ML_MOODS = Set.of("happy", "sad", "relaxed", "energetic", "focus");

    private final String baseUrl;
    private final Duration timeout;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public MlRecommendationClient(
            @Value("${ml.api.base-url:https://vayam-music-ml-api.onrender.com}") String baseUrl,
            @Value("${ml.api.timeout-seconds:4}") int timeoutSeconds) {
        String cleanedUrl = baseUrl != null ? baseUrl.trim() : "";
        if (cleanedUrl.endsWith("/")) {
            cleanedUrl = cleanedUrl.substring(0, cleanedUrl.length() - 1);
        }
        this.baseUrl = cleanedUrl;
        this.timeout = Duration.ofSeconds(Math.max(2, timeoutSeconds));
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(this.timeout)
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    /**
     * Checks if the ML microservice is available and responding.
     */
    public boolean isAvailable() {
        if (baseUrl.isBlank()) {
            return false;
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/health"))
                    .timeout(Duration.ofSeconds(3))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200 && response.body().contains("ok");
        } catch (Exception e) {
            log.debug("ML microservice health check failed at {}: {}", baseUrl, e.getMessage());
            return false;
        }
    }

    /**
     * Calls POST /recommend/similar for content-based similar song recommendations.
     */
    public List<MlSongDto> recommendSimilar(String songName, int count) {
        if (songName == null || songName.isBlank()) {
            return Collections.emptyList();
        }

        int limit = Math.min(Math.max(count, 1), 20);
        Map<String, Object> body = Map.of(
                "song_name", songName.trim(),
                "number", limit
        );

        try {
            String jsonPayload = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/recommend/similar"))
                    .timeout(timeout)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                MlRecommendationsResponse result = objectMapper.readValue(response.body(), MlRecommendationsResponse.class);
                return result.recommendations() != null ? result.recommendations() : Collections.emptyList();
            } else {
                log.info("ML recommendSimilar returned HTTP {} for song '{}': {}", response.statusCode(), songName, response.body());
            }
        } catch (Exception e) {
            log.warn("Failed calling ML service /recommend/similar: {}", e.getMessage());
        }

        return Collections.emptyList();
    }

    /**
     * Calls POST /recommend/mood for audio-feature mood based recommendations.
     */
    public List<MlSongDto> recommendByMood(String mood, int count) {
        String mlMood = mapToMlMood(mood);
        int limit = Math.min(Math.max(count, 1), 50);

        Map<String, Object> body = Map.of(
                "mood", mlMood,
                "number", limit
        );

        try {
            String jsonPayload = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/recommend/mood"))
                    .timeout(timeout)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                MlRecommendationsResponse result = objectMapper.readValue(response.body(), MlRecommendationsResponse.class);
                return result.recommendations() != null ? result.recommendations() : Collections.emptyList();
            } else {
                log.info("ML recommendByMood returned HTTP {} for mood '{}': {}", response.statusCode(), mlMood, response.body());
            }
        } catch (Exception e) {
            log.warn("Failed calling ML service /recommend/mood: {}", e.getMessage());
        }

        return Collections.emptyList();
    }

    /**
     * Calls POST /playlist/generate to build a diverse mood/genre playlist via ML.
     */
    public MlPlaylistResponse generatePlaylist(String mood, int count, String genre) {
        String mlMood = mapToMlMood(mood);
        int limit = Math.min(Math.max(count, 1), 50);

        Map<String, Object> body = Map.of(
                "mood", mlMood,
                "number", limit,
                "genre", genre != null ? genre.trim() : ""
        );

        try {
            String jsonPayload = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/playlist/generate"))
                    .timeout(timeout)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                return objectMapper.readValue(response.body(), MlPlaylistResponse.class);
            } else {
                log.info("ML generatePlaylist returned HTTP {} for mood '{}', genre '{}': {}",
                        response.statusCode(), mlMood, genre, response.body());
            }
        } catch (Exception e) {
            log.warn("Failed calling ML service /playlist/generate: {}", e.getMessage());
        }

        return null;
    }

    /**
     * Maps user provided moods/vibes to the 5 trained model classes:
     * happy, sad, relaxed, energetic, focus
     */
    public String mapToMlMood(String input) {
        if (input == null || input.isBlank()) {
            return "relaxed";
        }
        String clean = input.trim().toLowerCase();
        if (VALID_ML_MOODS.contains(clean)) {
            return clean;
        }

        if (clean.contains("chill") || clean.contains("calm") || clean.contains("peace") || clean.contains("sleep") || clean.contains("sunset")) {
            return "relaxed";
        }
        if (clean.contains("work") || clean.contains("study") || clean.contains("code") || clean.contains("coding") || clean.contains("lo-fi") || clean.contains("ambient")) {
            return "focus";
        }
        if (clean.contains("dance") || clean.contains("party") || clean.contains("gym") || clean.contains("workout") || clean.contains("pump") || clean.contains("run") || clean.contains("rock")) {
            return "energetic";
        }
        if (clean.contains("cry") || clean.contains("melanchol") || clean.contains("heartbreak") || clean.contains("broken") || clean.contains("rain") || clean.contains("lonely")) {
            return "sad";
        }
        if (clean.contains("joy") || clean.contains("upbeat") || clean.contains("fun") || clean.contains("good") || clean.contains("summer") || clean.contains("sun")) {
            return "happy";
        }

        return "relaxed";
    }
}
