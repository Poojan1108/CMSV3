# CMS_V2 Data Contracts & Database Schema

> **Document Version:** 1.0  
> **Status:** Active / Source of Truth  
> **Target Backend:** Supabase (PostgreSQL 15+, PostgREST, Realtime, Storage)  
> **Scope:** Canonical schemas, relationships, enums, RLS policies, and data types.

---

## 1. Relational Database Schema (`public` schema)

### 1.1 `public.organizations`
Stores tenant profiles and customizable taxonomy blueprints.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, Default `gen_random_uuid()` | Internal organization identifier |
| `key` | `TEXT` | Unique, Not Null | Canonical slug (e.g., `iit_bombay`, `prestige_residency`) |
| `name` | `TEXT` | Not Null | Display name of the organization |
| `archetype` | `TEXT` | Not Null | `college` \| `society` \| `corporate` |
| `config` | `JSONB` | Default `'{}'::jsonb` | Terms (`userTerm`, `staffTerm`, `locationLabel`) & custom categories |
| `created_at` | `TIMESTAMPTZ`| Default `now()` | Record creation timestamp |

---

### 1.2 `public.profiles`
Links `auth.users` to organization membership, RBAC role, and category specializations.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, References `auth.users(id)` | User auth identifier |
| `email` | `TEXT` | Not Null | User primary email |
| `full_name` | `TEXT` | Not Null | User display name |
| `role` | `TEXT` | Not Null, Default `'student'` | `student` \| `staff` \| `admin` |
| `organization_key` | `TEXT` | References `organizations(key)` | Associated tenant |
| `department` | `TEXT` | Nullable | Assigned department name for staff |
| `assigned_categories` | `TEXT[]` | Default `'{}'` | Specialized categories handled by this staff member |
| `created_at` | `TIMESTAMPTZ`| Default `now()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ`| Default `now()` | Profile last modified timestamp |

---

### 1.3 `public.departments`
Dynamic department registry per organization for ticket auto-routing and SLA targets.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | PK | Department identifier (e.g., `dept_maintenance`, `dept_it`) |
| `name` | `TEXT` | Not Null | Display name (e.g., `Maintenance & Facilities`, `IT Support`) |
| `organization_key` | `TEXT` | Not Null | Scoped tenant identifier |
| `sla_hours` | `INTEGER` | Default `48` | Default SLA target in hours |
| `created_at` | `TIMESTAMPTZ`| Default `now()` | Creation timestamp |

---

### 1.4 `public.complaints`
The primary ticket ledger across all tenant workflows.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | PK | Ticket identifier formatted as `CMS-2026-XXXX` |
| `title` | `TEXT` | Not Null | Brief summary of the complaint |
| `description` | `TEXT` | Not Null | Comprehensive details of the issue |
| `category` | `TEXT` | Not Null | Primary classification (e.g., `Plumbing`, `Electrical`) |
| `subcategory` | `TEXT` | Nullable | Granular sub-type (e.g., `Leaking Tap`, `Geyser Issue`) |
| `priority` | `TEXT` | Not Null, Default `'medium'` | `low` \| `medium` \| `high` \| `urgent` |
| `status` | `TEXT` | Not Null, Default `'pending'` | Lifecycle stage (see Section 2.1) |
| `organization_key` | `TEXT` | Not Null | Tenant scoping key |
| `department` | `TEXT` | Nullable | Auto-routed or manually assigned department |
| `student_id` | `UUID` | References `profiles(id)` | Author user ID |
| `student_name` | `TEXT` | Not Null | Denormalized complainant name for fast dispatch queries |
| `student_email` | `TEXT` | Not Null | Complainant notification email |
| `location` | `TEXT` | Not Null | Specific location (Hostel room, Flat number, Desk ID) |
| `access_time_slot` | `TEXT` | Nullable | Complainant inspection availability slot |
| `assigned_to` | `UUID` | References `profiles(id)` | Current technician handling the ticket |
| `assigned_staff_name`| `TEXT` | Nullable | Denormalized technician name |
| `sla_hours` | `INTEGER` | Not Null | SLA deadline window in hours |
| `attachments` | `JSONB` | Default `'[]'::jsonb` | Array of attachment objects `[{ url, name, size, type }]` |
| `resolution_summary`| `TEXT` | Nullable | Technician summary upon proposing resolution |
| `created_at` | `TIMESTAMPTZ`| Default `now()` | Lodged timestamp |
| `updated_at` | `TIMESTAMPTZ`| Default `now()` | Last modification timestamp |
| `resolved_at` | `TIMESTAMPTZ`| Nullable | Timestamp when complainant signed off resolution |

---

### 1.5 `public.complaint_comments`
Discussion thread attached to tickets with public vs internal visibility separation.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, Default `gen_random_uuid()` | Comment identifier |
| `complaint_id` | `TEXT` | References `complaints(id)` | Associated ticket |
| `sender_id` | `UUID` | References `profiles(id)` | Author user ID |
| `sender_name` | `TEXT` | Not Null | Denormalized author display name |
| `sender_role` | `TEXT` | Not Null | Author role (`student`, `staff`, `admin`) |
| `comment_text` | `TEXT` | Not Null | Comment body |
| `is_internal` | `BOOLEAN`| Default `false` | If `true`, visible strictly to `staff` and `admin` |
| `created_at` | `TIMESTAMPTZ`| Default `now()` | Post timestamp |

---

### 1.6 `public.complaint_audit_log`
Immutable audit log tracking all status changes, reassignments, and resolution actions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | PK, Default `gen_random_uuid()` | Audit log identifier |
| `complaint_id` | `TEXT` | References `complaints(id)` | Associated ticket |
| `action` | `TEXT` | Not Null | `created` \| `status_change` \| `reassigned` \| `proposed_resolution` \| `confirmed` \| `rejected` |
| `previous_status`| `TEXT` | Nullable | Previous ticket status |
| `new_status` | `TEXT` | Nullable | New ticket status |
| `performed_by` | `UUID` | References `profiles(id)` | Actor user ID |
| `actor_name` | `TEXT` | Not Null | Actor display name |
| `note` | `TEXT` | Nullable | Action reason or technician remark |
| `created_at` | `TIMESTAMPTZ`| Default `now()` | Audit timestamp |

---

## 2. Canonical Enums & Business Rules

### 2.1 Ticket Lifecycle States (`status`)
1. **`pending`**: Newly lodged complaint awaiting staff triage or auto-investigation.
2. **`in_progress`**: Under active technician investigation (`assigned_to` populated).
3. **`pending_confirmation`**: Technician resolved the issue; waiting for complainant sign-off.
4. **`resolved`**: Complainant confirmed fix; ticket successfully closed.
5. **`rejected`**: Complainant rejected fix; ticket reopens back to `in_progress`.

### 2.2 Priority Tiers & Default SLA Targets
* **`urgent`**: 4 Hours SLA window (Critical safety, flood, power outage)
* **`high`**: 24 Hours SLA window (Major inconvenience, no hot water)
* **`medium`**: 48 Hours SLA window (Standard repair, faulty fan/light)
* **`low`**: 72 Hours SLA window (Cosmetic touchup, general query)

### 2.3 Storage Bucket Specification
* **Bucket ID:** `complaint-attachments`
* **Allowed MIME Types:** `image/jpeg`, `image/png`, `image/webp`
* **Max File Size:** `5MB` (5,242,880 bytes)
* **Storage Path Convention:** `${organization_key}/${ticketId}/${timestamp}_${sanitizedFilename}`

---

## 3. Row Level Security (RLS) Policy Specifications

1. **`complaints` Table:**
   - **Complainant (`student`):** Can SELECT complaints where `student_id = auth.uid()`. Can INSERT where `student_id = auth.uid()`.
   - **Staff (`staff`):** Can SELECT complaints within their `organization_key`. Can UPDATE status/notes for assigned tickets.
   - **Admin (`admin`):** Full SELECT, INSERT, UPDATE within their `organization_key`.

2. **`complaint_comments` Table:**
   - **Complainant (`student`):** Can SELECT where `complaint_id` belongs to them AND `is_internal = false`. Can INSERT with `is_internal = false`.
   - **Staff & Admin:** Can SELECT all comments including `is_internal = true`. Can INSERT internal or public comments.
