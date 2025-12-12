package com.rexxy.stream.dto;

import com.rexxy.stream.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {
    private String id;
    private String email;
    private String name;
    private String profilePicture;
    private String authProvider;
    private Set<User.Role> roles;
    private String createdAt;
}
