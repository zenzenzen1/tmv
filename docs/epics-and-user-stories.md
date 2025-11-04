## Epics and User Stories (Proposed Extensions Schema)

Context: Based on Proposed Extensions Schema in `fvcms/database-schema.md` to support all screens. Roles referenced: Admin, Trainer, Assessor, Department Head, Trainee/Member.

### Epic A: Challenge Cycles, Phases, and Teams Management

Business goal: Plan and manage recruitment/training cycles, phases, and team structures; monitor progress per phase and team.

- Acceptance: Data persisted in `challenge_cycles`, `challenge_phases`, `teams`, `team_members`, `phase_team_stats`.

User stories
- As an Admin, I can create/edit/archive a challenge cycle so that recruitment has a scoped timeline.
  - Acceptance criteria:
    - Create: name, description, start/end, status.
    - Update and archive; status transitions DRAFT→ACTIVE→COMPLETED→ARCHIVED.
    - Cycle list, search, filter by status.
- As an Admin, I can define phases under a cycle so that evaluations can be scheduled per stage.
  - Acceptance criteria:
    - Create phases with unique name per cycle, dates, status.
    - Prevent duplicate phase names in a cycle.
- As an Admin, I can create teams (F/V/C) per cycle so trainees can be organized.
  - Acceptance criteria:
    - Create team with code (unique per cycle) and optional name.
    - Prevent duplicate team code per cycle.
- As a Trainer, I can add/remove users to a team so membership reflects actual training groups.
  - Acceptance criteria:
    - Add user to team with timestamps, status ACTIVE/REMOVED.
    - Prevent duplicate membership; preserve history with left_at.
- As a Trainer, I can view phase-level team stats dashboard so I can track progress.
  - Acceptance criteria:
    - Show `current_members`, `eliminated_members`, required counts per phase/team.
    - Stats update when attendance/evaluations change.

### Epic B: Training Schedule and Attendance

Business goal: Plan training sessions, manage attendance (QR/geo), and capacity.

- Acceptance: Data persisted in `locations`, `training_sessions`, `session_attendance`, `session_qr_tokens`.

User stories
- As a Trainer, I can schedule training sessions for a cycle/team so trainees know when to attend.
  - Acceptance criteria:
    - Create session: title, period, location, capacity, cycle/team/phase linkage.
    - List/calendar view; filter by cycle, team, date.
- As a Trainer, I can generate a QR token for a session so trainees can check in securely.
  - Acceptance criteria:
    - Token has expiry, optional geo requirement; regenerate invalidates previous.
    - Show scannable code and validity window.
- As a Trainee, I can check in to a session using QR so my attendance is recorded.
  - Acceptance criteria:
    - Validate token and expiry; optional geo fence if required.
    - Record status PRESENT with timestamp.
- As a Trainer, I can mark attendance manually (PRESENT/ABSENT/LATE/EXCUSED) so records are accurate.
  - Acceptance criteria:
    - One record per session/user; edits tracked to audit log.
- As an Admin, I can enforce capacity and waitlist so rooms are not overbooked.
  - Acceptance criteria:
    - Capacity respected at registration/check-in; provide warnings and overflow handling.

### Epic C: Evaluation Scheduling, Assignments, and Results

Business goal: Run evaluations across phases, assign assessors, score trainees by criteria, and compute outcomes.

- Acceptance: Data persisted in `evaluation_schedules`, `evaluation_sessions`, `evaluator_assignments`, `trainee_evaluation_results`, `evaluation_criteria`, `evaluation_scores`.

User stories
- As an Admin, I can define evaluation schedules per cycle/phase/team so assessments are planned.
  - Acceptance criteria:
    - Create schedule: title, location, status lifecycle.
    - View schedules by filters; statuses PLANNED/IN_PROGRESS/COMPLETED/CANCELLED.
- As an Admin, I can create evaluation sessions under a schedule so time slots exist.
  - Acceptance criteria:
    - Set start/end and type (TECHNICAL/FITNESS/ATTITUDE/MIXED).
- As an Admin, I can assign assessors to sessions so evaluations are staffed.
  - Acceptance criteria:
    - Prevent duplicate assignment per session/assessor.
- As an Assessor, I can record trainee results in a session so outcomes are tracked.
  - Acceptance criteria:
    - Create per-trainee result with overall score, status (PASSED/FAILED/PENDING), comment.
    - One result per session/user; editable while session is in progress.
- As an Assessor, I can score by weighted criteria so overall score is computed consistently.
  - Acceptance criteria:
    - Define criteria with weights; record per-criterion scores and compute weighted sum.
    - Prevent duplicate criteria scores per result.
- As a Trainer, I can view evaluation dashboards so I can identify trainees at risk.
  - Acceptance criteria:
    - Aggregations by team/phase; trends over time; export CSV.

### Epic D: Events and Participation

Business goal: Plan non-training events, assign responsible teams/departments, and track attendance.

- Acceptance: Data persisted in `events`, `event_team_assignments`, `event_department_assignments`, `event_participation`.

User stories
- As an Admin, I can create and publish events so the club can participate.
  - Acceptance criteria:
    - Event status lifecycle (DRAFT/PUBLISHED/COMPLETED/CANCELLED), time, location, capacity.
- As an Admin, I can assign teams and departments to events so expectations are clear.
  - Acceptance criteria:
    - Prevent duplicates per event/team or event/department.
- As a Member, I can register for an event and check in so my participation is tracked.
  - Acceptance criteria:
    - Register/unregister; status transitions REGISTERED→ATTENDED/ABSENT; optional waitlist.
- As a Department Head, I can see who from my department attended so I can report participation.
  - Acceptance criteria:
    - Filters by department/team; export attendance list.

### Epic E: Capacity, Preferences, and Department Assignment

Business goal: Configure capacities and process trainee department placements with preferences and approvals.

- Acceptance: Data persisted in `department_capacity`, `team_capacity`, `trainee_preferences`, `department_assignments`.

User stories
- As an Admin, I can set capacity for departments and teams per cycle so planning is constrained.
  - Acceptance criteria:
    - Unique capacity per cycle/department/team; validation and audit.
- As a Trainee, I can submit ordered department preferences so assignments reflect my interests.
  - Acceptance criteria:
    - Capture priority values; prevent duplicates; edit before deadline.
- As a Department Head, I can review and update assignment status so intake decisions are recorded.
  - Acceptance criteria:
    - Workflow states PENDING→INTERVIEW→APPROVED/REJECTED; add notes.
- As an Admin, I can run an assignment process that honors capacity and preferences so fair allocations happen.
  - Acceptance criteria:
    - Deterministic rules with tie-breakers; idempotent reruns; summary report of placements and overflows.

### Epic F: Cycle-Scoped Audit Logging and Reporting

Business goal: Provide traceability for critical actions and enable reporting dashboards.

- Acceptance: Data persisted in `cycle_audit_logs`; reports derived from aggregates noted in schema.

User stories
- As an Admin, I can view audit logs filtered by actor, role, action, and time so compliance is maintained.
  - Acceptance criteria:
    - Index-backed filters; view details of target entities; export.
- As a Trainer, I can see who modified attendance/evaluation records so I can resolve disputes.
  - Acceptance criteria:
    - Correlate audit entries to sessions/events/results; show message and timestamp.
- As Leadership, I can view dashboards on conversion funnels and team performance so we can steer the program.
  - Acceptance criteria:
    - KPIs: funnel across membership→attendance→evaluation→assignment; team comparisons; time-series trends; CSV export.

### Cross-cutting NFRs

- Role-based access control aligned with `system_role` and competition roles where relevant.
- Data integrity via unique constraints defined in the schema; meaningful error messages.
- Performance: pagination and indexed filters on list screens; export in background for large datasets.
- Audit all state-changing actions into `cycle_audit_logs` with actor, role, action_type, and created_at.



