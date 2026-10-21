package com.vayam.music.controller;

import com.vayam.music.dto.UserResponse;
import com.vayam.music.model.User;
import com.vayam.music.repository.UserRepository;
import com.vayam.music.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        Long userId = SecurityUtils.getUserId(authentication, userRepository);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return UserResponse.from(user);
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
