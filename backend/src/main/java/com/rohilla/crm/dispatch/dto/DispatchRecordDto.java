package com.rohilla.crm.dispatch.dto;

import com.rohilla.crm.employee.dto.UserSummaryDto;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchRecordDto {
    private UUID id;
    private UUID projectId;
    private LocalDate dispatchDate;
    private String courierPartner;
    private String trackingNumber;
    private String recipientName;
    private String destinationAddress;
    private String podPhotoStorageKey;
    private UserSummaryDto dispatchedBy;
    private String dispatchNotes;
    private Instant createdAt;
}
