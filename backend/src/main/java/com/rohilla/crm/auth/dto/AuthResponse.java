package com.rohilla.crm.auth.dto;

import com.rohilla.crm.auth.entity.RefreshToken;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.employee.entity.User;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private long expiresInMs;
    private UserSummaryDto user;
}
