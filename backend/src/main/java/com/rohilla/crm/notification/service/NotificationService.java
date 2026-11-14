package com.rohilla.crm.notification.service;

import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;

import com.rohilla.crm.notification.entity.Notification;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.notification.dto.NotificationDto;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.notification.repository.NotificationRepository;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void sendNotification(User recipient, String title, String message, String linkUrl) {
        if (recipient == null) return;

        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .message(message)
                .linkUrl(linkUrl)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.info("Notification sent to {}: {}", recipient.getEmail(), title);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getCurrentUserNotifications() {
        User currentUser = getCurrentUserEntity();
        return notificationRepository.findAllByRecipientOrderByCreatedAtDesc(currentUser).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User currentUser = getCurrentUserEntity();
        return notificationRepository.countByRecipientAndIsReadFalse(currentUser);
    }

    @Transactional
    public NotificationDto markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        User currentUser = getCurrentUserEntity();

        // Enforce user-scoped authorization
        if (!notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new UnauthorizedActionException("Access denied: You cannot access notifications of another user.");
        }

        notification.setRead(true);
        return mapToDto(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUserEntity();
        List<Notification> unread = notificationRepository.findAllByRecipientAndIsReadFalseOrderByCreatedAtDesc(currentUser);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    private User getCurrentUserEntity() {
        CustomUserDetails userDetails = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getId()));
    }

    private NotificationDto mapToDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .linkUrl(n.getLinkUrl())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
