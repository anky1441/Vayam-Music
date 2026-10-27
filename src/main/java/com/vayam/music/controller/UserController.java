package com.vayam.music.controller;

import com.vayam.music.dto.PlaylistResponse;
import com.vayam.music.dto.SongResponse;
import com.vayam.music.dto.UpdateUserRequest;
import com.vayam.music.dto.UserResponse;
import com.vayam.music.model.User;
import com.vayam.music.repository.UserRepository;
import com.vayam.music.security.SecurityUtils;
import com.vayam.music.service.LikeService;
import com.vayam.music.service.PlaylistService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;
    private final LikeService likeService;
    private final PlaylistService playlistService;

    public UserController(UserRepository userRepository, LikeService likeService, PlaylistService playlistService) {
        this.userRepository = userRepository;
        this.likeService = likeService;
        this.playlistService = playlistService;
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        Long userId = SecurityUtils.getUserId(authentication, userRepository);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return UserResponse.from(user);
    }

    @PatchMapping("/me")
    public UserResponse updateMe(Authentication authentication, @RequestBody(required = false) UpdateUserRequest request) {
        Long userId = SecurityUtils.getUserId(authentication, userRepository);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request != null) {
            if (request.name() != null && !request.name().trim().isBlank()) {
                user.setName(request.name().trim());
            }
            if (request.bio() != null) {
                user.setBio(request.bio().trim());
            }
            if (request.avatarUrl() != null && !request.avatarUrl().trim().isBlank()) {
                user.setAvatarUrl(request.avatarUrl().trim());
            }
        }
        user = userRepository.save(user);
        return UserResponse.from(user);
    }

    @PutMapping("/me")
    public UserResponse replaceMe(Authentication authentication, @RequestBody(required = false) UpdateUserRequest request) {
        return updateMe(authentication, request);
    }

    @PatchMapping("/{id:[0-9]+}")
    public UserResponse updateById(@PathVariable Long id, Authentication authentication, @RequestBody(required = false) UpdateUserRequest request) {
        Long currentUserId = SecurityUtils.getUserId(authentication, userRepository);
        if (!currentUserId.equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own profile");
        }
        return updateMe(authentication, request);
    }

    @PutMapping("/{id:[0-9]+}")
    public UserResponse replaceById(@PathVariable Long id, Authentication authentication, @RequestBody(required = false) UpdateUserRequest request) {
        return updateById(id, authentication, request);
    }

    @GetMapping("/me/likes")
    public List<SongResponse> myLikes(Authentication authentication) {
        if (likeService == null) {
            return List.of();
        }
        Long userId = SecurityUtils.getUserId(authentication, userRepository);
        return likeService.myLikes(userId);
    }

    @GetMapping("/me/playlists")
    public List<PlaylistResponse> myPlaylists(Authentication authentication) {
        if (playlistService == null) {
            return List.of();
        }
        Long userId = SecurityUtils.getUserId(authentication, userRepository);
        return playlistService.myPlaylists(userId);
    }

    @GetMapping("/{id:[0-9]+}/playlists")
    public List<PlaylistResponse> userPlaylists(@PathVariable Long id) {
        if (playlistService == null) {
            return List.of();
        }
        return playlistService.myPlaylists(id);
    }

    @GetMapping("/{id:[0-9]+}")
    public UserResponse getById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id " + id));
        return UserResponse.from(user);
    }

    @GetMapping
    public List<UserResponse> listUsers(@RequestParam(required = false) String search) {
        if (search == null || search.isBlank()) {
            return userRepository.findAll().stream().map(UserResponse::from).toList();
        }
        String q = search.trim().toLowerCase();
        return userRepository.findAll().stream()
                .filter(u -> (u.getName() != null && u.getName().toLowerCase().contains(q))
                        || (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)))
                .map(UserResponse::from)
                .toList();
    }
}
