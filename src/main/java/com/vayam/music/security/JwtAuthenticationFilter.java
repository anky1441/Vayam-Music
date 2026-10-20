package com.vayam.music.security;

import com.vayam.music.model.User;
import com.vayam.music.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            if (!token.isBlank()) {
                try {
                    Claims claims = jwtService.parse(token);
                    String email = claims.getSubject();
                    if (email != null && !email.isBlank()) {
                        User user = userRepository.findByEmailIgnoreCase(email.trim()).orElse(null);

                        if (user != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                            var auth = new UsernamePasswordAuthenticationToken(
                                    user.getEmail(), null,
                                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
                            );
                            auth.setDetails(user.getId());
                            SecurityContextHolder.getContext().setAuthentication(auth);
                        }
                    }
                } catch (Exception ignored) {
                    // Invalid/expired token: request remains unauthenticated.
                }
            }
        }

        filterChain.doFilter(request, response);
    }
}
