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

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: No user session found' });
      return;
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));
    
    if (!project) {
       res.status(404).json({ error: 'Project not found' });
       return;
    }
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

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const [updated] = await db.update(projects)
      .set({ documentData })
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
      
    if (!updated) {
      res.status(404).json({ error: 'Project not found or unauthorized' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal server error while updating project' });
  }
};

export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as JWTPayload)?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId));

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

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [deleted] = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Project not found or unauthorized' });
      return;
    }

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

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: Missing user information' });
      return;
    }

    if (!idea) {
      res.status(400).json({ error: 'Project idea is required' });
      return;
    }

    const modelName = model || 'llama-3.3-70b-versatile';

    const [newProject] = await db
      .insert(projects)
      .values({
        userId,
        idea,
        modelUsed: modelName,
      })
      .returning();

    res.status(201).json({ id: newProject.id });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal server error while creating project.' });
  }
};

export const streamProjectGeneration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const userId = (req.user as JWTPayload)?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [existingProject] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));

    if (!existingProject) {
      res.status(404).json({ error: 'Project not found or unauthorized' });
      return;
    }

    const { idea, modelUsed } = existingProject;
    if (!idea) {
      res.status(400).json({ error: 'Idea missing from project' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const prompt = `You are a senior software architect and technical writer with 15+ years of experience. Your job is to generate EXHAUSTIVE, PRODUCTION-READY project documentation for the following project idea.

CRITICAL RULES:
- Output ONLY a continuous Markdown document. No JSON, no commentary, no preamble.
- Every section starts with a SINGLE top-level heading: # Section Name
- Each section must be EXTREMELY detailed — minimum 400-600 words of rich content per section.
- Include real-world examples, specific technology names, code snippets, tables, lists.
- Write like you are documenting a real production system that a team of developers will use daily.
- Do NOT use vague filler text. Every sentence must contain actionable, specific information.
- Include subsections using ## and ### headings within each section.

You MUST produce ALL of the following 12 sections in this EXACT order:

# Overview

Include all of the following subsections with full detail:
## Executive Summary
Write 3-4 paragraphs about what the product is, the core problem it solves, who it's built for, and the key value it delivers. Think "investor pitch level" clarity.
## Core Value Proposition
List 5-7 specific, measurable benefits with explanations of how each is achieved.
## Use Cases
Describe 4-6 real-world use cases with personas — who the user is, what they need, how the product helps, what their workflow looks like.
## Key Features
A detailed table with columns: Feature | Description | Priority | Status. List at minimum 12 features.
## Technology Stack Summary
Table with: Layer | Technology | Version | Purpose. Cover frontend, backend, database, auth, AI/ML, storage, monitoring, deployment.
## Success Metrics
List 6-8 KPIs with descriptions of how they are measured (e.g. DAU, retention rate, API latency P99, error rate target, etc.)

# User Workflow

Include all of the following subsections:
## User Personas
Describe 3-4 user personas with name, role, technical level, goals, pain points, and how they use the product.
## Authentication Flow
Step-by-step description of registration, login, OAuth, token refresh, session management. Include a numbered flow diagram in text. Describe what happens on each step with specific endpoints called.
## Core User Journey — Primary Flow
Phase-by-phase detailed walkthrough of the end-to-end primary user journey from first visit to achieving the product's core value. Use numbered phases with descriptions.
## Core User Journey — Secondary Flows
2-3 additional important user journeys (e.g. admin flow, power user flow, API integration flow).
## Error Handling & Edge Cases
List at least 8 edge cases and how the system handles them gracefully.
## User Notifications & Feedback
What system notifications, emails, real-time updates, and UI feedback does the user receive?

# Design System

Include all of the following subsections:
## Design Philosophy
Describe the design philosophy, aesthetic direction, and UX principles.
## Color Palette
Full color table with: Name | Hex | Usage | Contrast Ratio. Minimum 12 colors covering primary, secondary, semantic states, neutrals, text hierarchy.
## Typography Scale
Table with: Role | Font Family | Weight | Size | Line Height | Usage. Minimum 6 type roles.
## Spacing & Grid System
Describe the spacing scale (4px base grid), grid system, breakpoints table with pixel values.
## Component Inventory
List all reusable UI components with their variants and states. Minimum 15 components.
## Animation & Interaction Principles
Describe transition timings, easing curves, hover states, loading states, micro-interactions.
## Accessibility Standards
WCAG compliance targets, color contrast requirements, keyboard navigation, ARIA labels, focus management.
## Dark/Light Theme Tokens
CSS custom property table for at least 20 design tokens.

# Roles & Auth

Include all of the following subsections:
## Authentication Architecture
Describe the full auth system — JWT vs session, token lifetimes, refresh strategy, secure cookie vs localStorage, HTTPS requirements.
## User Roles & Permissions
Detailed table: Role | Description | Permissions List | Access Level. Minimum 3 roles.
## Permission Matrix
Full table showing which roles can perform which actions. At least 15 actions × all roles.
## JWT Token Structure  
Show the exact JWT payload structure with all claims and their purposes.
## OAuth 2.0 Integration
Step-by-step OAuth flow with provider-specific details. Include callback URL structure, scope requests, token exchange.
## Security Hardening
List at least 12 specific security measures: rate limiting, bcrypt rounds, CORS policy, helmet headers, input sanitization, SQL injection prevention, XSS protection, CSRF tokens, brute force protection, 2FA, audit logs, IP allowlisting.
## Session Management
Describe token rotation, revocation strategy, concurrent session handling, logout behavior.

# Database Schema

Include all of the following subsections:
## Database Architecture
PostgreSQL version, hosting (Neon/RDS/etc.), connection pooling strategy, read replicas if applicable.
## Entity Relationship Overview
Describe all major entities and how they relate to each other (one-to-many, many-to-many relationships).
## Table Definitions
For EACH table, provide a full table definition like this:
### [TableName]
| Column | Type | Constraints | Default | Description |
Show all columns including id, created_at, updated_at, deleted_at for soft deletes. Include at minimum 6 tables each with 8+ columns.
## Indexes
List all database indexes with their purpose, columns indexed, and expected performance impact.
## Migrations Strategy
Describe how migrations are managed (Drizzle, Prisma, Flyway), naming conventions, rollback strategy.
## Data Seeding
Describe what seed data is needed for development and testing.
## Backup & Recovery
RTO/RPO targets, backup frequency, point-in-time recovery, disaster recovery plan.

# API Routes

Include all of the following subsections:
## API Design Principles
RESTful conventions, versioning strategy (/api/v1/), base URL structure, content types, status codes used.
## Authentication & Rate Limiting
How Bearer tokens are validated, rate limit tiers (requests/minute per role), 429 response format.
## Request/Response Format
Standard response envelope structure — success and error formats with examples.
## Route Groups
For EACH resource group, list ALL endpoints in this exact format:
### [Resource Group]
| Method | Endpoint | Auth | Description | Request Body | Response |

Cover ALL of the following groups: Auth, Users, [main resources], Admin. Minimum 25 total endpoints.
## Webhook Events
If applicable, list webhook event types, payload format, retry logic, signature verification.
## API Versioning
Strategy for versioning, deprecation notices, backward compatibility policy.
## Error Codes
Full table of custom error codes: Code | HTTP Status | Message | Description.

# Frontend

Include all of the following subsections:
## Framework & Architecture
Next.js version, App Router vs Pages Router choice, rendering strategies (SSR, SSG, ISR, CSR) for each page type with justification.
## Folder Structure
Show the complete frontend folder structure as a code block using explicit ASCII tree characters (├── and └──). Include every major directory (components, hooks, lib, contexts, etc.).
## Page Inventory
Full table: Route | Component | Rendering | Auth Required | Description. Every page in the app.
## State Management
Global state solution, local component state patterns, server state (React Query/SWR), form state.
## Key Components
For each major component, describe: Props interface, behavior, dependencies. Minimum 10 components.
## Data Fetching Patterns
How API calls are made, error handling, loading states, optimistic updates, caching strategy.
## Performance Optimization
Code splitting, lazy loading, image optimization, bundle size targets, Core Web Vitals targets (LCP, FID, CLS).
## Third-Party Integrations
Every external library/service with version and specific purpose.

# Backend

Include all of the following subsections:
## Architecture Pattern
Express/Fastify, layered architecture (routes → controllers → services → repositories), dependency injection, error handling middleware.
## Folder Structure
Complete backend folder tree as a code block using explicit ASCII tree characters (├── and └──). Example: src/ ├── modules/ ├── config/ ├── middleware/ etc.
## Module Breakdown
For each module: responsibility, files, exported functions. Cover auth, users, all main resources, common utilities.
## Middleware Stack
Every middleware in order: helmet, cors, rate limiting, body parsing, auth, request logging, error handler.
## Service Layer
Business logic patterns, external service integrations, background jobs, queue system if applicable.
## Caching Strategy
Redis/memory cache usage, cache keys, TTL values, cache invalidation approach.
## Logging & Observability
Logging library, log levels, structured log format, correlation IDs, what is logged per request.
## Background Jobs
Any cron jobs or async processing with schedule, purpose, and failure handling.

# Project Structure

Include all of the following subsections:
## Monorepo vs Polyrepo Decision
Rationale for chosen structure.
## Complete File Tree
Show the FULL project file tree as a code block using explicit ASCII branch characters (├── and └──) — every directory and key file. Include all config files (.env.example, tsconfig, drizzle.config, next.config, etc.)
## Configuration Files
For each major config file, explain every key setting and why it is set that way.
## Environment Variables
Full table: Variable | Required | Default | Description. Cover ALL env vars for both frontend and backend. Minimum 20 variables.
## npm Scripts  
Table of all package.json scripts: Script | Command | Description.
## Git Workflow
Branch naming convention, commit message format (Conventional Commits), PR process, code review requirements.

# AI Integration

Include all of the following subsections:
## AI Provider & Model Selection
Groq API, models used, why each model was chosen (speed, context window, capability), fallback models.
## Prompt Engineering
The prompt templates used, system messages, few-shot examples if any, how prompts are structured for best output quality.
## Streaming Architecture
How SSE (Server-Sent Events) streaming works end-to-end: server → client. Include the data format of each event type.
## Token Management
Estimated token usage per request, cost estimation, token limit handling, truncation strategy.
## AI Response Parsing
How raw AI markdown output is parsed into structured sections. The regex/parsing approach.
## Error Handling
What happens on API timeout, rate limit, model error, partial generation. Fallback strategies.
## Quality Control
How to validate AI output quality, human review steps, regeneration triggers.
## Future AI Enhancements
5+ specific AI features that could be added (e.g., smart suggestions, diagram generation, auto-updating docs).

# Deployment

Include all of the following subsections:
## Infrastructure Overview
Cloud providers, services used, architecture diagram in text (describe the components and connections).
## Environment Strategy
Development, Staging, Production environments — what differs between them, what stays the same.
## Frontend Deployment (Vercel)
Vercel project config, environment variables to set, build command, output directory, preview deployments.
## Backend Deployment
Platform (Railway/Render/Fly.io/AWS), Dockerfile or build process, health check endpoint, graceful shutdown.
## Database Deployment
Neon PostgreSQL setup, connection string format, pooler vs direct connection, SSL configuration.
## CI/CD Pipeline
Full GitHub Actions workflow description: trigger → lint → test → build → deploy steps. Include the workflow stages and what each does.
## Environment Variables per Environment
Table showing which env vars differ per environment.
## Monitoring & Alerting
Error tracking (Sentry), uptime monitoring, log aggregation, alert thresholds, on-call process.
## Performance Targets  
SLA targets: uptime %, API latency P50/P95/P99, DB query time targets, frontend load time.
## Rollback Strategy
How to roll back a bad deployment, database migration rollback, feature flags.
## Scaling Strategy
Horizontal scaling triggers, auto-scaling config, database connection pool sizing.

# Extra Features

Include all of the following subsections:
## Roadmap
3-phase roadmap: v1 (MVP), v2 (Growth), v3 (Scale). List 5-8 features per phase.
## Advanced Features Backlog
At minimum 16 features across these categories, each with description, technical approach, and effort estimate:
- 🔔 Notifications & Communication (minimum 3)
- 📊 Analytics & Insights (minimum 3)
- 🤝 Collaboration & Sharing (minimum 2)
- 🔌 Integrations & API (minimum 3)
- 📱 Mobile & PWA (minimum 2)
- 🔒 Advanced Security (minimum 2)
- ⚡ Performance & DX (minimum 1)
## Technical Debt & Known Limitations
List 5+ known limitations of v1 with planned solutions.
## Security Audit Checklist
At least 15-item security checklist specific to this application.
## Testing Strategy
Unit tests (what to test, tools), integration tests (API testing with Supertest), E2E tests (Playwright), coverage targets.
## Documentation Maintenance
How to keep docs updated, doc-as-code approach, who owns documentation.

---
Project Idea to document: ${idea}

Remember: Be EXHAUSTIVE and SPECIFIC. A developer reading this should be able to build the entire application from scratch using only this documentation. Every table should be filled with real, project-specific data — not placeholder text.
IMPORTANT: Whenever you output a Folder Structure or File Tree, YOU MUST use a markdown code block AND include standard ASCII tree branches (├── and └──) so it renders correctly.`;

    const stream = await groq.chat.completions.create({
      model: modelUsed || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a world-class technical documentation writer and software architect. You write exhaustive, production-grade documentation. You always write specific, detailed content — never generic filler. Every section contains multiple subsections with tables, code blocks, specific technology names, real examples, and actionable information.'
        },
        { role: 'user', content: prompt }
      ],
      stream: true,
      max_tokens: 32000,
    });

    let generatedContent = '';

    for await (const chunk of stream) {
      const chunkText = chunk.choices[0]?.delta?.content || '';
      if (chunkText) {
        generatedContent += chunkText;
        res.write(`data: ${JSON.stringify({ type: 'content', text: chunkText })}\n\n`);
      }
    }

    // Parse the markdown into structured JSON sections
    const sections: Record<string, string> = {};
    const regex = /(?:^|\n)#\s+([^\n]+)\n([\s\S]*?)(?=(?:\n#\s+|$))/g;
    let match;
    while ((match = regex.exec(generatedContent)) !== null) {
      const sectionName = match[1].trim();
      const sectionContent = match[2].trim();
      if (sectionName && sectionContent) {
        sections[sectionName] = sectionContent;
      }
    }

    await db
      .update(projects)
      .set({
        documentData: Object.keys(sections).length > 0 ? sections : { Document: generatedContent },
      })
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

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const [existingProject] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)));

    if (!existingProject) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const prompt = `You are updating a specific section of a technical document for a project.
Project Idea: ${existingProject.idea}
Section to Regenerate: "${sectionName}"

User Instructions for this regeneration (CRITICAL):
"${instructions || 'Rewrite this section to be more detailed, exhaustive, and professional.'}"

Rules:
1. Output ONLY the new content for this section.
2. Use Markdown formatting. Use tables, bold text, numbered lists, and code blocks aggressively.
3. DO NOT wrap the output in a main "# ${sectionName}" header. Start immediately with the content or "## " subheaders.
4. Do not include any pleasantries or conversational text. Just the technical content.
5. IMPORTANT: Whenever you output a Folder Structure or File Tree, YOU MUST use a markdown code block AND include standard ASCII tree branches (├── and └──) so it renders correctly.

Write the updated content for "${sectionName}" now:`;

    const stream = await groq.chat.completions.create({
      model: existingProject.modelUsed || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a world-class technical documentation writer updating a document section. You output exactly the content requested, with no pleasantries or preambles.'
        },
        { role: 'user', content: prompt }
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
