package com.rexxy.stream.service;

import com.rexxy.stream.dto.AuthRequest;
import com.rexxy.stream.dto.AuthResponse;
import com.rexxy.stream.dto.UserDTO;
import com.rexxy.stream.exception.ResourceNotFoundException;
import com.rexxy.stream.model.User;
import com.rexxy.stream.repository.UserRepository;
import com.rexxy.stream.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public AuthResponse register(AuthRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Create new user
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setAuthProvider(User.AuthProvider.LOCAL);
        user.setRoles(Set.of(User.Role.USER));
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Generate token
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getName());

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getName(),
                savedUser.getProfilePicture());
    }

    public AuthResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        // Check if user registered via OAuth
        if (user.getAuthProvider() != User.AuthProvider.LOCAL) {
            throw new IllegalArgumentException("Please login with " + user.getAuthProvider().name());
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Generate token
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getName());

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getProfilePicture());
    }

    public UserDTO getCurrentUser(User user) {
        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getProfilePicture(),
                user.getAuthProvider().name(),
                user.getRoles(),
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
    }

    public UserDTO getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getProfilePicture(),
                user.getAuthProvider().name(),
                user.getRoles(),
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null);
    }
}
