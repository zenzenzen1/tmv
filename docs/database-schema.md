## Database Schema (Derived from Backend Entities)

This document defines the database schema strictly based on the current backend entities under `fvc-api/src/main/java/sep490g65/fvcapi/entity`. It outlines tables, fields, relationships, unique constraints, and indexes, and briefly maps them to the business features/screens described.

Notes
- All IDs using `@GeneratedValue(strategy = GenerationType.UUID)` are UUID strings unless otherwise noted.
- Timestamps, auditing, and common fields may be inherited from `BaseEntity` (not expanded here as it is not shown). Assume typical `createdAt`, `updatedAt` if present in entities.
- Only entities present in the backend are included as definitive schema. Feature areas not represented by entities are listed as “Proposed extensions”.

### 1) Users and Members

Table: `users` (entity: `User`)
- Purpose: System accounts and roles used across all features.
- `id` (PK, UUID)
- `full_name` (nullable) — display name
- `personal_mail` (nullable) — login/contact
- `edu_mail` (nullable) — optional school email
- `hash_password` (nullable) — credential hash
- `student_code` (nullable) — student ID
- `status` (Boolean) — active state
- `dob` (date) — date of birth
- `gender` (varchar(10))
- `system_role` (enum `SystemRole`, not null) — access control
- `is_in_challenge` (Boolean) — enrolled in current cycle
- relationships:
  - `competition_roles` (1-to-many to `competition_roles.user_id`)
  - `assigned_competition_roles` (1-to-many to `competition_roles.assigned_by`)
  - `submitted_application_forms` (1-to-many)

Table: `club_members` (entity: `ClubMember`)
- Purpose: Snapshot of club membership profile for UI lists and operations.
- `id` (PK, UUID)
- `user_id` (FK → `users.id`, not null)
- `full_name` (not null)
- `email` (not null)
- `student_code` (nullable)
- `phone` (nullable)
- `gender` (varchar(10))
- `joined_at` (date)
- `department` (varchar, nullable)
- `status` (enum: ACTIVE/INACTIVE/PENDING, not null)

Table: `departments` (entity: `Department`)
- Purpose: Departments used in assignment and capacity features.
- `id` (PK, UUID)
- `name` (varchar(100), unique, not null)

Screen mapping
- Member management and user profile screens use `users` and `club_members`.
- Department references exist as a simple lookup via `departments`.

### 2) Competitions and Roles

Table: `competitions` (entity: `Competition`)
- Purpose: Tournament/competition configuration and lifecycle.
- `id` (PK, UUID)
- `name` (varchar(200), not null)
- `start_date` (date)
- `end_date` (date)
- `registration_start_date` (date)
- `registration_end_date` (date)
- `number_of_participants` (int)
- `draw_date` (date)
- `weigh_in_date` (date)
- `description` (varchar(1000))
- `location` (varchar(200))
- `opening_ceremony_time` (time)
- `status` (enum `TournamentStatus`, not null, default DRAFT)
- `form_status` (converted enum `FormStatus`)
- relationships:
  - `vovinam_sparring_configs` (1-to-many)
  - `competition_music_integrated_performance` (1-to-many via junction)
  - `competition_fist_item_selections` (1-to-many via junction)

Table: `competition_roles` (entity: `CompetitionRole`)
- Purpose: Who does what in a competition (judge, admin, etc.).
- `id` (PK, UUID)
- `competition_id` (FK → `competitions.id`, not null)
- `user_id` (FK → `users.id`, not null)
- `role` (enum `CompetitionRoleType`, not null)
- `assigned_by` (FK → `users.id`, nullable)
- Unique constraint: (`competition_id`, `user_id`, `role`)

Table: `competition_orders` (entity: `CompetitionOrder`)
- Purpose: Running order for athletes/content during a competition.
- `id` (PK, UUID)
- `competition_id` (FK → `competitions.id`, not null)
- `content_selection_id` (FK → `competition_fist_item_selections.id`, nullable)
- `order_index` (int, not null)
- Unique constraint: (`competition_id`, `content_selection_id`, `order_index`)
- Index: `idx_competition_orders_competition` on `competition_id`

Screen mapping
- Tournament list/detail/edit, role assignment, and bracket/order management map to `competitions`, `competition_roles`, `competition_orders`.

### 3) Sparring Configs and Weight Classes

Table: `vovinam_sparring_configs` (entity: `VovinamSparringConfig`)
- Purpose: Sparring ruleset per competition (rounds, durations, etc.).
- `id` (PK, UUID)
- `competition_id` (FK → `competitions.id`, not null)
- `number_of_rounds` (int, not null, default 2)
- `round_duration_seconds` (int, not null, default 90)
- `allow_extra_round` (bool, not null, default true)
- `max_extra_rounds` (int, not null, default 1)
- `tie_break_rule` (varchar(50), not null, e.g., WEIGHT | DRAW | RANDOM)
- `assessor_count` (int, not null, default 5)
- `injury_timeout_seconds` (int, not null, default 60)

Table: `weight_classes` (entity: `WeightClass`)
- Purpose: Defined weight bands for sparring.
- `id` (PK, UUID)
- `gender` (enum `Gender`, not null)
- `weight_class` (varchar(50), derived label; see min/max)
- `min_weight` (decimal(5,2))
- `max_weight` (decimal(5,2))
- `note` (varchar(255))
- `status` (enum `WeightClassStatus`, not null, default DRAFT)

Table: `vovinam_sparring_config_weight_classes` (entity: `VovinamSparringConfigWeightClass`)
- Purpose: Junction linking a sparring config with permissible weight classes.
- `id` (PK, UUID)
- `vovinam_sparring_config_id` (FK → `vovinam_sparring_configs.id`, not null)
- `weight_class_id` (FK → `weight_classes.id`, not null)
- Unique constraint: `uk_sparring_weightclass_unique` on (`vovinam_sparring_config_id`, `weight_class_id`)

Screen mapping
- Arrange sparring configs and weight classes; duplicate prevention aligns with unique constraints above.

### 4) Fist Content Configurations

Table: `vovinam_fist_configs` (entity: `VovinamFistConfig`)
- Purpose: Catalog of fist configurations (forms/sets).
- `id` (PK, UUID)
- `name` (varchar(255), not null)
- `description` (text)
- `status` (Boolean)

Table: `vovinam_fist_items` (entity: `VovinamFistItem`)
- Purpose: Hierarchical fist items belonging to a fist config.
- `id` (PK, UUID)
- `vovinam_fist_config_id` (FK → `vovinam_fist_configs.id`, not null)
- `parent_id` (FK → `vovinam_fist_items.id`, nullable) — supports hierarchical items
- `name` (varchar(255), not null)
- `description` (text)
- `level` (int, nullable)

Table: `competition_fist_item_selections` (entity: `CompetitionFistItemSelection`)
- Purpose: Selected fist items used in a specific competition.
- `id` (PK, UUID)
- `competition_id` (FK → `competitions.id`, not null)
- `vovinam_fist_config_id` (FK → `vovinam_fist_configs.id`, not null)
- `vovinam_fist_item_id` (FK → `vovinam_fist_items.id`, not null)
- Unique constraint: (`competition_id`, `vovinam_fist_config_id`, `vovinam_fist_item_id`)

Screen mapping
- Fist content selection for competitions uses the selection junction with unique constraint to avoid duplicates.

### 5) Music Integrated Performances

Table: `music_integrated_performances` (entity: `MusicIntegratedPerformance`)
- Purpose: Music content library for competitions.
- `id` (PK, UUID)
- `name` (varchar(255), not null)
- `description` (text)
- `music_file_path` (varchar, nullable)
- `duration_seconds` (int)
- `difficulty_level` (varchar)
- `performance_type` (varchar)
- `is_active` (Boolean)

Table: `competition_music_integrated_performance` (entity: `CompetitionMusicIntegratedPerformance`)
- Purpose: Junction linking competition with music performances.
- `id` (PK, UUID)
- `competition_id` (FK → `competitions.id`, not null)
- `music_integrated_performance_id` (FK → `music_integrated_performances.id`, not null)
- Unique constraint: (`competition_id`, `music_integrated_performance_id`)

Screen mapping
- Music content linking per competition uses the junction with uniqueness to prevent duplicates.

### 6) Athletes

Table: `athletes` (entity: `Athlete`)
- Purpose: Registered participants and their competition linkage.
- `id` (PK, UUID auto)
- `tournament_id` (string, not null) — logical grouping
- `full_name` (not null)
- `email` (not null)
- `student_id` (nullable)
- `gender` (enum)
- `club` (nullable)
- `competition_type` (enum: fighting | quyen | music, not null)
- `sub_competition_type` (string, nullable)
- `status` (enum: NOT_STARTED | IN_PROGRESS | DONE | VIOLATED, not null)
- `competition_order` (int, nullable) — index/order value
- `competition_order_id` (FK → `competition_orders.id`, nullable)
- `competition_id` (FK → `competitions.id`, nullable)
- Optional tight linking IDs (nullable FKs by value): `weight_class_id`, `fist_config_id`, `fist_item_id`, `music_content_id`
- Indexes:
  - `idx_athlete_tournament_email` unique on (`tournament_id`, `email`)
  - `idx_athlete_competition_type` on `competition_type`

Screen mapping
- Athlete registration and ordering/brackets tie into `athletes` with references to competition, content selections, and orders.

---

## Error Codes and Constraints Alignment

- Duplicate protection:
  - `uk_sparring_weightclass_unique` on `vovinam_sparring_config_weight_classes`.
  - Unique on `competition_music_integrated_performance (competition_id, music_integrated_performance_id)`.
  - Unique on `competition_fist_item_selections (competition_id, vovinam_fist_config_id, vovinam_fist_item_id)`.
  - Unique on `competition_roles (competition_id, user_id, role)`.
  - Unique on `athletes (tournament_id, email)`.
- Backend maps certain `DataIntegrityViolationException` cases to error codes like `COMP_008` (duplicate weight class link) and `COMP_009` (duplicate content link), enabling clear frontend messages.

---

## Screen-to-Entity Coverage

Covered by current entities
- Competition Management: `competitions`, `vovinam_sparring_configs`, `vovinam_sparring_config_weight_classes`, `competition_music_integrated_performance`, `vovinam_fist_configs`, `vovinam_fist_items`, `competition_fist_item_selections`, `competition_roles`, `competition_orders`, `athletes`.
- Member/User basics: `users`, `club_members`, `departments` (lookup).

Not yet present as entities (Proposed extensions for future implementation)
- Training schedule & attendance: training sessions, attendance records, locations.
- Evaluation management: evaluation sessions, assessor assignments, scoring, criteria, results.
- Team structure: explicit `teams`, `team_memberships` and team-based statistics.
- Events and event attendance: events, event assignments, event participation, capacity.
- Audit logs scoped to cycle/training/evaluation actions.

These proposed features are referenced by the UI mockups but will require new entities/tables to persist data. They are intentionally not specified here to keep this document aligned with the existing backend codebase. A separate proposal can define these tables once the corresponding entities are introduced in the backend.

---

## Proposed Extensions Schema (to support all screens)

The following schema extensions are proposed to fully support the discussed screens. Names are suggestions; final names should follow existing package/entity conventions. Foreign keys point to existing tables where applicable.

### A) Challenge Cycles, Phases, Teams

Table: `challenge_cycles`
- Purpose: Top-level recruitment cycle (e.g., Xuân 2024).
- `id` (PK, UUID)
- `name` (varchar(200), not null)
- `description` (text)
- `start_date` (date)
- `end_date` (date)
- `status` (enum: DRAFT | ACTIVE | COMPLETED | ARCHIVED)

Table: `challenge_phases`
- Purpose: Sub-periods within a cycle used for evaluation and tracking.
- `id` (PK, UUID)
- `cycle_id` (FK → `challenge_cycles.id`, not null)
- `name` (varchar(150), not null) — e.g., Giai đoạn 1
- `start_date` (date)
- `end_date` (date)
- `status` (enum: NOT_STARTED | IN_PROGRESS | DONE)
- Unique: (`cycle_id`, `name`)

Table: `teams`
- Purpose: Teams (F, V, C) per cycle.
- `id` (PK, UUID)
- `cycle_id` (FK → `challenge_cycles.id`, not null)
- `code` (varchar(10), not null) — e.g., F, V, C
- `name` (varchar(100))
- Unique: (`cycle_id`, `code`)

Table: `team_members`
- Purpose: Membership of users in teams; supports removal/history.
- `id` (PK, UUID)
- `team_id` (FK → `teams.id`, not null)
- `user_id` (FK → `users.id`, not null)
- `joined_at` (timestamp)
- `left_at` (timestamp, nullable)
- `status` (enum: ACTIVE | REMOVED)
- Unique: (`team_id`, `user_id`)

Table: `phase_team_stats`
- Purpose: Aggregated numbers per phase/team for progress widgets.
- `id` (PK, UUID)
- `phase_id` (FK → `challenge_phases.id`, not null)
- `team_id` (FK → `teams.id`, not null)
- `current_members` (int, not null, default 0)
- `eliminated_members` (int, not null, default 0)
- Aggregates: `train_sessions_required`, `events_required`, `fitness_evals_required` (int)
- Unique: (`phase_id`, `team_id`)

### B) Training Schedule Management & Attendance

Table: `locations`
- Purpose: Normalized place data for sessions/events.
- `id` (PK, UUID)
- `name` (varchar(150), not null)
- `address` (varchar(255))
- `lat`/`lng` (decimal(10,7), decimal(10,7), nullable)

Table: `training_sessions`
- Purpose: Calendar sessions for training.
- `id` (PK, UUID)
- `cycle_id` (FK → `challenge_cycles.id`, not null)
- `team_id` (FK → `teams.id`, nullable for all-team)
- `phase_id` (FK → `challenge_phases.id`, nullable)
- `title` (varchar(150), not null)
- `start_time` (timestamp, not null)
- `end_time` (timestamp, not null)
- `location_id` (FK → `locations.id`, nullable)
- `capacity` (int, nullable)
- Index: (`cycle_id`, `team_id`, `start_time`)

Table: `session_attendance`
- Purpose: Per-user attendance per training session.
- `id` (PK, UUID)
- `session_id` (FK → `training_sessions.id`, not null)
- `user_id` (FK → `users.id`, not null)
- `status` (enum: PRESENT | ABSENT | LATE | EXCUSED)
- `checked_in_at` (timestamp, nullable)
- `note` (varchar(255), nullable)
- Unique: (`session_id`, `user_id`)

Table: `session_qr_tokens`
- Purpose: Generated QR tokens for session check-in with optional geo fence.
- `id` (PK, UUID)
- `session_id` (FK → `training_sessions.id`, not null)
- `token` (varchar(64), unique, not null)
- `expires_at` (timestamp, not null)
- `geo_required` (bool, default false)

### C) Evaluation Management (Schedule, Assignments, Results)

Table: `evaluation_schedules`
- Purpose: Planned evaluation blocks (by cycle/team/phase).
- `id` (PK, UUID)
- `cycle_id` (FK → `challenge_cycles.id`, not null)
- `phase_id` (FK → `challenge_phases.id`, nullable)
- `team_id` (FK → `teams.id`, nullable)
- `title` (varchar(150), not null)
- `status` (enum: PLANNED | IN_PROGRESS | COMPLETED | CANCELLED)
- `location_id` (FK → `locations.id`, nullable)

Table: `evaluation_sessions`
- Purpose: Concrete evaluation session windows.
- `id` (PK, UUID)
- `schedule_id` (FK → `evaluation_schedules.id`, not null)
- `start_time` (timestamp)
- `end_time` (timestamp)
- `type` (enum: TECHNICAL | FITNESS | ATTITUDE | MIXED)

Table: `evaluator_assignments`
- Purpose: Which assessors judge which session.
- `id` (PK, UUID)
- `session_id` (FK → `evaluation_sessions.id`, not null)
- `assessor_id` (FK → `users.id`, not null)
- Unique: (`session_id`, `assessor_id`)

Table: `trainee_evaluation_results`
- Purpose: Scores/outcome per trainee within a session.
- `id` (PK, UUID)
- `session_id` (FK → `evaluation_sessions.id`, not null)
- `user_id` (FK → `users.id`, not null)
- `overall_score` (decimal(5,2))
- `status` (enum: PASSED | FAILED | PENDING)
- `comment` (text)
- Unique: (`session_id`, `user_id`)

Table: `evaluation_criteria`
- Purpose: Weighted criteria catalog used to compute overall score.
- `id` (PK, UUID)
- `name` (varchar(100), not null) — e.g., Kỹ thuật, Thể lực, Thái độ
- `weight` (decimal(5,2), not null) — sum to 100 per session template

Table: `evaluation_scores`
- Purpose: Per-criterion score per trainee result.
- `id` (PK, UUID)
- `result_id` (FK → `trainee_evaluation_results.id`, not null)
- `criteria_id` (FK → `evaluation_criteria.id`, not null)
- `score` (decimal(5,2), not null)
- Unique: (`result_id`, `criteria_id`)

### D) Events & Participation

Table: `events`
- Purpose: Non-training events within a cycle.
- `id` (PK, UUID)
- `cycle_id` (FK → `challenge_cycles.id`, not null)
- `title` (varchar(200), not null)
- `start_time` (timestamp, not null)
- `end_time` (timestamp, not null)
- `location_id` (FK → `locations.id`, nullable)
- `capacity` (int, nullable)
- `status` (enum: DRAFT | PUBLISHED | COMPLETED | CANCELLED)

Table: `event_team_assignments`
- Purpose: Which teams are expected to join an event.
- `id` (PK, UUID)
- `event_id` (FK → `events.id`, not null)
- `team_id` (FK → `teams.id`, not null)
- Unique: (`event_id`, `team_id`)

Table: `event_department_assignments`
- Purpose: Which departments are responsible/participating in an event.
- `id` (PK, UUID)
- `event_id` (FK → `events.id`, not null)
- `department_id` (FK → `departments.id`, not null)
- Unique: (`event_id`, `department_id`)

Table: `event_participation`
- Purpose: User-level participation and attendance for events.
- `id` (PK, UUID)
- `event_id` (FK → `events.id`, not null)
- `user_id` (FK → `users.id`, not null)
- `status` (enum: REGISTERED | ATTENDED | ABSENT | WAITLISTED)
- `checked_in_at` (timestamp, nullable)
- Unique: (`event_id`, `user_id`)

### E) Capacity Settings & Assignment Processing

Table: `department_capacity`
- Purpose: Capacity per department per cycle to support allocations.
- `id` (PK, UUID)
- `cycle_id` (FK → `challenge_cycles.id`, not null)
- `department_id` (FK → `departments.id`, not null)
- `capacity` (int, not null)
- Unique: (`cycle_id`, `department_id`)

Table: `team_capacity`
- Purpose: Capacity per team per cycle.
- `id` (PK, UUID)
- `cycle_id` (FK → `challenge_cycles.id`, not null)
- `team_id` (FK → `teams.id`, not null)
- `capacity` (int, not null)
- Unique: (`cycle_id`, `team_id`)

Table: `trainee_preferences`
- Purpose: Ordered department preferences from trainees.
- `id` (PK, UUID)
- `cycle_id` (FK → `challenge_cycles.id`, not null)
- `user_id` (FK → `users.id`, not null)
- `department_id` (FK → `departments.id`, not null)
- `priority` (int, not null) — 1 = highest
- Unique: (`cycle_id`, `user_id`, `department_id`)

Table: `department_assignments`
- Purpose: Assignment outcomes and workflow state per trainee.
- `id` (PK, UUID)
- `cycle_id` (FK → `challenge_cycles.id`, not null)
- `user_id` (FK → `users.id`, not null)
- `department_id` (FK → `departments.id`, not null)
- `assigned_by` (FK → `users.id`, nullable)
- `status` (enum: PENDING | INTERVIEW | APPROVED | REJECTED)
- `note` (varchar(255))
- Unique: (`cycle_id`, `user_id`)

### F) Cycle-Scoped Audit Logs

Table: `cycle_audit_logs`
- Purpose: All cycle-scoped actions by actors (trainer/trainee/etc.) for traceability.
- `id` (PK, UUID)
- `cycle_id` (FK → `challenge_cycles.id`, not null)
- `actor_id` (FK → `users.id`, not null)
- `role` (enum: TRAINER | TRAINEE | MASTER_ASSESSOR | DEPT_HEAD | ADMIN)
- `action_type` (enum: CHECKIN | ATTENDANCE_EDIT | EVALUATION_SUBMIT | PREFERENCE_UPDATE | INTERVIEW_SCHEDULE | APPROVAL | EVENT_JOIN | EVENT_CHECKIN | SESSION_CREATE | SESSION_EDIT)
- `target_type` (enum: SESSION | EVALUATION | EVENT | TEAM | DEPARTMENT | PHASE | USER)
- `target_id` (varchar, nullable)
- `message` (text)
- `created_at` (timestamp, not null)
- Indexes on (`cycle_id`, `created_at`), (`role`), (`action_type`)

---

## Reporting Notes

- Most reporting views (Recruitment Analytics, Performance Reports, System/Cycle Reports) can be generated from the above tables via aggregates:
  - Conversion funnel: counts across `team_members`, `session_attendance`, `trainee_evaluation_results`, and `department_assignments` by status.
  - Team performance comparisons: `phase_team_stats`, aggregates on `session_attendance` and `trainee_evaluation_results` by team/phase.
  - Department distribution/capacity: `department_capacity`, `department_assignments`.
  - Evaluation trends: time-series from `evaluation_sessions` + `trainee_evaluation_results`.
  - Attendance analytics: `training_sessions` + `session_attendance`.
  - Audit summaries: `cycle_audit_logs`.


