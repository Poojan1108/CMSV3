# CMS_V2 System Constitution & Engineering Guidelines

> **Document Version:** 1.0  
> **Status:** Active / Inviolable  
> **Target System:** Complaint Management System V2 (`CMS_V2`)  
> **Scope:** Core operational constraints, agentic development protocols, and architectural guardrails.

---

## 1. Core Architectural Pillars

1. **Multi-Tenant Client-Side Architecture:**  
   - Frontend: React 18 + Vite (SPA)
   - Backend-as-a-Service: Supabase (PostgreSQL + PostgREST + Realtime WebSockets + Storage)
   - Tenancy Model: Shared schema with multi-tenant row isolation (`organization_key` / `org_id`).

2. **Strict Three-Tier Role-Based Access Control (RBAC):**
   - **Complainant (`student` / Resident / Employee):** Can lodge tickets, track status, view public comments, upload evidence, and accept/reject resolutions.
   - **Staff / Resolver (`staff` / Technician / Facility Manager):** Can view department queue, auto-assign upon investigation, propose resolutions, and post private internal notes.
   - **Administrator (`admin` / Dean / Secretary):** Can view analytics/KPIs, reassign tickets, override statuses, configure SLA targets and organization taxonomy, and manage member roles.

3. **Zero Breaking Changes Principle:**  
   - Any refactoring must preserve current user-facing functionality, UI aesthetics, routing paths, and database compatibility. Never introduce regressions to existing working flows.

---

## 2. Inviolable Agentic Engineering Rules

1. **Explicit Permission Protocol:**  
   - The AI agent MUST NOT create, edit, or delete any file, folder, directory listing, or implementation plan without asking the user for explicit permission first.

2. **External Markdown Memory (Anti-Hallucination):**  
   - The agent MUST NEVER guess, infer, or hallucinate database columns, API routes, or component contracts. All implementations must reference `.context/` specification documents.
   - Keep context bite-sized: When working on a single module, load only the relevant module spec to protect the context window.

3. **Always Use Trusted Open-Source & GitHub Starter Blueprints:**  
   - The agent MUST NOT write custom reinvented code from scratch when trusted, battle-tested open-source libraries or patterns exist (e.g. TanStack Query for server state, Zod for validation, React Hook Form for complex forms).

4. **Live Web & GitHub Research Requirement:**  
   - The agent MUST ALWAYS search the live web and GitHub to gather and compare real open-source architectures before making or recommending technical choices.

5. **In-Place Refactoring & Dead Code Elimination:**  
   - Refactor code in-place rather than appending duplicate helper functions or monkey patches.
   - Actively eliminate dead code, orphaned exports, and mock fallbacks during refactoring to prevent codebase rot.

6. **Iterative Verification & Burp / Postman Testing Cycle:**  
   - Propose exact Postman/Burp requests for network tests.
   - Perform comprehensive audits across technical, security/RBAC, data integrity, and architectural standards.
   - Guide re-verification before advancing to subsequent tasks.

7. **Exact File & Line Citations:**  
   - When auditing, reviewing, or diagnosing code, ALWAYS cite exact file paths and line numbers formatted with markdown links: `[Filename.jsx:123](file:///path/to/file#L123)`.

8. **Room-to-Optimize Audit Mandate:**  
   - In every network and code audit, even when requests return `200/201 OK`, actively inspect for optimization room (redundant roundtrips, payload bloat, eager vs lazy fetching, cache hit rates).
