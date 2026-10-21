package com.vayam.music.service;

import com.vayam.music.dto.AuthResponse;
import com.vayam.music.model.User;
import com.vayam.music.repository.UserRepository;
import com.vayam.music.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class GoogleAuthService {
    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);
    private static final String GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token={token}";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RestTemplate restTemplate;

    @Value("${google.client-id:}")
    private String googleClientId;

    public GoogleAuthService(UserRepository userRepository,
                             PasswordEncoder passwordEncoder,
                             JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    public String getGoogleClientId() {
        return googleClientId != null ? googleClientId.trim() : "";
    }

    public record GoogleUserInfo(String sub, String email, String name, String picture) {}

    public GoogleUserInfo verifyGoogleToken(String idToken) {
        if (idToken == null || idToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google ID token cannot be empty");
        }

        String trimmedToken = idToken.trim();

        // 1. Support dev / testing mock tokens for local testing without active Google Cloud project
        if (trimmedToken.equals("test-google-token") || trimmedToken.startsWith("dev-mock:")) {
            log.info("Authenticating with dev mock Google token");
            String name = "Google Test User";
            String email = "google.test.user@example.com";
            if (trimmedToken.startsWith("dev-mock:")) {
                String[] parts = trimmedToken.split(":", 3);
                if (parts.length > 1 && !parts[1].isBlank()) name = parts[1].trim();
                if (parts.length > 2 && !parts[2].isBlank()) email = parts[2].trim().toLowerCase();
            }
            return new GoogleUserInfo(
                    "mock-sub-" + Math.abs(email.hashCode()),
                    email,
                    name,
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            );
        }

        // 2. Real Google verification via Google's official tokeninfo endpoint
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(
                    GOOGLE_TOKENINFO_URL,
                    Map.class,
                    trimmedToken
            );

            Map<String, Object> body = response.getBody();
            if (body == null || !response.getStatusCode().is2xxSuccessful()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Failed to verify token with Google");
            }

            // Verify issuer
            String iss = (String) body.get("iss");
            if (iss == null || (!iss.equals("accounts.google.com") && !iss.equals("https://accounts.google.com"))) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google token issuer: " + iss);
            }

            // Verify email verification
            Object emailVerifiedObj = body.get("email_verified");
            boolean emailVerified = "true".equalsIgnoreCase(String.valueOf(emailVerifiedObj));
            if (!emailVerified) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
            }

            // Verify audience if client ID is configured
            String aud = (String) body.get("aud");
            if (googleClientId != null && !googleClientId.isBlank()) {
                if (!googleClientId.trim().equals(aud)) {
                    log.warn("Google token audience [{}] does not match configured client-id [{}]", aud, googleClientId);
                    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token audience mismatch");
                }
            }

            // Verify expiration
            Object expObj = body.get("exp");
            if (expObj != null) {
                try {
                    long expSeconds = Long.parseLong(expObj.toString());
                    long nowSeconds = System.currentTimeMillis() / 1000;
                    if (expSeconds < nowSeconds) {
                        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token has expired");
                    }
                } catch (NumberFormatException ignored) {
                }
            }

            String email = (String) body.get("email");
            if (email == null || email.isBlank()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token does not contain an email");
            }

            String name = (String) body.get("name");
            if (name == null || name.isBlank()) {
                name = email.split("@")[0];
            }

            String sub = (String) body.get("sub");
            String picture = (String) body.get("picture");

            return new GoogleUserInfo(sub, email.toLowerCase().trim(), name, picture);

        } catch (HttpClientErrorException.BadRequest | HttpClientErrorException.Unauthorized e) {
            log.warn("Google token verification rejected: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired Google token");
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error during Google token verification", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error communicating with Google: " + e.getMessage());
        }
    }

    public AuthResponse authenticateGoogleUser(String idToken) {
        GoogleUserInfo googleUser = verifyGoogleToken(idToken);
        String email = googleUser.email();

        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null) {
            log.info("Registering new user via Google Sign-In: {}", email);
            user = new User(
                    googleUser.name(),
                    email,
                    passwordEncoder.encode(UUID.randomUUID().toString()),
                    "GOOGLE",
                    googleUser.picture(),
                    googleUser.sub()
            );
            user = userRepository.save(user);
        } else {
            log.info("User logged in via Google Sign-In: {}", email);
            boolean updated = false;
            if (user.getAvatarUrl() == null && googleUser.picture() != null) {
                user.setAvatarUrl(googleUser.picture());
                updated = true;
            }
            if (user.getGoogleId() == null && googleUser.sub() != null) {
                user.setGoogleId(googleUser.sub());
                updated = true;
            }
            if (user.getProvider() == null || "LOCAL".equals(user.getProvider())) {
                user.setProvider("GOOGLE");
                updated = true;
            }
            if (updated) {
                user = userRepository.save(user);
            }
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAvatarUrl(),
                user.getProvider()
        );
    }
}
