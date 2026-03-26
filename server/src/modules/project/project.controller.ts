import { Request, Response } from 'express';
import { db } from '../../config/db';
import { projects } from '../../db/schema';
import { env } from '../../config/env';
import Groq from 'groq-sdk';
import { eq, and } from 'drizzle-orm';
import { JWTPayload } from '../../lib/jwt';

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req.user as JWTPayload)?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const [project] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal server error fetching project' });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { documentData } = req.body;
    const userId = (req.user as JWTPayload)?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const [updated] = await db.update(projects).set({ documentData }).where(and(eq(projects.id, id), eq(projects.userId, userId))).returning();
    if (!updated) { res.status(404).json({ error: 'Project not found or unauthorized' }); return; }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error while updating project' });
  }
};

export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as JWTPayload)?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await db.select().from(projects).where(eq(projects.userId, userId));
    const sortedProjects = result.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
    res.status(200).json({ success: true, projects: sortedProjects });
  } catch (error) {
    console.error('Error fetching all projects:', error);
    res.status(500).json({ error: 'Internal server error while fetching projects' });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req.user as JWTPayload)?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const [deleted] = await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId))).returning();
    if (!deleted) { res.status(404).json({ error: 'Project not found or unauthorized' }); return; }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal server error while deleting project' });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idea, model } = req.body;
    const userId = (req.user as JWTPayload)?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized: Missing user information' }); return; }
    if (!idea) { res.status(400).json({ error: 'Project idea is required' }); return; }
    const modelName = model || 'llama-3.3-70b-versatile';
    const [newProject] = await db.insert(projects).values({ userId, idea, modelUsed: modelName }).returning();
    res.status(201).json({ id: newProject.id });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error while creating project.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BATCH PROMPTS — 3 batches × 7 sections each = 21 sections total
// Each batch is a self-contained generation call that stays under the token limit.
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_MSG = `You are a world-class senior software architect and technical documentation writer with 15+ years of experience building production systems. You write exhaustive, real-world documentation that a team of developers can use to build a system from scratch without asking questions. Every table is filled with project-specific data. Every code block uses real syntax. You NEVER use placeholder text like "Lorem ipsum" or "Add your X here". You always output valid Markdown with rich structure: tables, code blocks, bullet lists, numbered steps, and subsections.`;

function batchOnePrompt(idea: string): string {
  return `You are documenting a real software project. Generate Sections 1 through 7 of a 21-section technical documentation document.

STRICT OUTPUT RULES:
- Output ONLY raw Markdown. No preamble, no "Here is your documentation", no meta-commentary.
- Every top-level section starts with exactly: # N. Title  (e.g., # 1. Overview)
- Every subsection starts with: ## N.N Title  (e.g., ## 1.1 Purpose & Goals)
- Every sub-subsection starts with: ### Title
- Each subsection needs minimum 200 words of SPECIFIC, project-relevant content.
- Use markdown tables wherever information is comparative or tabular.
- Use fenced code blocks for all code, commands, and folder trees.
- Folder/file trees MUST use a fenced code block with ├── and └── ASCII characters.
- All content must be specific to this project idea — never use generic placeholder text.

PROJECT IDEA: ${idea}

---

# 1. Overview

## 1.1 Purpose & Goals
Write 3-4 detailed paragraphs about: what problem this software solves, who it is built for, the core business goal, secondary goals. Then provide a table of Success Metrics (KPI | Target | How Measured). Finally, list 3-5 explicit non-goals (things the v1 deliberately does NOT do) with a reason for each.

## 1.2 Scope & Audience
List all in-scope features for v1. List all out-of-scope items. Then create a User Roles table (Role | Technical Level | Goals | Primary Actions). Include a Stakeholder Map table (Stakeholder | Interest | Influence).

## 1.3 Architecture Summary
Describe the high-level system architecture in 2-3 paragraphs as if explaining it to a new engineer. Then describe each major component and how they connect. Create a table of all External Integrations (Service | Purpose | Protocol | Auth Method). List all third-party services used.

## 1.4 Key Decisions / ADRs
Write at minimum 5 Architecture Decision Records. For each ADR use this exact format:
### ADR-N: [Decision Title]
- **Status:** Accepted
- **Context:** Why this decision needed to be made
- **Decision:** What was decided
- **Alternatives Considered:** What else was considered
- **Consequences:** Positive and negative outcomes of this decision

## 1.5 Glossary
Create a glossary table (Term | Definition) with at minimum 20 domain-specific terms, acronyms, and abbreviations used in this project.

---

# 2. Tech Stack

## 2.1 Frontend
Create a detailed table (Layer | Technology | Version | Purpose | Why Chosen Over Alternatives). Cover: framework, language, build tool, package manager, UI component library, state management, data fetching, form handling, testing, linting, formatting. Write a paragraph explaining the overall frontend architecture decision.

## 2.2 Backend
Create a detailed table (Layer | Technology | Version | Purpose | Why Chosen). Cover: runtime, framework, language, ORM/query builder, validation library, authentication library, task queue, caching, logging, testing framework. Write a paragraph on the backend architecture pattern.

## 2.3 Database
Describe the primary database choice with rationale. Describe the caching/secondary database. Create a table (Database | Type | Version | Usage | Hosting). Cover migration tool, connection pool strategy, seeding approach for dev vs test vs production.

## 2.4 DevOps & Infrastructure
Table (Tool/Service | Purpose | Configuration Notes). Cover: cloud provider, compute service, container technology, container orchestration, CI/CD platform, infrastructure-as-code, secrets management, monitoring, logging aggregation, alerting.

## 2.5 External Services
Table (Service | Provider | Purpose | Tier/Version | Integration Method). Cover: transactional email, file/media storage, CDN, error tracking, analytics, feature flags, payment processing (if applicable), SMS/push notifications (if applicable).

## 2.6 Version Matrix
Create a comprehensive table (Tool | Current Version | Minimum Supported Version | License | Notes). Include every tool, framework, library, and service used in the project.

---

# 3. Installation & Setup Guide

## 3.1 Prerequisites
List every prerequisite with exact version requirements in a table (Prerequisite | Required Version | Installation Command | Notes). Cover: operating system, Node.js/Python/Go runtime, package manager, Docker, database client, cloud CLI tools, any required global npm packages. List all third-party accounts and API keys needed before starting.

## 3.2 Environment Variables
Create two tables — one for the frontend .env file and one for the backend .env file.
Each table: Variable Name | Description | Example Value | Required? | Default | Service
List ALL environment variables needed. Minimum 20 total across both.

## 3.3 Frontend Setup
Write exact step-by-step numbered instructions with the exact commands to run at each step. Cover: clone repo, navigate to frontend directory, install dependencies, copy .env.example to .env.local, configure each required variable, run dev server. Show the expected terminal output at the end including the URL.

## 3.4 Backend Setup
Write exact step-by-step numbered instructions. Cover: navigate to backend directory, install dependencies, copy .env.example, run database migrations, run seed data, start dev server. Show expected terminal output including port.

## 3.5 Database Setup
Step-by-step for both: (A) running locally with native install and (B) running with Docker. Show the connection string format. Show how to verify all tables were created correctly. Provide the exact commands to run migrations and seeds.

## 3.6 Running with Docker
Write the full docker-compose.yml as a code block (with real service definitions, port mappings, and volume mounts appropriate for this project). Explain each service in the compose file. Document how to rebuild after code changes, how to wipe volumes, how to view logs.

## 3.7 Common Setup Errors
Create a troubleshooting table (Error Message / Symptom | Root Cause | Exact Fix) with at minimum 12 common errors covering: port conflicts, missing env vars, database connection failures, permission issues, Node.js version mismatches, Docker issues, SSL certificate errors, package installation failures.

---

# 4. Folder Structure

## 4.1 Frontend Tree
Show the complete frontend folder structure as a fenced code block using ├── and └── ASCII tree characters. Annotate every folder and key file with a comment explaining its purpose and rules (what goes in it, what must NOT go in it). Cover: src/, components/, hooks/, lib/, store/, services/, types/, utils/, styles/, constants/, assets/, pages/ or app/ (depending on framework).

## 4.2 Backend Tree
Show the complete backend folder structure as a fenced code block using ├── and └── ASCII tree characters. Annotate every folder. Cover: src/, modules/ (each module's subfolders), config/, middleware/, db/schema/, types/, utils/, lib/, tests/.

## 4.3 Naming Conventions
Create a table (Type | Convention | Example | Anti-Example | Notes). Cover: React/Vue component files, utility function files, TypeScript type/interface files, CSS/style files, test files, hook files, API service files, constant files, database schema files, folder names, environment variable names, database column names, API route paths.

---

# 5. UI Components

## 5.1 Component Inventory
Create a complete component inventory table (Component Name | File Path | Category | Props Count | Variants | Has Tests | Description). Group by category: Primitives → Layout → Navigation → Forms → Feedback → Data Display → Modals/Overlays.

## 5.2 Primitive / Base Components
For each primitive component, provide:
### ComponentName
- **Props Interface:** (show full TypeScript interface)
- **Variants:** list all visual variants
- **States:** default, hover, focus, disabled, loading, error
- **Usage Example:** (JSX code block)
- **Accessibility:** ARIA roles, keyboard navigation notes

Cover: Button, Input, Select, Checkbox, Radio, Toggle/Switch, Textarea, Label, Badge, Avatar, Spinner, Skeleton, Tooltip.

## 5.3 Layout Components
Document Page wrapper, Container, Grid, Flex, Divider, Card, Panel, Section. For each: describe its layout behavior, key props, and show a usage example.

## 5.4 Navigation Components
Document Navbar, Sidebar navigation, Breadcrumb, Tabs, Pagination, Dropdown menu, Command palette (if applicable). For each: describe behavior on mobile vs desktop, keyboard navigation, active state management.

## 5.5 Feedback Components
Document Toast/Notification system (all 4 types: success, error, warning, info), Alert banner, Modal/Dialog, Confirmation dialog (with async confirmation pattern), Progress bar, Loading overlay, Empty state component, Error boundary fallback UI. Include code examples showing how to trigger each.

## 5.6 Form Components
Document Form wrapper with validation context, FieldGroup, FormErrorSummary, DatePicker, FileUpload with preview and progress, RichTextEditor, Autocomplete/Combobox, MultiSelect. Show how validation errors surface in each component.

## 5.7 Data Display Components
Document Table (with sorting, filtering, pagination, and row selection), DataGrid, List with virtualization, KeyValueDisplay, StatCard, Chart wrapper components, Timeline, CodeBlock with syntax highlighting. Show how to handle loading and empty states for each.

## 5.8 Component Props Documentation
For the 8 most complex components in this project, provide the complete TypeScript props interface, all prop descriptions, default values, and a real-world JSX usage example showing common use cases.

---

# 6. Design System

## 6.1 Color Palette
Create a full color system table (Token Name | Hex Value | HSL Value | RGB | Usage Description). Cover all of the following:
- Primary brand colors: 9 shades (50, 100, 200, 300, 400, 500, 600, 700, 800, 900)
- Neutral/gray scale: 10 shades
- Semantic colors: success (3 shades), warning (3 shades), error (3 shades), info (3 shades)
- Surface colors: page-bg, card-bg, elevated-surface, overlay
- Border colors: default, hover, focus, disabled
- Text colors: primary, secondary, muted, inverse, on-brand, link, link-hover
- Dark mode mapping table: show the light-mode token → dark-mode value for every token above

## 6.2 Typography
Create a typography scale table (Token | Font Family | Weight | Size (rem) | Size (px) | Line Height | Letter Spacing | Use Case). Cover: display, h1–h6, body-lg, body, body-sm, caption, overline, code, code-sm. Document the font loading strategy (self-hosted vs CDN), the @font-face declarations needed, the fallback stack, and the font-display setting.

## 6.3 Spacing System
Document the base unit (4px or 8px). Create a spacing scale table (Token | Value (px) | Value (rem) | Common Usage). Include spacing-0 through spacing-24 (and any larger steps like 32, 40, 48, 64, 80, 96). Write rules for: when to use margin vs padding vs gap, component internal spacing vs component external spacing, responsive spacing adjustments.

## 6.4 Border Radius
Document the border radius scale (Token | Value | When to Use | Example Components). Cover: none (0px), xs (2px), sm (4px), md (8px), lg (12px), xl (16px), 2xl (24px), full (9999px).

## 6.5 Shadows & Elevation
Document the elevation system (Token | Box Shadow Value | Use Case | Component Examples). Define 6 levels: none, xs (subtle), sm (card), md (dropdown), lg (modal), xl (notifications).

## 6.6 Icons
Specify the icon library and version. Document sizing standards (16px inline, 20px UI, 24px prominent, 32px feature icons). Show the import pattern and how to use icons inline with text. Write the accessibility rule: when to use aria-hidden="true" vs role="img" aria-label. Document the process for adding a custom icon.

## 6.7 Motion & Animation
Create a timing tokens table (Token | Duration | Easing Curve | Use Case). Cover: instant (0ms), fast (100ms), base (200ms), slow (300ms), slower (500ms). Write the prefers-reduced-motion rule and show the CSS. Document which interactions MUST animate (micro-interactions) and which must NOT animate (data loading from server).

## 6.8 Breakpoints
Create a breakpoints table (Name | Min Width | Max Width | Layout Behavior | Columns | Content Max Width). Cover: xs/mobile (320px), sm/tablet (640px), md/laptop (1024px), lg/desktop (1280px), xl/wide (1536px). For each breakpoint describe: navbar behavior, sidebar behavior, grid columns, font size adjustments.

## 6.9 Z-Index Scale
Create a z-index table (Token Name | Value | What Uses It | Notes). Cover: base (0), raised (10), dropdown (100), sticky (200), fixed (300), modal-backdrop (400), modal (500), toast (600), tooltip (700).

## 6.10 Component Theming
Explain the CSS custom property architecture: how tokens are defined at :root, how dark mode is toggled (class vs media query), how a component can override tokens locally, how to create a new theme. Show a real CSS example with 10 tokens and their dark mode overrides.

---

# 7. Pages & Routing

## 7.1 Route Map
Create a comprehensive routes table (Path | Component/Page | Auth Required | Role Required | Layout | Rendering Strategy | Meta Title | Meta Description). Cover every page in the application — minimum 15 routes.

## 7.2 Page Hierarchy
Describe the page structure as a text tree showing: public routes, authentication routes, authenticated app routes, admin routes, and any nested routes. Explain the layout components used at each level.

## 7.3 Navigation Guards
Explain exactly how route protection is implemented. Show the middleware/HOC/wrapper code that checks authentication and redirects unauthenticated users. Describe how role-based access is enforced at the route level. Show what happens when an authenticated user visits an auth page (e.g., /login). Describe the redirect-after-login behavior.

## 7.4 Page-Level Data Fetching
For each major page, specify: rendering strategy (SSR/SSG/ISR/CSR), what data is fetched, when it is fetched (build time vs request time vs client-side), how loading state is shown, how error state is handled, and cache revalidation strategy. Create a table (Page | Strategy | Data Sources | Loading State | Error State | Cache TTL).

## 7.5 URL Patterns & Query Params
Document the URL naming convention (kebab-case, no trailing slash, etc.). For paginated list pages: show the full query param structure (page, limit, sort, order, search, filter[field]=value). Show how these params are serialized and parsed. Document dynamic route segments and what they represent.`;
}

function batchTwoPrompt(idea: string): string {
  return `Continue generating the technical documentation. Output Sections 8 through 14 only. Use the exact same format.

STRICT OUTPUT RULES:
- Output ONLY raw Markdown. No preamble.
- Top-level sections: # N. Title
- Subsections: ## N.N Title
- Sub-subsections: ### Title
- Each subsection: minimum 200 words of specific, project-relevant content.
- Tables, code blocks, and lists where appropriate.
- File/folder trees use fenced code blocks with ├── and └── characters.

PROJECT IDEA: ${idea}

---

# 8. State Management

## 8.1 State Categories
Create a table classifying every type of state in this application (State Type | Library/Hook | Scope | Persistence | Examples from this project). Cover: Global server cache (API data), Global UI state (modals, sidebars, theme), Authenticated user state, Local component state, Form state, URL/query param state, Optimistic update state. Explain why each category uses its chosen solution.

## 8.2 Store Structure
For each global store/slice, document: Name | File Path | State Shape (TypeScript interface) | Actions/Mutations | Selectors | What triggers updates. Show the TypeScript interface for the top 3 most important store slices with real field names specific to this project.

## 8.3 Data Fetching Patterns
Document the query key naming convention with real examples from this project (e.g., ["users", userId], ["projects", { status: "active" }]). Show the standard pattern for: a list query, a detail query, a create mutation, an update mutation, a delete mutation. Show the optimistic update pattern for the most common mutation in this app. Document the cache invalidation strategy after each mutation type.

## 8.4 Side Effects
List all side effects in the application in a table (Side Effect | Trigger | Handler Location | Cleanup Required? | Notes). Cover: WebSocket/SSE connections, localStorage sync, URL param sync, analytics event firing, toast notifications triggered by data changes, polling, timers.

---

# 9. API Routes

## 9.1 Base URL & Versioning
Document the base URL format for each environment. Explain the versioning strategy (/api/v1/). Show how breaking changes are handled (new version vs flag). Document the deprecation process and timeline.

## 9.2 Authentication Headers
Show the exact Authorization header format. Explain the JWT token lifecycle: issuance on login, validation on each request, refresh before expiry, revocation on logout. Show the exact JWT payload structure with all claims. Document what happens when a token is expired (401 response format) vs invalid (401 with different error code).

## 9.3 Request/Response Format
Show the standard success response envelope with a real JSON example. Show the standard error response envelope. Document all standard HTTP status codes used and when each is returned. Show how pagination metadata is included.

## 9.4 Error Response Format
Show the complete error response JSON structure with all fields. Create an error codes table (Error Code String | HTTP Status | User-Facing Message | Internal Description | When It Occurs). Include minimum 20 error codes specific to this application.

## 9.5 Full Endpoint Reference
For every endpoint, document in a table per resource group: Method | Path | Auth Required | Role | Description | Request Body Schema | Query Params | Success Response | Error Responses | Rate Limit.

Group all routes by resource. Include ALL of: Authentication routes, User routes, [main resource routes for this specific app], Admin routes. Total minimum: 30 endpoints.

## 9.6 Pagination, Filtering & Sorting
Document the standard query parameters (page, limit, sort, order, q/search). Show the paginated response envelope structure with a real JSON example. Explain cursor-based pagination if used. Document all filterable fields per resource. Show how compound filters work (filter[status]=active&filter[role]=admin).

## 9.7 File Upload Endpoints
For each file upload endpoint: document the multipart/form-data field names, maximum file size, allowed MIME types, validation errors, storage destination (S3 bucket/path), response format (including the final file URL), and virus scanning if applicable.

## 9.8 Webhook Endpoints
List all inbound webhook endpoints. For each: document the path, the expected payload structure, the signature verification header and algorithm (HMAC-SHA256), the expected HTTP response, the retry behavior if a non-200 is returned, and all event type strings. Show a real webhook payload JSON example.

---

# 10. Database Models

## 10.1 Entity Relationship Diagram
Describe the complete entity relationship structure as a text diagram. List all tables, all foreign key relationships with cardinality (1:1, 1:N, M:N), and which relationships have cascade delete. Explain the overall data model in 2-3 paragraphs.

## 10.2 Model Reference
For EACH table in the database, create a subsection with this exact format:
### table_name
| Column | Data Type | Constraints | Default | FK References | Description |
|--------|-----------|-------------|---------|---------------|-------------|
Include every column. Every table must have: id (UUID), created_at, updated_at. Include a minimum of 8 tables with at least 8 columns each. Tables must be specific to this project's domain.

## 10.3 Indexes
Create an indexes table (Index Name | Table | Columns | Index Type | Unique? | Reason / Query It Optimizes). Include all primary key indexes, all foreign key indexes, and all performance indexes for common query patterns specific to this app. Minimum 15 indexes.

## 10.4 Migrations
Document the migration file naming convention with a real example filename. Show the exact commands to: create a new migration, run all pending migrations, roll back the last migration, check migration status. Explain the CI/CD migration strategy (auto-run on deploy vs manual approval). State the policy on altering existing columns in a live production database (backward-compatible steps).

## 10.5 Seeding
Describe all seed data required. Separate: (1) base seed data required for the app to function (roles, system config, etc.), (2) development seed data (fake users, sample content), (3) test seed data (predictable fixtures for automated tests). Show the exact commands to run each seed set. Show a sample seed file for the most important entity.

## 10.6 Soft Deletes
State which models (tables) use soft deletes and why. Show how the deleted_at column is used in the ORM queries (default scope to exclude soft-deleted records). Show the restore procedure. Explain the cascading behavior: when a parent is soft-deleted, what happens to child records. Document the hard-delete (permanent purge) procedure and when it is used.

---

# 11. Auth & Security

## 11.1 Authentication Flow
Write the complete step-by-step authentication flows as numbered lists with the exact API endpoint called at each step:

### Registration Flow (with email verification)
### Login Flow
### Token Refresh Flow
### Password Reset Flow
### OAuth / Social Login Flow (if applicable)
### Logout Flow

For each: show what the client sends, what the server does (validate → query DB → generate token), what the server returns.

## 11.2 Authorization & Roles
Define all user roles with descriptions. Then create a full Permission Matrix table where rows = roles and columns = actions.

Actions must include minimum 20 specific actions relevant to this application.
Use ✅ / ❌ / 🔑 (own only) symbols.

Also explain: how roles are stored (DB field vs JWT claim), how the middleware checks permissions, how permissions are checked at the service layer for own-resource vs any-resource scenarios.

## 11.3 Password Policies
Document: minimum length, character requirements (uppercase, lowercase, number, symbol), maximum length, the bcrypt cost factor used and why, the password history policy (cannot reuse last N passwords), the account lockout policy (N failed attempts → lockout duration). Show the full password reset flow step by step including token expiry.

## 11.4 Security Headers
Create a table (HTTP Header | Value / Configuration | Why It's Set This Way). Cover: Content-Security-Policy (show full CSP string), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, Strict-Transport-Security, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy, CORS (allowed origins, methods, headers).

## 11.5 Input Validation & Sanitization
Explain where validation happens (request middleware vs service layer vs DB constraints). Show the validation schema for the most complex request body in this application (using Zod, Joi, or equivalent). List all input sanitization rules: HTML stripping for user-generated content, URL validation, file name sanitization, SQL injection prevention (parameterized queries), JSON depth limit. Explain the output encoding strategy for rendering user content in the frontend.

## 11.6 Rate Limiting
Create a rate limit table (Endpoint / Route Group | Limit | Window | Per | Response on Exceed). Cover: global API limit, authentication endpoints (stricter), unauthenticated routes, authenticated routes, file upload endpoints, admin endpoints. Show the exact 429 response body with Retry-After header.

## 11.7 Secrets Management
List all secrets used by the application in a table (Secret | Where Stored Locally | Where Stored in CI | Where Stored in Production | Rotation Frequency). State which secrets NEVER go in git (show .gitignore entries). Describe the secret rotation procedure for the most critical secret (JWT signing key). Explain how secrets are injected at runtime.

---

# 12. Common Functions & Utilities

## 12.1 Frontend Utilities
For each utility function, provide the TypeScript signature and a usage example in a code block:
### Date & Time — formatDate, formatRelativeTime, parseISODate, formatDuration
### Number Formatting — formatCurrency, formatCompactNumber, formatPercentage, formatFileSize
### String Utilities — truncate, slugify, capitalizeFirst, stripHtml, maskEmail
### Object / Array Utilities — deepClone, groupBy, uniqueBy, flattenDeep, pick, omit
### Async Utilities — debounce, throttle, retry, sleep, withTimeout
### URL Utilities — buildUrl, parseQueryParams, serializeQueryParams, getBaseUrl
### Class Name Utilities — cn (class name merger), conditionalClass
### Validation Helpers — isEmail, isUrl, isUUID, isPhoneNumber, matchesPasswordRules

## 12.2 Backend Utilities
For each backend utility, provide the TypeScript signature and a real usage example:
### Response Builders — success(data, meta?), paginated(data, page, limit, total), error(code, message, details?)
### Pagination Helper — getPaginationParams(query), buildPaginationMeta(total, page, limit)
### Error Factory — AppError class with code, status, message; createValidationError, createNotFoundError, createUnauthorizedError
### Async Wrapper — asyncHandler(fn) — wraps async route handlers to catch errors
### JWT Utilities — signAccessToken(payload), signRefreshToken(payload), verifyToken(token)
### Password Utilities — hashPassword(plain), comparePassword(plain, hash)
### Slug Generator — generateSlug(text), generateUniqueSlug(text, existingCheck)
### File Utilities — getFileExtension(filename), validateMimeType(mime, allowed[]), sanitizeFilename(name)

## 12.3 Shared Types / Interfaces
Show the complete TypeScript definitions for all shared types used across the project. Include:
- User, UserRole, UserStatus interfaces
- PaginatedResponse<T> generic interface
- ApiResponse<T> and ApiError interfaces
- All domain-specific entity interfaces (specific to this project)
- Request/Response DTO types for the main operations

## 12.4 Constants
Show all application constants as TypeScript const objects. Cover: API route paths, token expiry durations (in seconds), file size limits (in bytes), allowed MIME types arrays, user role enum values, application status codes, pagination defaults, feature flags, third-party API endpoints.

---

# 13. User Workflows

For each of the following 6 workflows, document the COMPLETE end-to-end journey specific to this application:

**For each workflow write:**
- **Goal:** What the user wants to accomplish
- **Preconditions:** What must be true before this workflow starts
- **Step-by-Step:** Numbered steps of the interaction — what the user sees/clicks, what API is called, what the backend does, what the user sees next
- **Frontend Logic:** Which components render, which state updates, which API calls are made (include exact endpoint)
- **Backend Logic:** Controller → Service → DB — describe each layer
- **Success Result:** What the user sees on completion
- **Error Cases:** At least 4 specific error scenarios and how each is handled

### Workflow 1: User Registration & Onboarding
### Workflow 2: Login & Session Management (including token refresh)
### Workflow 3: Core Feature Workflow (the #1 most important feature of this specific application)
### Workflow 4: Search, Filtering & Navigation
### Workflow 5: Account Settings & Profile Management
### Workflow 6: Admin — User Management & Content Moderation

---

# 14. Developer Workflows

## 14.1 Git Branching Strategy
Document the branching model. Create a table showing all branch types (Type | Naming Convention | Example | Base Branch | Merge Into | Notes). Cover: main/master, develop, feature, fix, hotfix, chore, release. Explain branch protection rules for main and develop.

## 14.2 Commit Conventions
Show the Conventional Commits format in detail. Create a table (Type | When to Use | Example Commit Message). Cover: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert. Explain how the commit message scope is defined. Show how breaking changes are marked (!). Explain how commit messages drive automatic changelog generation.

## 14.3 Pull Request Process
Show the full PR template (as a Markdown code block). Define: required number of approvals, who are required reviewers, what CI checks must pass before merge can be enabled, the merge strategy (squash vs rebase vs merge commit), the branch cleanup policy. Create a PR review checklist table.

## 14.4 Code Review Standards
Write the code review guidelines covering: what reviewers must check (correctness, tests, security, performance, types, naming), what reviewers should NOT block on (style — that's Prettier's job), acceptable turnaround time, how to request changes vs approve with comments, how the author should respond to feedback.

## 14.5 CI Pipeline
Show the COMPLETE GitHub Actions workflow YAML as a fenced code block. The pipeline must include: trigger (push to main and PRs), jobs for: lint, type-check, unit tests with coverage, integration tests, build artifact, deploy to staging (on main), smoke test, manual approval gate, deploy to production. Show how secrets are injected.

## 14.6 Local Development Tips
Describe how to set up mock data for offline development. Explain how to disable authentication middleware locally (dev-only bypass). List every npm/pnpm script with its purpose. Create a table of recommended VS Code extensions (Extension ID | Name | Why It's Essential). Show the recommended .vscode/settings.json as a code block.`;
}

function batchThreePrompt(idea: string): string {
  return `Continue generating the technical documentation. Output Sections 15 through 21 only.

STRICT OUTPUT RULES:
- Output ONLY raw Markdown. No preamble.
- Top-level sections: # N. Title
- Subsections: ## N.N Title
- Sub-subsections: ### Title
- Each subsection: minimum 200 words of specific, project-relevant content.
- Tables, code blocks, and lists where appropriate.

PROJECT IDEA: ${idea}

---

# 15. Error Handling

## 15.1 Error Classification
Explain the two fundamental error categories: Operational errors (expected, recoverable: validation failure, not found, permission denied, external service timeout) vs Programmer errors (bugs: null pointer, type error, unhandled promise rejection — should crash and restart in production). Create a classification table (Error Class | Type | HTTP Status Range | Should Crash? | Should Alert On-Call? | Examples). Document the error severity levels (P0-P3).

## 15.2 Error Codes
Create a comprehensive error codes table (Error Code String | HTTP Status | User-Facing Message | Internal Description | When It Occurs). Cover ALL of the following categories with project-specific codes: Authentication (AUTH_*), Authorization (AUTHZ_*), Validation (VALIDATION_*), Not Found (NOT_FOUND_*), Conflict (CONFLICT_*), Rate Limiting (RATE_LIMIT_*), External Service (EXTERNAL_*), Server Error (SERVER_*). Minimum 25 error codes.

## 15.3 Frontend Error Boundaries
Describe exactly WHERE React error boundaries are placed in the component tree (list each boundary and what it wraps). Show the ErrorBoundary component code. Show the FallbackUI component that renders when an error is caught. Explain how errors are reported to Sentry (include the Sentry.captureException call pattern). Describe the retry button behavior — does it re-render the boundary or navigate away?

## 15.4 API Error Handling in Frontend
Show the base API client function that catches errors and normalizes them into a consistent shape. Show how different error types are handled: validation errors (field-level inline errors), not-found errors (redirect or empty state), auth errors (redirect to login), network offline errors (persistent banner), rate limit errors (toast with retry countdown). Show the toast notification trigger pattern for API errors.

## 15.5 Backend Global Error Handler
Show the complete Express error handler middleware as a code block. Document: what information is safe to include in client-facing error responses vs what must be logged only (stack traces, DB query details, internal IDs). Show how the error is structured before being logged. Explain how the error handler differentiates between AppError (known operational errors) vs unknown errors (programmer bugs). Show the Sentry.captureException integration point.

## 15.6 Logging Strategy
Create a log levels table (Level | When to Use | Examples | Alert Triggered?). Describe the structured log format (JSON) and show a real log entry example for: an incoming request, a successful operation, a caught operational error, an uncaught error. Explain the correlation ID / request ID pattern (how it's generated, attached to requests, included in all log lines for a request). List all fields that must be redacted from logs: passwords, tokens, PII fields.

---

# 16. Testing Strategy

## 16.1 Testing Philosophy
Describe the testing pyramid for this application (Unit / Integration / E2E percentages and rationale). State the target coverage percentages (line coverage and branch coverage). Explain what is NOT tested (and why): third-party library internals, generated code, configuration files. State the TDD vs test-after policy. Explain the testing environment isolation approach.

## 16.2 Unit Tests
Define what qualifies for a unit test in this project. Show the test file naming convention with an example. Show the folder structure for test files (co-located vs __tests__ folder). Show a complete, realistic unit test file for a utility function specific to this project (use Jest/Vitest syntax). Show the mock/stub pattern for external dependencies. Document what must be mocked vs what should be real.

## 16.3 Component Tests
Explain how React components are tested with React Testing Library. State the testing philosophy: test user behavior, not implementation details (no testing of internal state, no testing of class names). Show a complete component test for a meaningful component in this app (minimum 5 assertions, tests interactions, tests loading state, tests error state). Show the MSW (Mock Service Worker) setup for mocking API calls in component tests.

## 16.4 Integration Tests
Explain the test database setup: separate database/schema, automatic seeding before each test suite, teardown after. Show the test database configuration. Show a complete integration test for the most important API endpoint group in this application (minimum 5 test cases: success, validation error, auth error, not found, edge case). Show how authentication is handled in integration tests (test JWT tokens).

## 16.5 End-to-End Tests
State the E2E framework used (Playwright or Cypress) and version. List all critical user flows that have E2E coverage — every item must be a real workflow in this application. Show the E2E test configuration for running locally. Show a complete E2E test for the core user flow in this application. Document how E2E tests run in CI (parallel jobs, retries, screenshot on failure).

## 16.6 Running Tests
Create a comprehensive commands table (Command | What It Runs | When to Run | Output Location). Cover: unit tests, unit tests with coverage, component tests, integration tests, E2E tests locally, E2E tests headless, all tests, watch mode, update snapshots, clear test cache.

## 16.7 Test Data & Fixtures
Show the factory function pattern for creating test data specific to this project's models. Show 3 factory functions for the main entities. Explain the fixture strategy: static JSON fixtures vs dynamic factory functions — when to use each. Show how the test database is reset between test runs (truncate tables vs rollback transactions). Show the seed command for populating integration test data.

---

# 17. Code Standards

## 17.1 Linting
Show the complete .eslintrc.json configuration as a code block. Explain each rule category: errors (things that will break the build), warnings (style suggestions), disabled rules (and why they are disabled). Document the custom rules added for this project. Show the lint command and auto-fix command. Explain how linting is enforced in CI.

## 17.2 Formatting
Show the complete .prettierrc configuration as a code block. Explain each setting. Show the .prettierignore file. Show the husky + lint-staged configuration (package.json pre-commit hook). Show the .vscode/settings.json entries that enable format-on-save. Document how to handle conflicts between ESLint and Prettier.

## 17.3 TypeScript Rules
Show the complete tsconfig.json as a code block and explain every non-default setting. Document the no-any policy: what to use instead of any (unknown, generics, proper typing), when an explicit exception with // @ts-ignore or as any is acceptable. Show the naming conventions for types vs interfaces (when to use which). Document generic type naming conventions (T, TItem, TResponse). Show how to handle third-party library types that are missing or incorrect.

## 17.4 Component Guidelines
Document all component authoring rules with code examples showing correct vs incorrect patterns: functional components only, hooks always at top of component, prop destructuring in function signature, no inline style objects (use CSS modules/utility classes), direct state updates only through setters, component size limit (split if >200 lines), single responsibility — one component does one thing, prop drilling depth limit (use context/zustand beyond 2 levels).

## 17.5 File and Import Rules
Show the required import ordering with a real code example (external packages → internal absolute → relative). Show how path aliases are configured (tsconfig paths + Vite/webpack alias). State the barrel file policy: where index.ts barrel files are allowed, where they are forbidden (causes circular import risk). Show the circular import detection tool and command. Document the tree-shaking rules: how to ensure imports are tree-shakeable.

---

# 18. Performance

## 18.1 Frontend Performance Budgets
Create a performance budgets table (Metric | Target | Critical Threshold | Tool to Measure). Cover: Lighthouse Performance score, LCP (target < 2.5s), FID/INP (target < 100ms), CLS (target < 0.1), TTFB (target < 800ms), Total JS bundle size, Main chunk size, Initial CSS size. Explain how budgets are enforced in CI (fail build if budget exceeded).

## 18.2 Code Splitting Strategy
Explain the route-level code splitting setup. Show how React.lazy and Suspense are used with the loading fallback. Document which components are lazy-loaded and why. Show the dynamic import pattern for heavy third-party libraries (e.g., charts, rich text editors). Explain the chunk naming strategy (webpackChunkName comments). Document the preloading strategy for routes the user is likely to navigate to next.

## 18.3 Image Optimization
State the required image formats (WebP with AVIF fallback). Show how images are served through the CDN with format negotiation. Show the responsive image implementation (srcSet, sizes). Document the lazy loading policy (below-fold images). Show the blur placeholder pattern. Document max file size limits per image type. Explain the image compression pipeline in CI.

## 18.4 Caching Strategy
Create a caching layers table (Layer | Technology | What Is Cached | TTL | Invalidation Strategy). Cover: Browser cache (Cache-Control headers per asset type), CDN cache (immutable static assets vs dynamic API responses), Server-side API response cache (Redis), Database query result cache (if applicable). Show specific Cache-Control header values for: HTML pages, versioned JS/CSS files, API responses, user-uploaded files.

## 18.5 Database Performance
Document all query performance rules: always use parameterized queries, select only needed columns (no SELECT *), use LIMIT on all list queries, use pagination for any query returning >100 rows, use database-level pagination not application-level. Explain how N+1 queries are avoided (eager loading, DataLoader pattern, or JOIN strategy). Show the connection pool configuration. Define the slow query threshold (e.g., >100ms) and how slow queries are logged and alerted.

## 18.6 Monitoring
Create a monitoring coverage table (What Is Monitored | Tool | Metric Name | Alert Threshold | On-Call Trigger?). Cover: Core Web Vitals from real users (RUM), API endpoint latency P50/P95/P99, HTTP error rates (4xx and 5xx), database query times, background job queue depth and failure rate, memory usage, CPU usage, external service response times. Describe the alerting escalation path.

---

# 19. Deployment

## 19.1 Environments
Create an environments table (Environment | Purpose | URL | Branch | Auto-Deploy? | Access | DB | External Services). Cover: Local, Development, Staging, Production. Explain what makes each environment different from Production.

## 19.2 Environment Variables per Environment
Create a table showing all environment variables that DIFFER across environments (Variable | Local Value | Dev Value | Staging Value | Production Value). For production secrets, show them as \${SECRET_NAME} indicating they come from the secrets manager.

## 19.3 Frontend Deployment
Document the exact Vercel (or equivalent) project configuration: build command, output directory, install command, Node.js version, root directory. Show which environment variables are set in the hosting platform. Explain the preview deployment flow for PRs. Document the custom domain setup and SSL. Explain the CDN configuration for static assets.

## 19.4 Backend Deployment
Show the complete Dockerfile as a code block (multi-stage build: builder stage + production stage). Explain every Dockerfile directive. Show the Docker Compose file for local development. Document the health check endpoint (/health) response format. Explain the graceful shutdown behavior (SIGTERM handler: stop accepting new requests → drain in-flight requests → close DB connections → exit).

## 19.5 Database Deployment
Explain the production migration strategy: migrations run automatically as part of CI/CD before the new application version is deployed (blue-green) or run in a pre-deploy job. The migration job must be idempotent. Show the rollback procedure for a failed migration. Document the backup schedule, retention period, and storage location. Explain the connection pooler setup (PgBouncer or cloud-provided).

## 19.6 CI/CD Pipeline
Show the COMPLETE GitHub Actions workflow YAML for the production deployment pipeline. Include: triggers (push to main), jobs: test → build-frontend → build-docker → push-to-registry → deploy-staging → smoke-test-staging → manual-approval → deploy-production → smoke-test-production → notify-team.

## 19.7 Rollback Procedure
Document step-by-step rollback procedures for each scenario:
### Frontend Rollback — how to revert to previous Vercel deployment (with commands)
### Backend Rollback — how to roll back the Docker image to the previous tag (with commands)
### Database Migration Rollback — how to run the down migration (with commands and safety checks)
### Full Stack Emergency Rollback — the order of operations when everything needs to go back

## 19.8 Zero-Downtime Deployment
Explain the deployment strategy (blue-green or rolling). Show how database migrations are written to be backward-compatible with the PREVIOUS version of the application code (expand-contract migration pattern). Provide a real example of a backward-compatible migration for this project. Explain the health check integration during rolling deployment (when traffic is cut over).

---

# 20. Maintenance

## 20.1 Dependency Updates
Describe the update schedule (weekly security patches, monthly dependency review). Show the Dependabot or Renovate configuration file as a code block. Explain the update testing procedure: automated tests → manual smoke test on staging → merge. State the policy on major version upgrades (upgrade within X weeks for security, X months for features). Create a dependency risk matrix (Dependency | Current Version | Last Updated | Maintainers | Criticality | Risk Level).

## 20.2 Database Maintenance
Document the PostgreSQL maintenance schedule: VACUUM ANALYZE frequency, AUTOVACUUM configuration, index bloat monitoring query (provide the actual SQL), table bloat check. Create a maintenance calendar table (Task | Frequency | Command / Query | Expected Duration | Impact). Cover: VACUUM, ANALYZE, REINDEX, partition pruning, slow query log review.

## 20.3 Backup & Recovery
Create a backup strategy table (Backup Type | Frequency | Retention | Storage Location | Encryption | Verification). Cover: full database backup, transaction log backup, application code (Git), file storage (S3 versioning), secrets (Vault snapshot). Document the restore procedure step by step. State the RTO (Recovery Time Objective) and RPO (Recovery Point Objective) targets.

## 20.4 Scaling Runbook
Define the scaling trigger thresholds (CPU > X%, memory > X%, API latency P95 > Xms, DB connections > X%, queue depth > X). For each threshold, document the scaling action. Create runbooks for: horizontal scaling of the API (add pods/instances), vertical scaling of the database (upgrade instance), adding a read replica, scaling the file storage, enabling a CDN for a new region.

## 20.5 Incident Response
Define the severity levels (P0: complete outage, P1: major feature broken, P2: degraded performance, P3: minor issue). Create a response SLA table (Severity | Response Time | Resolution Time | Communication Frequency | Who Is Notified). Document the on-call rotation. Show the complete post-mortem template as a Markdown code block (Timeline, Root Cause, Impact, Resolution, Action Items, Prevention).

## 20.6 Security Patching
Describe how security advisories are monitored: GitHub Dependabot alerts, npm audit in CI (fail on high/critical), CVE mailing lists. Create a patch priority table (Severity | CVSS Score Range | Patch Within | Process | Sign-Off Required). Cover: Critical, High, Medium, Low. Explain the emergency patch procedure for a critical 0-day: hotfix branch → expedited review → deploy to production → post-mortem.

## 20.7 Data Retention & Deletion
Create a data retention table (Data Type | Retention Period | Storage Location | Deletion Method | Legal Basis). Cover all data collected: user accounts, activity logs, audit logs, file uploads, payment records, analytics events, email logs, error logs, backups. Document the GDPR/CCPA user data deletion process step by step (what is deleted, what is anonymized, confirmation sent, deletion certificate). Show the automated cleanup job schedule.

---

# 21. Changelog

## 21.1 Versioning Scheme
Explain semantic versioning: MAJOR (breaking changes requiring migration), MINOR (new features, backward-compatible), PATCH (bug fixes, security patches). Document exactly what triggers each version bump for this project with real examples. Explain the pre-release versioning strategy (alpha.1, beta.2, rc.1). Show the git tag naming convention (v1.2.3). Describe how versions are tracked (package.json, pyproject.toml, or equivalent).

## 21.2 Changelog Format
Show the complete changelog format based on Keep a Changelog standard. Provide an example changelog entry for a realistic v2.0.0 major release of this application, followed by a v1.5.0 minor release and a v1.4.2 patch. The examples must use changes specific to this project's domain. The format must include sections: Breaking Changes, New Features, Bug Fixes, Deprecated, Removed, Security.

## 21.3 Release Process
Document the complete release process as a numbered checklist:
1. Version bump (command)
2. Changelog update (how)
3. Tests pass (command)
4. Build artifacts (command)
5. Create release PR
6. Approval requirements
7. Merge to main
8. Tag the release (command)
9. Publish release in GitHub
10. Deploy to production
11. Announce in team channel
12. Monitor for 1 hour post-deploy

## 21.4 Migration Guides
Write migration guides for the following hypothetical version transitions specific to this application:

### Migrating from v1.x to v2.0 (Breaking Changes)
List 3-5 breaking changes specific to this app, with a Before/After code example for each.

### Migrating from v0.x to v1.0 (Initial Stable Release)
List the key changes that happened when moving from beta to stable, data migration steps if any.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stream a single Groq batch and pipe output to the response
// ─────────────────────────────────────────────────────────────────────────────
async function streamBatch(
  res: Response,
  model: string,
  prompt: string,
  acc: { text: string }
): Promise<void> {
  const stream = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_MSG },
      { role: 'user', content: prompt },
    ],
    stream: true,
    max_tokens: 16000,
  });

  for await (const chunk of stream) {
    const chunkText = chunk.choices[0]?.delta?.content || '';
    if (chunkText) {
      acc.text += chunkText;
      res.write(`data: ${JSON.stringify({ type: 'content', text: chunkText })}\n\n`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN: Stream 3 batches sequentially into one SSE response
// ─────────────────────────────────────────────────────────────────────────────
export const streamProjectGeneration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req.user as JWTPayload)?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const [existingProject] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    if (!existingProject) { res.status(404).json({ error: 'Project not found or unauthorized' }); return; }

    const { idea, modelUsed } = existingProject;
    if (!idea) { res.status(400).json({ error: 'Idea missing from project' }); return; }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const model = modelUsed || 'llama-3.3-70b-versatile';
    const acc = { text: '' };

    // ── Batch 1: Sections 1–7 ──────────────────────────────────────
    res.write(`data: ${JSON.stringify({ type: 'batch', batch: 1, label: 'Sections 1–7' })}\n\n`);
    await streamBatch(res, model, batchOnePrompt(idea), acc);

    // ── Batch 2: Sections 8–14 ────────────────────────────────────
    res.write(`data: ${JSON.stringify({ type: 'batch', batch: 2, label: 'Sections 8–14' })}\n\n`);
    await streamBatch(res, model, batchTwoPrompt(idea), acc);

    // ── Batch 3: Sections 15–21 ───────────────────────────────────
    res.write(`data: ${JSON.stringify({ type: 'batch', batch: 3, label: 'Sections 15–21' })}\n\n`);
    await streamBatch(res, model, batchThreePrompt(idea), acc);

    // ── Parse all accumulated content into sections ────────────────
    const sections: Record<string, string> = {};
    const regex = /(?:^|\n)#\s+([^\n]+)\n([\s\S]*?)(?=(?:\n#\s+|$))/g;
    let match;
    while ((match = regex.exec(acc.text)) !== null) {
      const sectionName = match[1].trim();
      const sectionContent = match[2].trim();
      if (sectionName && sectionContent) {
        sections[sectionName] = sectionContent;
      }
    }

    await db.update(projects)
      .set({ documentData: Object.keys(sections).length > 0 ? sections : { Document: acc.text } })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error streaming project generation:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error while streaming project generation.' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to complete generation' })}\n\n`);
      res.end();
    }
  }
};

export const regenerateSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, sectionName } = req.params;
    const { instructions } = req.body;
    const userId = (req.user as import('../../lib/jwt').JWTPayload)?.userId;
    if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const [existingProject] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    if (!existingProject) { res.status(404).json({ error: 'Project not found' }); return; }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const prompt = `You are a senior technical writer regenerating one section of a software project's documentation.

Project Idea: ${existingProject.idea}
Section: "${sectionName}"

User Instructions: "${instructions || 'Rewrite this section to be more detailed, exhaustive, and professional. Use real project-specific examples, tables, and code blocks.'}"

RULES:
1. Output ONLY the section content — do NOT include the main # heading.
2. Start immediately with ## subsection headings.
3. Each subsection: minimum 150 words of project-specific content.
4. Use tables, code blocks, bullet lists, numbered steps.
5. File/folder trees must use fenced code blocks with ├── └── characters.
6. No preamble, no "Here is the regenerated section", no meta-commentary.

Output the content for "${sectionName}" now:`;

    const stream = await groq.chat.completions.create({
      model: existingProject.modelUsed || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_MSG },
        { role: 'user', content: prompt },
      ],
      stream: true,
      max_tokens: 8192,
    });

    for await (const chunk of stream) {
      const chunkText = chunk.choices[0]?.delta?.content || '';
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ type: 'content', text: chunkText })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error regenerating section:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to regenerate section' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to complete generation' })}\n\n`);
      res.end();
    }
  }
};
