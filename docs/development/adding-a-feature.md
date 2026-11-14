# Developer Guide: Adding a New Feature

Follow this step-by-step guide when introducing a new feature module to the Rohilla Advertising CRM.

---

## 1. Backend Implementation Steps

1. **Define the Domain Entity:**
   - Create `com.rohilla.crm.<feature>.entity.<EntityName>.java`.
   - Include auditing base properties (`createdAt`, `updatedAt`).
2. **Create the Repository:**
   - Create `com.rohilla.crm.<feature>.repository.<EntityName>Repository.java` extending `JpaRepository`.
3. **Define Request & Response DTOs:**
   - Create `com.rohilla.crm.<feature>.dto.<EntityName>ResponseDto.java`.
   - Add Jakarta validation annotations (`@NotBlank`, `@NotNull`, `@Min`, `@Max`).
4. **Implement the Service:**
   - Create `com.rohilla.crm.<feature>.service.<Feature>Service.java`.
   - Annotate with `@Service` and `@RequiredArgsConstructor`.
   - Publish audit events via `AuditService.publishAudit(...)` for all state modifications.
5. **Expose the REST Controller:**
   - Create `com.rohilla.crm.<feature>.controller.<Feature>Controller.java`.
   - Protect endpoints with `@PreAuthorize(...)`.
   - Return `ResponseEntity<ApiResponse<T>>`.

---

## 2. Frontend Implementation Steps

1. **Define TypeScript Types:**
   - Add interfaces to `src/shared/types/index.ts`.
2. **Implement API Client:**
   - Create `src/services/api/<feature>Api.ts`.
   - Re-export via `src/services/api/index.ts` and `src/services/apiService.ts`.
3. **Build Feature Components & Views:**
   - Create `src/features/<feature>/<FeaturePage>.tsx` and accompanying CSS.
4. **Register Routes:**
   - Add the route to `src/app/App.tsx` with appropriate role protection.
5. **Update Navigation:**
   - Add menu items to `src/shared/components/Sidebar.tsx`.

---

## 3. Verification & Testing

1. Add unit/integration tests in `backend/src/test/java/com/rohilla/crm/`.
2. Run `mvn test` in `backend`.
3. Run `npm run build` in `frontend`.
4. Verify end-to-end integration via PowerShell test scripts in `scripts/`.
