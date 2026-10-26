package com.vayam.music.dto.ml;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MlRecommendationsResponse(
        String feature,
        String query,
        String mood,
        List<MlSongDto> recommendations
) {}
