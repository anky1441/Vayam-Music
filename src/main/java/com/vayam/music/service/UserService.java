package com.vayam.music.service;

import com.vayam.music.model.User;
import com.vayam.music.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    }
}
