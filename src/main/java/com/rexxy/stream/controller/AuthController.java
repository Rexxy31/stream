package com.rexxy.stream.controller;

import com.rexxy.stream.dto.AuthRequest;
import com.rexxy.stream.dto.AuthResponse;
import com.rexxy.stream.dto.UserDTO;
import com.rexxy.stream.model.User;
import com.rexxy.stream.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Register a new user with email and password
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Login with email and password
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get current authenticated user's profile
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserDTO dto = authService.getCurrentUser(user);
        return ResponseEntity.ok(dto);
    }

    /**
     * OAuth2 success endpoint - returns the JWT token after Google login
     */
    @GetMapping("/oauth2/success")
    public ResponseEntity<Map<String, String>> oauth2Success(@RequestParam String token) {
        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "Login successful! Use this token in the Authorization header."));
    }

    /**
     * Check if email is already registered
     */
    @GetMapping("/check-email")
    public ResponseEntity<Map<String, Boolean>> checkEmail(@RequestParam String email) {
        // This will be implemented in AuthService
        return ResponseEntity.ok(Map.of("exists", false));
    }
}
