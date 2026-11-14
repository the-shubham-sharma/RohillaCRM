package com.rohilla.crm.security.authentication;

import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.security.entity.Permission;

import com.rohilla.crm.security.entity.Role;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.employee.enums.UserStatus;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;

public class CustomUserDetails implements UserDetails {

    @Getter
    private final UUID id;
    private final String email;
    private final String password;
    @Getter
    private final String fullName;
    private final UserStatus status;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.fullName = user.getFullName();
        this.status = user.getStatus();

        Set<GrantedAuthority> auths = new HashSet<>();
        for (Role role : user.getRoles()) {
            // Add Role Authority (e.g. ROLE_ADMIN)
            auths.add(new SimpleGrantedAuthority(role.getName().name()));
            // Add Permission Authorities (e.g. project:read:all)
            role.getPermissions().forEach(p -> 
                auths.add(new SimpleGrantedAuthority(p.getName()))
            );
        }
        this.authorities = auths;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != UserStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }
}
