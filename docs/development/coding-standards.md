# Engineering Standards & Coding Guidelines

## 1. Backend Java & Spring Guidelines

1. **Package by Feature:**
   - Group related entities, repositories, services, controllers, and DTOs within the domain package `com.rohilla.crm.<domain>`.
2. **DTO & Domain Boundary:**
   - Never expose raw JPA entities in controller response signatures. Always return domain DTOs wrapped in `ApiResponse<T>`.
3. **Immutability & Lombok:**
   - Use `@Builder`, `@Getter`, `@RequiredArgsConstructor` for services. Avoid `@Data` on JPA entities to prevent recursion in `hashCode`/`equals`.
4. **Transaction Management:**
   - Annotate service mutation methods with `@Transactional`.
   - Annotate read-only queries with `@Transactional(readOnly = true)`.
5. **Exception Handling:**
   - Throw specialized runtime exceptions (`ResourceNotFoundException`, `InvalidRequestException`, `InvalidStateTransitionException`, `UnauthorizedActionException`).
   - Let `GlobalExceptionHandler` translate exceptions into structured `ApiResponse<T>`.

---

## 2. Frontend React & TypeScript Guidelines

1. **Feature Directory Cohesion:**
   - Place domain components in `src/features/<feature-name>/`.
   - Place reusable UI widgets in `src/shared/components/`.
2. **Strict Typing:**
   - Avoid `any`. Mirror all backend DTOs with TypeScript interfaces in `src/shared/types/index.ts`.
3. **API Client Isolation:**
   - Group network requests by domain in `src/services/api/<feature>Api.ts`.
   - All network calls must handle loading, error, and success state gracefully.
4. **CSS & Styling:**
   - Use CSS Modules or component-scoped CSS stylesheets. Do not introduce ad-hoc utility classes.
