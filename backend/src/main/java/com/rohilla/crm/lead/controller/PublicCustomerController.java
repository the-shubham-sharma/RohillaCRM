package com.rohilla.crm.lead.controller;

import com.rohilla.crm.lead.entity.Lead;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.lead.dto.CustomerEnquiryRequest;
import com.rohilla.crm.lead.dto.LeadResponseDto;
import com.rohilla.crm.file.service.FileStorageService;
import com.rohilla.crm.lead.service.LeadService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
public class PublicCustomerController {

    private final LeadService leadService;
    private final FileStorageService fileStorageService;

    // --- Public Customer Enquiry ---

    @PostMapping("/leads")
    public ResponseEntity<ApiResponse<LeadResponseDto>> submitEnquiry(@Valid @RequestBody CustomerEnquiryRequest request) {
        log.info("Received public quote enquiry from: {} ({})", request.getName(), request.getPhone());
        LeadResponseDto response = leadService.submitEnquiry(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Your quote request has been submitted successfully. Reference Code: " + response.getLeadCode()));
    }

    @PostMapping(value = "/leads/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadCustomerArtwork(@RequestParam("file") MultipartFile file) {
        log.info("Customer uploaded artwork file: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
        String storageKey = fileStorageService.storePublicCustomerFile(file);

        Map<String, String> data = new HashMap<>();
        data.put("storageKey", storageKey);
        data.put("originalFileName", file.getOriginalFilename());
        data.put("fileSize", String.valueOf(file.getSize()));

        return ResponseEntity.ok(ApiResponse.success(data, "Artwork uploaded successfully"));
    }
}
