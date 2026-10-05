# Workspace Agent Rules

1. **Explicit Permission Before Any File/Plan Creation:** 
   The AI agent MUST NOT create, edit, or delete any file, folder, directory listing, or implementation plan without asking the user for explicit permission first.

2. **Always Use Trusted Open-Source & GitHub Projects:** 
   The AI agent MUST NOT write custom code from scratch when trusted, production-tested open-source libraries, UI components, or GitHub starter architectures exist.

3. **Live Web & GitHub Search Required Before Architectural Decisions:** 
   The AI agent MUST ALWAYS search the live web and GitHub to gather and compare a wide spectrum of real open-source projects before making or recommending technical choices. Never pick arbitrary short-lists.

4. **Discuss Before Manual Code:** 
   If a specific library or component does not exist for a feature, the AI agent MUST first discuss with the user what can be built manually before writing any code.

5. **Refactor In-Place & Eliminate Unwanted Clutter:**
   When fixing logic, replace and refactor existing code in-place rather than appending new duplicate functions or hardcoded patches. Remove dead code, mock fallbacks, and confusing workarounds to preserve architectural clarity and code cleanliness.

6. **Standard Iterative Postman/Burp Testing & Verification Cycle:**
   The AI agent MUST follow a strict sequential cycle for every feature test:
   - Provide the exact Postman/Burp request and guide the user to execute it.
   - When the user provides the response, conduct a comprehensive deep-dive analysis across technical, security/RBAC, data integrity, architectural, and standards perspectives.
   - Propose in-place refactoring and obtain explicit permission before modifying any code.
   - Apply the refactor in-place and eliminate dead code or workarounds.
   - Guide the user to re-run the Postman/Burp test to verify the fix passes before proceeding to the next test.

7. **Mandatory Room-to-Optimize Audit & Exact File/Line Citations:**
   - In every Burp/network audit, even when requests return 200/201 without errors, the agent MUST actively inspect for any room to optimize (redundant calls, eager vs lazy fetching, storage paths, relational foreign keys, payload bloat).
   - The agent MUST NEVER advance to the next workflow step until all identified optimizations are surfaced and resolved.
   - Whenever auditing or diagnosing code, the agent MUST ALWAYS explicitly cite the exact file path and exact line numbers (e.g. `[NewComplaintForm.jsx:255](file:///...)`) to eliminate search delays and expedite surgical in-place refactoring.


