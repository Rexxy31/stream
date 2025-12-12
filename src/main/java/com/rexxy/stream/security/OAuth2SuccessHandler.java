package com.rexxy.stream.security;

import com.rexxy.stream.model.User;
import com.rexxy.stream.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Set;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public OAuth2SuccessHandler(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String providerId = oAuth2User.getAttribute("sub"); // Google's user ID

        // Find or create user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(name);
            newUser.setProfilePicture(picture);
            newUser.setAuthProvider(User.AuthProvider.GOOGLE);
            newUser.setProviderId(providerId);
            newUser.setRoles(Set.of(User.Role.USER));
            newUser.setCreatedAt(LocalDateTime.now());
            return userRepository.save(newUser);
        });

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        if (name != null)
            user.setName(name);
        if (picture != null)
            user.setProfilePicture(picture);
        userRepository.save(user);

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getName());

        // Redirect to frontend with token
        // For API testing, we'll redirect with token as query param
        // In production, use a proper callback URL
        String redirectUrl = "/api/auth/oauth2/success?token=" + token;
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
