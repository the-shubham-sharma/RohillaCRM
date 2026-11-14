package com.rohilla.crm.inventory.service;

import com.rohilla.crm.audit.enums.AuditAction;
import com.rohilla.crm.audit.service.AuditService;
import com.rohilla.crm.employee.dto.UserSummaryDto;
import com.rohilla.crm.auth.service.AuthService;
import com.rohilla.crm.common.exception.InvalidRequestException;
import com.rohilla.crm.common.exception.ResourceNotFoundException;
import com.rohilla.crm.common.exception.UnauthorizedActionException;
import com.rohilla.crm.employee.entity.User;
import com.rohilla.crm.employee.repository.UserRepository;
import com.rohilla.crm.inventory.dto.*;
import com.rohilla.crm.inventory.entity.InventoryItem;
import com.rohilla.crm.inventory.entity.ProjectMaterialRequirement;
import com.rohilla.crm.inventory.entity.StockTransaction;
import com.rohilla.crm.inventory.enums.RequirementStatus;
import com.rohilla.crm.inventory.enums.StockTransactionType;
import com.rohilla.crm.inventory.repository.InventoryItemRepository;
import com.rohilla.crm.inventory.repository.ProjectMaterialRequirementRepository;
import com.rohilla.crm.inventory.repository.StockTransactionRepository;
import com.rohilla.crm.project.entity.Project;
import com.rohilla.crm.project.repository.ProjectRepository;
import com.rohilla.crm.security.authentication.CustomUserDetails;
import com.rohilla.crm.security.authorization.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Year;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final ProjectMaterialRequirementRepository requirementRepository;
    private final StockTransactionRepository transactionRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AuditService auditService;

    private static final AtomicLong TRANSACTION_SEQUENCE = new AtomicLong(100);

    @Transactional(readOnly = true)
    public List<InventoryItemDto> getAllItems(String query, String category, Boolean lowStock) {
        List<InventoryItem> items;
        if (Boolean.TRUE.equals(lowStock)) {
            items = inventoryItemRepository.findLowStockItems();
        } else if (query != null && !query.isBlank()) {
            items = inventoryItemRepository.searchItems(query.trim());
        } else if (category != null && !category.isBlank()) {
            items = inventoryItemRepository.findByCategoryOrderByNameAsc(category.trim());
        } else {
            items = inventoryItemRepository.findAllByOrderByCategoryAscNameAsc();
        }
        return items.stream().map(this::mapItemToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InventoryItemDto getItemById(UUID id) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found: " + id));
        return mapItemToDto(item);
    }

    @Transactional
    public InventoryItemDto createItem(CreateInventoryItemRequest request) {
        if (inventoryItemRepository.existsByItemCode(request.getItemCode().trim())) {
            throw new InvalidRequestException("Inventory item code already exists: " + request.getItemCode());
        }

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BigDecimal initialStock = request.getInitialStock() != null ? request.getInitialStock() : BigDecimal.ZERO;

        InventoryItem item = InventoryItem.builder()
                .itemCode(request.getItemCode().trim().toUpperCase())
                .name(request.getName().trim())
                .category(request.getCategory().trim())
                .unit(request.getUnit().trim())
                .currentStock(initialStock)
                .reservedStock(BigDecimal.ZERO)
                .reorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : new BigDecimal("10.00"))
                .unitCost(request.getUnitCost())
                .location(request.getLocation() != null ? request.getLocation().trim() : null)
                .notes(request.getNotes())
                .build();

        InventoryItem saved = inventoryItemRepository.save(item);

        if (initialStock.compareTo(BigDecimal.ZERO) > 0) {
            recordTransactionInternal(
                    saved,
                    StockTransactionType.OPENING_BALANCE,
                    initialStock,
                    BigDecimal.ZERO,
                    initialStock,
                    null,
                    null,
                    user,
                    "Initial stock recorded on creation"
            );
        }

        return mapItemToDto(saved);
    }

    @Transactional
    public InventoryItemDto updateItem(UUID id, UpdateInventoryItemRequest request) {
        InventoryItem item = inventoryItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found: " + id));

        if (request.getName() != null) item.setName(request.getName().trim());
        if (request.getCategory() != null) item.setCategory(request.getCategory().trim());
        if (request.getUnit() != null) item.setUnit(request.getUnit().trim());
        if (request.getReorderLevel() != null) item.setReorderLevel(request.getReorderLevel());
        if (request.getUnitCost() != null) item.setUnitCost(request.getUnitCost());
        if (request.getLocation() != null) item.setLocation(request.getLocation().trim());
        if (request.getNotes() != null) item.setNotes(request.getNotes());

        InventoryItem saved = inventoryItemRepository.save(item);
        return mapItemToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ProjectMaterialRequirementDto> getProjectRequirements(UUID projectId) {
        List<ProjectMaterialRequirement> reqs = requirementRepository.findByProjectId(projectId);
        return reqs.stream().map(this::mapRequirementToDto).collect(Collectors.toList());
    }

    @Transactional
    public ProjectMaterialRequirementDto reserveStock(UUID projectId, StockReserveRequest request) {
        ProjectMaterialRequirement req = requirementRepository.findById(request.getRequirementId())
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found: " + request.getRequirementId()));

        if (!req.getProject().getId().equals(projectId)) {
            throw new InvalidRequestException("Requirement does not belong to project " + projectId);
        }

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        InventoryItem item = req.getInventoryItem();
        if (request.getInventoryItemId() != null) {
            item = inventoryItemRepository.findById(request.getInventoryItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
            req.setInventoryItem(item);
        }

        if (item == null) {
            throw new InvalidRequestException("No matching inventory item linked to requirement: " + req.getMaterialName());
        }

        BigDecimal qtyToReserve = request.getQuantity();
        BigDecimal available = item.getAvailableStock();
        if (qtyToReserve.compareTo(available) > 0) {
            throw new InvalidRequestException(String.format("Insufficient stock for %s. Requested reservation: %s, Available: %s %s",
                    item.getName(), qtyToReserve, available, item.getUnit()));
        }

        BigDecimal balanceBefore = item.getCurrentStock();
        item.setReservedStock(item.getReservedStock().add(qtyToReserve));
        inventoryItemRepository.save(item);

        req.setReservedQuantity(req.getReservedQuantity().add(qtyToReserve));
        if (req.getReservedQuantity().compareTo(req.getRequiredQuantity()) >= 0) {
            req.setStatus(RequirementStatus.RESERVED);
        }
        if (request.getNotes() != null) {
            req.setNotes(request.getNotes());
        }
        ProjectMaterialRequirement savedReq = requirementRepository.save(req);

        recordTransactionInternal(
                item,
                StockTransactionType.RESERVATION,
                qtyToReserve,
                balanceBefore,
                item.getCurrentStock(),
                req.getProject(),
                null,
                user,
                "Stock reserved for project " + req.getProject().getProjectCode() + ": " + (request.getNotes() != null ? request.getNotes() : "")
        );

        return mapRequirementToDto(savedReq);
    }

    @Transactional
    public ProjectMaterialRequirementDto issueStock(UUID projectId, StockIssueRequest request) {
        ProjectMaterialRequirement req = requirementRepository.findById(request.getRequirementId())
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found: " + request.getRequirementId()));

        if (!req.getProject().getId().equals(projectId)) {
            throw new InvalidRequestException("Requirement does not belong to project " + projectId);
        }

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        InventoryItem item = req.getInventoryItem();
        if (item == null) {
            throw new InvalidRequestException("Cannot issue untracked stock for requirement " + req.getMaterialName() + ". Please link an inventory item.");
        }

        BigDecimal qtyToIssue = request.getQuantity();
        if (qtyToIssue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidRequestException("Quantity to issue must be greater than zero");
        }

        if (qtyToIssue.compareTo(item.getCurrentStock()) > 0) {
            throw new InvalidRequestException(String.format("Cannot issue %s %s: only %s %s available in physical stock.",
                    qtyToIssue, item.getUnit(), item.getCurrentStock(), item.getUnit()));
        }

        BigDecimal balanceBefore = item.getCurrentStock();
        BigDecimal balanceAfter = balanceBefore.subtract(qtyToIssue);
        item.setCurrentStock(balanceAfter);

        // Adjust reserved stock if previously reserved
        BigDecimal unreserve = qtyToIssue.min(item.getReservedStock());
        item.setReservedStock(item.getReservedStock().subtract(unreserve));
        inventoryItemRepository.save(item);

        req.setIssuedQuantity(req.getIssuedQuantity().add(qtyToIssue));
        req.setReservedQuantity(req.getReservedQuantity().subtract(unreserve).max(BigDecimal.ZERO));

        if (req.getIssuedQuantity().compareTo(req.getRequiredQuantity()) >= 0) {
            req.setStatus(RequirementStatus.FULLY_ISSUED);
        } else {
            req.setStatus(RequirementStatus.PARTIALLY_ISSUED);
        }
        ProjectMaterialRequirement savedReq = requirementRepository.save(req);

        recordTransactionInternal(
                item,
                StockTransactionType.MATERIAL_ISSUE,
                qtyToIssue.negate(),
                balanceBefore,
                balanceAfter,
                req.getProject(),
                null,
                user,
                "Material issued for project " + req.getProject().getProjectCode() + ". " + (request.getNotes() != null ? request.getNotes() : "")
        );

        log.info("Authorized stock issue completed: {} {} of {} for project {} by {}",
                qtyToIssue, item.getUnit(), item.getName(), req.getProject().getProjectCode(), user.getEmail());

        return mapRequirementToDto(savedReq);
    }

    @Transactional
    public StockTransactionDto recordTransaction(StockTransactionRequest request) {
        InventoryItem item = inventoryItemRepository.findById(request.getInventoryItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found: " + request.getInventoryItemId()));

        CustomUserDetails currentUser = SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new UnauthorizedActionException("Authentication required"));
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Project project = request.getProjectId() != null ? projectRepository.findById(request.getProjectId()).orElse(null) : null;

        BigDecimal qty = request.getQuantity();
        BigDecimal balanceBefore = item.getCurrentStock();
        BigDecimal balanceAfter = balanceBefore;

        switch (request.getTransactionType()) {
            case PURCHASE_RECEIPT, RETURN_TO_STOCK -> {
                balanceAfter = balanceBefore.add(qty.abs());
                item.setCurrentStock(balanceAfter);
            }
            case MATERIAL_ISSUE, WASTAGE, DAMAGE -> {
                if (qty.abs().compareTo(balanceBefore) > 0) {
                    throw new InvalidRequestException("Cannot deduct " + qty.abs() + " from stock of " + balanceBefore);
                }
                balanceAfter = balanceBefore.subtract(qty.abs());
                item.setCurrentStock(balanceAfter);
            }
            case ADJUSTMENT -> {
                balanceAfter = qty; // Direct adjustment to new count
                item.setCurrentStock(balanceAfter);
            }
            default -> {}
        }

        inventoryItemRepository.save(item);

        StockTransaction txn = recordTransactionInternal(
                item,
                request.getTransactionType(),
                request.getTransactionType() == StockTransactionType.MATERIAL_ISSUE ||
                request.getTransactionType() == StockTransactionType.WASTAGE ||
                request.getTransactionType() == StockTransactionType.DAMAGE ? qty.abs().negate() : qty.abs(),
                balanceBefore,
                balanceAfter,
                project,
                null,
                user,
                request.getReason()
        );

        return mapTransactionToDto(txn);
    }

    @Transactional(readOnly = true)
    public List<StockTransactionDto> getAllTransactions() {
        return transactionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapTransactionToDto)
                .collect(Collectors.toList());
    }

    private StockTransaction recordTransactionInternal(
            InventoryItem item,
            StockTransactionType type,
            BigDecimal qty,
            BigDecimal balanceBefore,
            BigDecimal balanceAfter,
            Project project,
            com.rohilla.crm.enquiry.entity.Enquiry enquiry,
            User performedBy,
            String reason
    ) {
        String code = generateUniqueTransactionCode();
        StockTransaction txn = StockTransaction.builder()
                .transactionCode(code)
                .inventoryItem(item)
                .transactionType(type)
                .quantity(qty)
                .unit(item.getUnit())
                .balanceBefore(balanceBefore)
                .balanceAfter(balanceAfter)
                .project(project)
                .enquiry(enquiry)
                .performedBy(performedBy)
                .reason(reason)
                .build();

        return transactionRepository.save(txn);
    }

    private synchronized String generateUniqueTransactionCode() {
        int year = Year.now().getValue();
        long seq = TRANSACTION_SEQUENCE.incrementAndGet();
        return String.format("STX-%d-%04d", year, seq);
    }

    public InventoryItemDto mapItemToDto(InventoryItem item) {
        boolean isLow = item.getCurrentStock().compareTo(item.getReorderLevel()) <= 0;
        return InventoryItemDto.builder()
                .id(item.getId())
                .itemCode(item.getItemCode())
                .name(item.getName())
                .category(item.getCategory())
                .unit(item.getUnit())
                .currentStock(item.getCurrentStock())
                .reservedStock(item.getReservedStock())
                .availableStock(item.getAvailableStock())
                .reorderLevel(item.getReorderLevel())
                .unitCost(item.getUnitCost())
                .location(item.getLocation())
                .notes(item.getNotes())
                .lowStock(isLow)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    public ProjectMaterialRequirementDto mapRequirementToDto(ProjectMaterialRequirement req) {
        BigDecimal avail = req.getInventoryItem() != null ? req.getInventoryItem().getAvailableStock() : BigDecimal.ZERO;
        return ProjectMaterialRequirementDto.builder()
                .id(req.getId())
                .projectId(req.getProject().getId())
                .inventoryItemId(req.getInventoryItem() != null ? req.getInventoryItem().getId() : null)
                .itemCode(req.getInventoryItem() != null ? req.getInventoryItem().getItemCode() : null)
                .materialName(req.getMaterialName())
                .serviceName(req.getServiceName())
                .requiredQuantity(req.getRequiredQuantity())
                .unit(req.getUnit())
                .reservedQuantity(req.getReservedQuantity())
                .issuedQuantity(req.getIssuedQuantity())
                .availableInStock(avail)
                .status(req.getStatus())
                .notes(req.getNotes())
                .build();
    }

    public StockTransactionDto mapTransactionToDto(StockTransaction t) {
        UserSummaryDto userDto = t.getPerformedBy() != null ? authService.mapToUserSummary(t.getPerformedBy()) : null;
        return StockTransactionDto.builder()
                .id(t.getId())
                .transactionCode(t.getTransactionCode())
                .inventoryItemId(t.getInventoryItem().getId())
                .itemCode(t.getInventoryItem().getItemCode())
                .itemName(t.getInventoryItem().getName())
                .transactionType(t.getTransactionType())
                .quantity(t.getQuantity())
                .unit(t.getUnit())
                .balanceBefore(t.getBalanceBefore())
                .balanceAfter(t.getBalanceAfter())
                .projectId(t.getProject() != null ? t.getProject().getId() : null)
                .projectCode(t.getProject() != null ? t.getProject().getProjectCode() : null)
                .enquiryId(t.getEnquiry() != null ? t.getEnquiry().getId() : null)
                .enquiryNumber(t.getEnquiry() != null ? t.getEnquiry().getEnquiryNumber() : null)
                .performedBy(userDto)
                .reason(t.getReason())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
