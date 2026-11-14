package com.rohilla.crm.dispatch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordDispatchRequest {

    @NotNull(message = "Dispatch date is required")
    private LocalDate dispatchDate;

    @NotBlank(message = "Courier partner is required")
    private String courierPartner;

    @NotBlank(message = "Tracking number is required")
    private String trackingNumber;

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    @NotBlank(message = "Destination address is required")
    private String destinationAddress;

    private String dispatchNotes;
}
