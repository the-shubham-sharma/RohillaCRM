package com.rohilla.crm.client.entity;

import com.rohilla.crm.common.util.PhoneUtils;

import com.rohilla.crm.common.util.PhoneUtils;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "clients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 150)
    private String companyName;

    @Column(length = 100)
    private String contactPerson;

    @Column(length = 150)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(length = 50)
    private String gstNumber;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "client_custom_fields", joinColumns = @JoinColumn(name = "client_id"))
    @MapKeyColumn(name = "field_name")
    @Column(name = "field_value", columnDefinition = "TEXT")
    @Builder.Default
    private Map<String, String> customFields = new LinkedHashMap<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * Helper to return normalized WhatsApp international phone number (+919810001111)
     */
    public String getNormalizedWhatsAppPhone() {
        return PhoneUtils.toWhatsAppFormat(this.phone);
    }
}

