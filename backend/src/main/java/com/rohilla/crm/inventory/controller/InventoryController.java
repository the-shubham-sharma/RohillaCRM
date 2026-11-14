package com.rohilla.crm.inventory.controller;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.inventory.dto.*;
import com.rohilla.crm.inventory.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<InventoryItemDto>>> getAllItems(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean lowStock) {
        List<InventoryItemDto> response = inventoryService.getAllItems(search, category, lowStock);
        return ResponseEntity.ok(ApiResponse.success(response, "Inventory items retrieved"));
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<ApiResponse<InventoryItemDto>> getItemById(@PathVariable UUID id) {
        InventoryItemDto response = inventoryService.getItemById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Inventory item retrieved"));
    }

    @PostMapping("/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryItemDto>> createItem(
            @Valid @RequestBody CreateInventoryItemRequest request) {
        InventoryItemDto response = inventoryService.createItem(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Inventory item created successfully"));
    }

    @PutMapping("/items/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryItemDto>> updateItem(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInventoryItemRequest request) {
        InventoryItemDto response = inventoryService.updateItem(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Inventory item updated successfully"));
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<ApiResponse<List<ProjectMaterialRequirementDto>>> getProjectRequirements(
            @PathVariable UUID projectId) {
        List<ProjectMaterialRequirementDto> response = inventoryService.getProjectRequirements(projectId);
        return ResponseEntity.ok(ApiResponse.success(response, "Project material requirements retrieved"));
    }

    @PostMapping("/projects/{projectId}/reserve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProjectMaterialRequirementDto>> reserveStock(
            @PathVariable UUID projectId,
            @Valid @RequestBody StockReserveRequest request) {
        ProjectMaterialRequirementDto response = inventoryService.reserveStock(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Stock reserved successfully"));
    }

    @PostMapping("/projects/{projectId}/issue")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<ProjectMaterialRequirementDto>> issueStock(
            @PathVariable UUID projectId,
            @Valid @RequestBody StockIssueRequest request) {
        ProjectMaterialRequirementDto response = inventoryService.issueStock(projectId, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Stock issued and deducted successfully"));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<StockTransactionDto>>> getAllTransactions() {
        List<StockTransactionDto> response = inventoryService.getAllTransactions();
        return ResponseEntity.ok(ApiResponse.success(response, "Stock transactions retrieved"));
    }

    @PostMapping("/transactions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PRODUCTION')")
    public ResponseEntity<ApiResponse<StockTransactionDto>> recordTransaction(
            @Valid @RequestBody StockTransactionRequest request) {
        StockTransactionDto response = inventoryService.recordTransaction(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Stock transaction recorded successfully"));
    }
}
