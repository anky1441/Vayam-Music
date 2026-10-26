package com.vayam.music.dto.ml;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MlPlaylistResponse(
        String mood,
        @JsonProperty("total_songs") Integer totalSongs,
        @JsonProperty("total_duration_seconds") Integer totalDurationSeconds,
        @JsonProperty("total_duration_minutes") Double totalDurationMinutes,
        List<MlSongDto> songs
) {}
