package com.rohilla.crm.dispatch.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordInstallationRequest {
    private LocalDate installationDate;
    private String installationNotes;
}
