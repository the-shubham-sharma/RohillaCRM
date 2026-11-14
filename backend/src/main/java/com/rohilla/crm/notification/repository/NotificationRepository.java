package com.rohilla.crm.notification.repository;

import com.rohilla.crm.notification.entity.Notification;
import com.rohilla.crm.employee.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findAllByRecipientOrderByCreatedAtDesc(User recipient);
    List<Notification> findAllByRecipientAndIsReadFalseOrderByCreatedAtDesc(User recipient);
    long countByRecipientAndIsReadFalse(User recipient);
}
