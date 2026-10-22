package com.vayam.music.dto;

import java.util.List;

public record PlaylistResponse(Long id, String name, String description, Long ownerId,
                               List<SongResponse> songs) {}
