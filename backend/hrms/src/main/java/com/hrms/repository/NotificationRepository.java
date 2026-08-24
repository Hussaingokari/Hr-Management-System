package com.hrms.repository;

import com.hrms.entity.Employee;
import com.hrms.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipient(
            Employee recipient,
            Pageable pageable
    );

    Page<Notification> findByRecipientAndIsReadFalse(
            Employee recipient,
            Pageable pageable
    );

    long countByRecipientAndIsReadFalse(
            Employee recipient
    );

    @Modifying
    @Query("""
            UPDATE Notification n
            SET n.isRead = true
            WHERE n.recipient = :recipient
            AND n.isRead = false
            """)
    int markAllAsReadByRecipient(
            @Param("recipient") Employee recipient
    );

    /*
     * Delete all notifications belonging
     * only to the logged-in employee.
     */
    @Modifying
    void deleteByRecipient(Employee recipient);
}