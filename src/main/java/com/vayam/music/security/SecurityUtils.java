package com.vayam.music.security;

import com.vayam.music.model.User;
import com.vayam.music.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Long getUserId(Authentication authentication, UserRepository userRepository) {
        Long userId = getUserIdOrNull(authentication, userRepository);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }
        return userId;
    }

    public static Long getUserIdOrNull(Authentication authentication, UserRepository userRepository) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }

        Object details = authentication.getDetails();
        if (details instanceof Number number) {
            return number.longValue();
        } else if (details instanceof String s && !s.isBlank()) {
            try {
                return Long.parseLong(s.trim());
            } catch (NumberFormatException ignored) {
            }
        }

        String principalName = authentication.getName();
        if (principalName != null && !principalName.isBlank() && !"anonymousUser".equalsIgnoreCase(principalName)) {
            if (userRepository != null) {
                Optional<User> userOpt = userRepository.findByEmailIgnoreCase(principalName);
                if (userOpt.isPresent()) {
                    return userOpt.get().getId();
                }
            }
        }

        return null;
    }
}
