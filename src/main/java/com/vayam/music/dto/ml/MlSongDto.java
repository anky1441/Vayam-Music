package com.vayam.music.dto.ml;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MlSongDto(
        @JsonProperty("track_name") String trackName,
        @JsonProperty("artists") String artists,
        @JsonProperty("track_genre") String trackGenre,
        @JsonProperty("duration_seconds") Integer durationSeconds
) {}
