package com.rohilla.crm.workspace.controller;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.workspace.dto.DepartmentWorkspaceDto;
import com.rohilla.crm.workspace.dto.HistoryDto;
import com.rohilla.crm.workspace.dto.PerformanceMetricsDto;

import com.rohilla.crm.common.enums.DateRangeFilter;

import com.rohilla.crm.workspace.service.DepartmentWorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/workspace")
@RequiredArgsConstructor
public class WorkspaceController {

    private final DepartmentWorkspaceService workspaceService;

    // ==========================================
    // 1. DEPARTMENT WORKSPACES
    // ==========================================

    @GetMapping("/designer")
    @PreAuthorize("hasAnyRole('ROLE_DESIGNER', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<DepartmentWorkspaceDto>> getDesignerWorkspace() {
        DepartmentWorkspaceDto workspace = workspaceService.getDesignerWorkspace();
        return ResponseEntity.ok(ApiResponse.success(workspace));
    }

    @GetMapping("/production")
    @PreAuthorize("hasAnyRole('ROLE_PRODUCTION', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<DepartmentWorkspaceDto>> getProductionWorkspace() {
        DepartmentWorkspaceDto workspace = workspaceService.getProductionWorkspace();
        return ResponseEntity.ok(ApiResponse.success(workspace));
    }

    @GetMapping("/qc")
    @PreAuthorize("hasAnyRole('ROLE_QC', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<DepartmentWorkspaceDto>> getQcWorkspace() {
        DepartmentWorkspaceDto workspace = workspaceService.getQcWorkspace();
        return ResponseEntity.ok(ApiResponse.success(workspace));
    }

    @GetMapping("/dispatch")
    @PreAuthorize("hasAnyRole('ROLE_DISPATCH', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<DepartmentWorkspaceDto>> getDispatchWorkspace() {
        DepartmentWorkspaceDto workspace = workspaceService.getDispatchWorkspace();
        return ResponseEntity.ok(ApiResponse.success(workspace));
    }

    // ==========================================
    // 2. PERMANENT WORK HISTORY
    // ==========================================

    @GetMapping("/history/designer")
    @PreAuthorize("hasAnyRole('ROLE_DESIGNER', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<HistoryDto.DesignerHistoryDto>>> getDesignerHistory(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") DateRangeFilter period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<HistoryDto.DesignerHistoryDto> history = workspaceService.getDesignerHistory(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/history/production")
    @PreAuthorize("hasAnyRole('ROLE_PRODUCTION', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<HistoryDto.ProductionHistoryDto>>> getProductionHistory(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") DateRangeFilter period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<HistoryDto.ProductionHistoryDto> history = workspaceService.getProductionHistory(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/history/qc")
    @PreAuthorize("hasAnyRole('ROLE_QC', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<HistoryDto.QcHistoryDto>>> getQcHistory(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") DateRangeFilter period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<HistoryDto.QcHistoryDto> history = workspaceService.getQcHistory(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/history/dispatch")
    @PreAuthorize("hasAnyRole('ROLE_DISPATCH', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<List<HistoryDto.DispatchHistoryDto>>> getDispatchHistory(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") DateRangeFilter period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<HistoryDto.DispatchHistoryDto> history = workspaceService.getDispatchHistory(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    // ==========================================
    // 3. DEPARTMENT PERFORMANCE METRICS
    // ==========================================

    @GetMapping("/performance/designer")
    @PreAuthorize("hasAnyRole('ROLE_DESIGNER', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<PerformanceMetricsDto.DesignerPerformanceDto>> getDesignerPerformance(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") DateRangeFilter period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        PerformanceMetricsDto.DesignerPerformanceDto metrics = workspaceService.getDesignerPerformance(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @GetMapping("/performance/production")
    @PreAuthorize("hasAnyRole('ROLE_PRODUCTION', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<PerformanceMetricsDto.ProductionPerformanceDto>> getProductionPerformance(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") DateRangeFilter period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        PerformanceMetricsDto.ProductionPerformanceDto metrics = workspaceService.getProductionPerformance(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @GetMapping("/performance/qc")
    @PreAuthorize("hasAnyRole('ROLE_QC', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<PerformanceMetricsDto.QcPerformanceDto>> getQcPerformance(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") DateRangeFilter period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        PerformanceMetricsDto.QcPerformanceDto metrics = workspaceService.getQcPerformance(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    @GetMapping("/performance/dispatch")
    @PreAuthorize("hasAnyRole('ROLE_DISPATCH', 'ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<PerformanceMetricsDto.DispatchPerformanceDto>> getDispatchPerformance(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") DateRangeFilter period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        PerformanceMetricsDto.DispatchPerformanceDto metrics = workspaceService.getDispatchPerformance(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(metrics));
    }

    // ==========================================
    // 4. MANAGEMENT & EXECUTIVE PERFORMANCE
    // ==========================================

    @GetMapping("/performance/team")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<PerformanceMetricsDto.TeamPerformanceDto>> getTeamPerformance(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") DateRangeFilter period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        PerformanceMetricsDto.TeamPerformanceDto teamMetrics = workspaceService.getTeamPerformance(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(teamMetrics));
    }

    @GetMapping("/performance/company")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<PerformanceMetricsDto.CompanyPerformanceDto>> getCompanyPerformance(
            @RequestParam(required = false, defaultValue = "THIS_MONTH") DateRangeFilter period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        PerformanceMetricsDto.CompanyPerformanceDto companyMetrics = workspaceService.getCompanyPerformance(period, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(companyMetrics));
    }
}
