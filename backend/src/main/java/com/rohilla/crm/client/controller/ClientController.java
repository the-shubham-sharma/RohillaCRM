package com.rohilla.crm.client.controller;

import com.rohilla.crm.client.dto.UpdateClientRequest;
import com.rohilla.crm.client.entity.Client;
import com.rohilla.crm.project.entity.Project;

import com.rohilla.crm.common.response.ApiResponse;
import com.rohilla.crm.client.dto.ClientDto;
import com.rohilla.crm.client.dto.CreateClientRequest;
import com.rohilla.crm.client.service.ClientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ClientDto>>> getAllClients() {
        List<ClientDto> clients = clientService.getAllClients();
        return ResponseEntity.ok(ApiResponse.success(clients));
    }

    @GetMapping("/{clientId}")
    public ResponseEntity<ApiResponse<ClientDto>> getClientById(@PathVariable UUID clientId) {
        ClientDto client = clientService.getClientById(clientId);
        return ResponseEntity.ok(ApiResponse.success(client));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER') or hasAuthority('project:create')")
    public ResponseEntity<ApiResponse<ClientDto>> createClient(
            @Valid @RequestBody CreateClientRequest request) {
        ClientDto created = clientService.createClient(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Client created successfully"));
    }

    @PutMapping("/{clientId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_MANAGER')")
    public ResponseEntity<ApiResponse<ClientDto>> updateClient(
            @PathVariable UUID clientId,
            @Valid @RequestBody com.rohilla.crm.client.dto.UpdateClientRequest request) {
        ClientDto updated = clientService.updateClient(clientId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Client details updated successfully"));
    }
}

