package com.rohilla.crm.enquiry.controller;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.enquiry.dto.EnquiryCreateRequest;
import com.rohilla.crm.enquiry.dto.EnquiryResponseDto;
import com.rohilla.crm.enquiry.dto.ServiceCatalogDto;
import com.rohilla.crm.enquiry.enums.EnquiryStatus;
import com.rohilla.crm.enquiry.service.EnquiryService;
import com.rohilla.crm.enquiry.service.ServiceCatalogService;
import com.rohilla.crm.project.dto.ProjectResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/enquiries")
@RequiredArgsConstructor
public class EnquiryController {

    private final EnquiryService enquiryService;
    private final ServiceCatalogService serviceCatalogService;

    @PostMapping
    public ResponseEntity<ApiResponse<EnquiryResponseDto>> createEnquiry(
            @Valid @RequestBody EnquiryCreateRequest request) {
        EnquiryResponseDto response = enquiryService.createOrSaveEnquiry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Client enquiry recorded successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EnquiryResponseDto>>> getAllEnquiries(
            @RequestParam(required = false) EnquiryStatus status,
            @RequestParam(required = false) String search) {
        List<EnquiryResponseDto> response = enquiryService.getAllEnquiries(status, search);
        return ResponseEntity.ok(ApiResponse.success(response, "Enquiries retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EnquiryResponseDto>> getEnquiryById(@PathVariable UUID id) {
        EnquiryResponseDto response = enquiryService.getEnquiryById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Enquiry details retrieved"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EnquiryResponseDto>> updateEnquiry(
            @PathVariable UUID id,
            @Valid @RequestBody EnquiryCreateRequest request) {
        EnquiryResponseDto response = enquiryService.updateEnquiry(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Enquiry updated successfully"));
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectResponseDto>> convertToProject(@PathVariable UUID id) {
        ProjectResponseDto response = enquiryService.convertEnquiryToProject(id, null);
        return ResponseEntity.ok(ApiResponse.success(response, "Enquiry converted to project " + response.getProjectCode()));
    }

    @GetMapping("/catalog")
    public ResponseEntity<ApiResponse<List<ServiceCatalogDto>>> getServiceCatalog() {
        List<ServiceCatalogDto> catalog = serviceCatalogService.getAllServices();
        return ResponseEntity.ok(ApiResponse.success(catalog, "Service catalog retrieved"));
    }

    @PostMapping("/catalog/material")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> addMaterialOption(@RequestBody Map<String, String> payload) {
        String serviceName = payload.get("serviceName");
        String materialName = payload.get("materialName");
        if (serviceName != null && materialName != null) {
            serviceCatalogService.addMaterialToService(serviceName.trim(), materialName.trim());
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Material added to service catalog"));
    }
}
