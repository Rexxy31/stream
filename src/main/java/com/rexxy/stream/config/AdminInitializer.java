package com.rexxy.stream.config;

import com.rexxy.stream.model.User;
import com.rexxy.stream.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashSet;
import java.util.Set;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner initAdmin(UserRepository userRepository) {
        return args -> {
            // Make therealyogism@gmail.com an admin
            userRepository.findByEmail("therealyogism@gmail.com").ifPresent(user -> {
                Set<User.Role> roles = user.getRoles();
                if (roles == null) {
                    roles = new HashSet<>();
                }
                if (!roles.contains(User.Role.ADMIN)) {
                    roles.add(User.Role.USER);
                    roles.add(User.Role.ADMIN);
                    user.setRoles(roles);
                    userRepository.save(user);
                    System.out.println("✅ Made therealyogism@gmail.com an admin!");
                }
            });
        };
    }
}
