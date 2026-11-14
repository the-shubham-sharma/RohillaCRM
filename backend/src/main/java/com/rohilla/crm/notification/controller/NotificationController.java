package com.rohilla.crm.notification.controller;

import com.rohilla.crm.notification.entity.Notification;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.notification.dto.NotificationDto;
import com.rohilla.crm.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMyNotifications() {
        List<NotificationDto> notifications = notificationService.getCurrentUserNotifications();
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<NotificationDto>> markNotificationAsRead(
            @PathVariable UUID notificationId) {
        NotificationDto updated = notificationService.markAsRead(notificationId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Notification marked as read"));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }
}
