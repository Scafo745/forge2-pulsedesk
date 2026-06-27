# Sprint 01 -- Database Schema, User Roles & Seeders

Goal: Design and build the full database migrations, user auth traits, and rich seeder data.
Models: Hermes=deepseek/deepseek-v4-pro, OpenClaw=z-ai/glm-5.1

## Issues
- [x] #1 Organizations and Users tables migration and Sanctum user auth traits
- [x] #2 Migrations for Tickets, Comments, SLA Policies, and Activity Logs
- [x] #3 Database Seeder (1 tenant, 1 admin, 2 agents, 2 customers, and ~12 tickets in various states)

## Outcome
- Shipped: Database migrations, Eloquent models and database seeding data. All 6 tables are successfully configured with constraints and foreign key relationships.
- Slipped / moved to next sprint: None
- PRs: PR #1 (reorganize database schema, seeders, and models)
