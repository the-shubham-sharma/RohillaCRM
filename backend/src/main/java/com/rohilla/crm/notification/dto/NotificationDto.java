package com.rohilla.crm.notification.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDto {
    private UUID id;
    private String title;
    private String message;
    private String linkUrl;

    @JsonProperty("isRead")
    private boolean isRead;

    private Instant createdAt;
}
