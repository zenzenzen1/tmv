# Class Specifications - Controllers

## 3. Class Specifications

### 3.1 sep490g65.fvcapi.controller

#### 3.1.1 ApplicationFormController

- Brief description: REST controller for managing application form configurations. Provides endpoints for creating, listing (with pagination), retrieving by ID/type/slug, and updating application forms. Base route: `ApiConstants.API_BASE_PATH + "/application-forms"`.

- Attributes

  - 01
    - Name: `applicationFormService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.ApplicationFormService`
    - Purpose: Handles application form business logic operations.
  - 02
    - Name: `applicationFormConfigRepository`
    - Visibility: private
    - Type: `sep490g65.fvcapi.repository.ApplicationFormConfigRepository`
    - Purpose: Direct repository access for special queries (e.g., finding public forms by slug).

- Methods/Operations
  - 01
    - Name: `create`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ApplicationFormConfigResponse>>`
    - Purpose: Create a new application form configuration.
    - Parameters:
      - `request: CreateApplicationFormConfigRequest` — form configuration data, validated
  - 02
    - Name: `listAll`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<ApplicationFormConfigResponse>>>`
    - Purpose: Retrieve all application form configurations.
    - Parameters: None
  - 03
    - Name: `listPaginated`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Page<ApplicationFormConfigResponse>>>`
    - Purpose: Retrieve paginated list of form configurations with optional filtering.
    - Parameters:
      - `page: int` — page number (default 0)
      - `size: int` — page size (default 10)
      - `search: String` — optional search keyword
      - `dateFrom: String` — optional start date filter
      - `dateTo: String` — optional end date filter
      - `status: String` — optional status filter
  - 04
    - Name: `getById`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ApplicationFormConfigResponse>>`
    - Purpose: Get a form configuration by ID.
    - Parameters:
      - `id: String` — form configuration identifier
  - 05
    - Name: `getByFormType`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ApplicationFormConfigResponse>>`
    - Purpose: Get a form configuration by form type enum.
    - Parameters:
      - `formType: ApplicationFormType` — form type enum
  - 06
    - Name: `getPublicBySlug`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ApplicationFormConfigResponse>>`
    - Purpose: Public endpoint to get a published or postponed form by public slug.
    - Parameters:
      - `slug: String` — public slug of the form
  - 07
    - Name: `getByIdentifier`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ApplicationFormConfigResponse>>`
    - Purpose: Get a form configuration by identifier (tries enum type first, then ID, returns 404 if not found).
    - Parameters:
      - `identifier: String` — either enum type name or ID
  - 08
    - Name: `updateById`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ApplicationFormConfigResponse>>`
    - Purpose: Update a form configuration by ID.
    - Parameters:
      - `id: String` — form configuration identifier
      - `request: UpdateApplicationFormConfigRequest` — update data, validated
  - 09
    - Name: `update`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ApplicationFormConfigResponse>>`
    - Purpose: Update a form configuration by form type enum.
    - Parameters:
      - `formType: ApplicationFormType` — form type enum
      - `request: UpdateApplicationFormConfigRequest` — update data, validated
  - 10
    - Name: `updateByIdentifier`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ApplicationFormConfigResponse>>`
    - Purpose: Update a form configuration by identifier (tries enum type first, then ID).
    - Parameters:
      - `identifier: String` — either enum type name or ID
      - `request: UpdateApplicationFormConfigRequest` — update data, validated
  - 11
    - Name: `initClubRegistrationForm`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ApplicationFormConfigResponse>>`
    - Purpose: Initialize default club registration form configuration.
    - Parameters: None
  - 12
    - Name: `postponeClubRegistrationForm`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ApplicationFormConfigResponse>>`
    - Purpose: Postpone the club registration form.
    - Parameters: None

---

#### 3.1.2 AthleteController

- Brief description: REST controller for managing athlete entities. Provides endpoints for listing athletes with filtering, retrieving by competition and weight class, arranging order, updating seed numbers, and updating athlete statuses. Base route: `ApiConstants.API_BASE_PATH + "/athletes"`.

- Attributes

  - 01
    - Name: `athleteService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.AthleteService`
    - Purpose: Handles athlete business logic operations.

- Methods/Operations
  - 01
    - Name: `list`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<AthleteResolvedResponse>>>`
    - Purpose: Retrieve paginated list of athletes with extensive filtering options, enriched with detail labels and team information.
    - Parameters:
      - `page: int` — page number (default 0)
      - `size: int` — page size (default 5)
      - `competitionId: String` — optional competition filter
      - `competitionType: Athlete.CompetitionType` — optional competition type filter
      - `subCompetitionType: String` — optional sub-competition type filter
      - `detailSubCompetitionType: String` — optional detailed sub-type filter
      - `name: String` — optional athlete name filter
      - `gender: Athlete.Gender` — optional gender filter
      - `status: Athlete.AthleteStatus` — optional status filter
  - 02
    - Name: `getByCompetitionAndWeightClass`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<AthleteResolvedResponse>>>`
    - Purpose: Get athletes filtered by competition and weight class, enriched with detail labels.
    - Parameters:
      - `competitionId: String` — competition identifier
      - `weightClassId: String` — weight class identifier
  - 03
    - Name: `arrangeOrder`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Arrange fighting order for athletes in a competition (placeholder for future implementation).
    - Parameters:
      - `request: ArrangeFistOrderRequest` — arrange order data, validated
  - 04
    - Name: `updateSeedNumbers`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Update seed numbers for multiple athletes, with logging.
    - Parameters:
      - `request: UpdateSeedNumbersRequest` — seed number updates, validated
  - 05
    - Name: `updateAthletesStatus`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Update status for multiple athletes with validation and error handling.
    - Parameters:
      - `request: UpdateAthletesStatusRequest` — status update data with athlete IDs and new status, validated

---

#### 3.1.3 AuthController

- Brief description: REST controller for authentication and authorization operations. Provides endpoints for login (with JWT token in HttpOnly cookie), registration, logout, getting current user information, and cookie testing. Base route: `/api/v1/auth`.

- Attributes

  - 01
    - Name: `authService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.AuthService`
    - Purpose: Handles authentication business logic operations.
  - 02
    - Name: `jwtUtils`
    - Visibility: private
    - Type: `sep490g65.fvcapi.utils.JwtUtils`
    - Purpose: Utility for generating and managing JWT tokens.
  - 03
    - Name: `userRepository`
    - Visibility: private
    - Type: `sep490g65.fvcapi.repository.UserRepository`
    - Purpose: Data access for user entities.
  - 04
    - Name: `tokenValidityInMs`
    - Visibility: private
    - Type: `int`
    - Purpose: Token validity duration in milliseconds, injected from configuration property `spring.security.jwt.expiration`.

- Methods/Operations
  - 01
    - Name: `login`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<LoginResponse>>`
    - Purpose: Authenticate user and return JWT token in HttpOnly cookie, with extensive logging.
    - Parameters:
      - `request: LoginRequest` — login credentials (email, password), validated
      - `response: HttpServletResponse` — HTTP response for setting cookie
  - 02
    - Name: `register`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<RegisterResponse>>`
    - Purpose: Register a new user with error handling and appropriate HTTP status codes.
    - Parameters:
      - `request: RegisterRequest` — registration data, validated
  - 03
    - Name: `logout`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Logout user by clearing JWT cookie (setting maxAge to 0).
    - Parameters:
      - `response: HttpServletResponse` — HTTP response for clearing cookie
  - 04
    - Name: `me`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<LoginResponse>>`
    - Purpose: Get current authenticated user information from SecurityContext.
    - Parameters: None
  - 05
    - Name: `testCookie`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<String>>`
    - Purpose: Test endpoint to check cookies in request (development utility).
    - Parameters:
      - `request: HttpServletRequest` — HTTP request for reading cookies

---

#### 3.1.4 ClubMemberController

- Brief description: REST controller for club member operations. Provides endpoints for retrieving club member details and listing club members with pagination. Base route: `ApiConstants.API_BASE_PATH + "/clubs/members"`.

- Attributes

  - 01
    - Name: `clubMemberService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.ClubMemberService`
    - Purpose: Handles club member business logic operations.

- Methods/Operations
  - 01
    - Name: `getDetail`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ClubMemberDetailResponse>>`
    - Purpose: Get club member detail by ID.
    - Parameters:
      - `id: String` — club member identifier
  - 02
    - Name: `list`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<ClubMemberDetailResponse>>>`
    - Purpose: Get paginated list of club members.
    - Parameters:
      - `page: int` — page number (default 0)
      - `size: int` — page size (default 10)

---

#### 3.1.5 CompetitionController

- Brief description: REST controller for competition management. Provides CRUD operations and status change functionality for competitions. Includes error handling and logging. Base route: `ApiConstants.API_BASE_PATH + "/competitions"`.

- Attributes

  - 01
    - Name: `competitionService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.CompetitionService`
    - Purpose: Handles competition business logic operations.

- Methods/Operations
  - 01
    - Name: `getAllCompetitions`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<CompetitionResponse>>>`
    - Purpose: Retrieve paginated competitions with filtering.
    - Parameters:
      - `filters: CompetitionFilters` — filter criteria, validated
  - 02
    - Name: `getCompetitionById`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<CompetitionResponse>>`
    - Purpose: Get a competition by ID.
    - Parameters:
      - `id: String` — competition identifier
  - 03
    - Name: `createCompetition`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<CompetitionResponse>>`
    - Purpose: Create a new competition.
    - Parameters:
      - `request: CreateCompetitionRequest` — competition data, validated
  - 04
    - Name: `updateCompetition`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<CompetitionResponse>>`
    - Purpose: Update an existing competition.
    - Parameters:
      - `id: String` — competition identifier
      - `request: UpdateCompetitionRequest` — update data, validated
  - 05
    - Name: `deleteCompetition`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Delete a competition by ID.
    - Parameters:
      - `id: String` — competition identifier
  - 06
    - Name: `changeStatus`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<CompetitionResponse>>`
    - Purpose: Change competition status.
    - Parameters:
      - `id: String` — competition identifier
      - `status: TournamentStatus` — new status enum

---

#### 3.1.6 ChallengeCycleController

- Brief description: REST controller for challenge cycle management. Provides endpoints for listing, creating (single and bulk), updating, and managing cycle lifecycle (activate, complete, archive). Base route: `ApiConstants.API_BASE_PATH + ApiConstants.CYCLES_PATH`.

- Attributes

  - 01
    - Name: `challengeCycleService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.ChallengeCycleService`
    - Purpose: Handles challenge cycle business logic operations.

- Methods/Operations
  - 01
    - Name: `list`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<ChallengeCycleDto>>>`
    - Purpose: Retrieve paginated list of cycles with optional filtering.
    - Parameters:
      - `status: ChallengeCycleStatus` — optional status filter
      - `search: String` — optional search keyword
      - `pageable: Pageable` — pagination parameters
  - 02
    - Name: `getById`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ChallengeCycleDto>>`
    - Purpose: Get a cycle by ID.
    - Parameters:
      - `id: String` — cycle identifier
  - 03
    - Name: `create`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ChallengeCycleDto>>`
    - Purpose: Create a new challenge cycle.
    - Parameters:
      - `request: ChallengeCycleCreateRequest` — cycle data, validated
  - 04
    - Name: `createBulk`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ChallengeCycleDto>>`
    - Purpose: Create a cycle with phases and teams in bulk operation.
    - Parameters:
      - `request: ChallengeCycleBulkCreateRequest` — bulk creation data, validated
  - 05
    - Name: `update`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ChallengeCycleDto>>`
    - Purpose: Update an existing cycle.
    - Parameters:
      - `id: String` — cycle identifier
      - `request: ChallengeCycleUpdateRequest` — update data, validated
  - 06
    - Name: `activate`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ChallengeCycleDto>>`
    - Purpose: Activate a cycle.
    - Parameters:
      - `id: String` — cycle identifier
  - 07
    - Name: `complete`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ChallengeCycleDto>>`
    - Purpose: Mark a cycle as completed.
    - Parameters:
      - `id: String` — cycle identifier
  - 08
    - Name: `archive`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ChallengeCycleDto>>`
    - Purpose: Archive a cycle.
    - Parameters:
      - `id: String` — cycle identifier

---

#### 3.1.7 ChallengePhaseController

- Brief description: REST controller for challenge phase management within cycles. Provides endpoints for listing phases by cycle, creating, updating, and reordering phases. Base route: `ApiConstants.API_BASE_PATH`.

- Attributes

  - 01
    - Name: `challengePhaseService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.ChallengePhaseService`
    - Purpose: Handles challenge phase business logic operations.

- Methods/Operations
  - 01
    - Name: `listByCycle`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<ChallengePhaseDto>>>`
    - Purpose: Retrieve paginated phases for a cycle with optional filtering.
    - Parameters:
      - `cycleId: String` — cycle identifier
      - `status: PhaseStatus` — optional status filter
      - `search: String` — optional search keyword
      - `pageable: Pageable` — pagination parameters
  - 02
    - Name: `getById`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ChallengePhaseDto>>`
    - Purpose: Get a phase by ID.
    - Parameters:
      - `id: String` — phase identifier
  - 03
    - Name: `create`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ChallengePhaseDto>>`
    - Purpose: Create a new phase within a cycle.
    - Parameters:
      - `cycleId: String` — cycle identifier
      - `request: ChallengePhaseCreateRequest` — phase data, validated
  - 04
    - Name: `update`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ChallengePhaseDto>>`
    - Purpose: Update an existing phase.
    - Parameters:
      - `id: String` — phase identifier
      - `request: ChallengePhaseUpdateRequest` — update data, validated
  - 05
    - Name: `reorder`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Reorder phases within a cycle.
    - Parameters:
      - `cycleId: String` — cycle identifier
      - `orderUpdates: List<PhaseOrderUpdate>` — list of phase order updates, validated

---

#### 3.1.8 MatchController

- Brief description: REST controller for match management. Provides endpoints for creating matches (single and bulk), retrieving scoreboards, event history, recording scores, controlling match state, updating match configurations, and managing rounds. Base route: `ApiConstants.API_BASE_PATH + "/matches"`. Uses authentication context for operations.

- Attributes

  - 01
    - Name: `matchService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.MatchService`
    - Purpose: Handles match business logic operations.

- Methods/Operations
  - 01
    - Name: `listMatches`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<MatchListItemDto>>>`
    - Purpose: List matches with optional filtering.
    - Parameters:
      - `competitionId: String` — optional competition filter
      - `status: String` — optional status filter
  - 02
    - Name: `createMatch`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<MatchScoreboardDto>>`
    - Purpose: Create a single match.
    - Parameters:
      - `request: CreateMatchRequest` — match data, validated
      - `authentication: Authentication` — current user context
  - 03
    - Name: `bulkCreateMatches`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<MatchScoreboardDto>>>`
    - Purpose: Create multiple matches in bulk.
    - Parameters:
      - `request: BulkCreateMatchesRequest` — bulk match data, validated
      - `authentication: Authentication` — current user context
  - 04
    - Name: `getScoreboard`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<MatchScoreboardDto>>`
    - Purpose: Get match scoreboard.
    - Parameters:
      - `matchId: String` — match identifier
  - 05
    - Name: `getEventHistory`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<MatchEventDto>>>`
    - Purpose: Get match event history.
    - Parameters:
      - `matchId: String` — match identifier
  - 06
    - Name: `recordScoreEvent`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Record a score event in a match.
    - Parameters:
      - `request: RecordScoreEventRequest` — score event data, validated
  - 07
    - Name: `controlMatch`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Control match state (start, pause, resume, end).
    - Parameters:
      - `request: ControlMatchRequest` — control action data, validated
  - 08
    - Name: `undoLastEvent`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Undo the last match event.
    - Parameters:
      - `matchId: String` — match identifier
  - 09
    - Name: `updateRoundDuration`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Update round duration for a match.
    - Parameters:
      - `matchId: String` — match identifier
      - `roundDurationSeconds: Integer` — new round duration in seconds
  - 10
    - Name: `updateMainRoundDuration`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Update main round duration for a match.
    - Parameters:
      - `matchId: String` — match identifier
      - `mainRoundDurationSeconds: Integer` — new main round duration in seconds
  - 11
    - Name: `updateTiebreakerDuration`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Update tiebreaker duration for a match.
    - Parameters:
      - `matchId: String` — match identifier
      - `tiebreakerDurationSeconds: Integer` — new tiebreaker duration in seconds
  - 12
    - Name: `updateField`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Update field assignment for a match.
    - Parameters:
      - `matchId: String` — match identifier
      - `fieldId: String` — optional field identifier
  - 13
    - Name: `updateTotalRounds`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Update total number of rounds for a match.
    - Parameters:
      - `matchId: String` — match identifier
      - `totalRounds: Integer` — new total rounds count
  - 14
    - Name: `getRoundHistory`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<MatchRoundDto>>>`
    - Purpose: Get round history for a match.
    - Parameters:
      - `matchId: String` — match identifier

---

#### 3.1.9 ArrangeOrderController

- Brief description: REST controller for managing arrange order (performance ordering) for competitions. Requires authorization for EXECUTIVE_BOARD, ORGANIZATION_COMMITTEE, or ADMIN roles. Base route: `ApiConstants.API_BASE_PATH + "/competitions/{competitionId}/arrange-order"`.

- Attributes

  - 01
    - Name: `arrangeOrderService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.ArrangeOrderService`
    - Purpose: Handles arrange order business logic operations.

- Methods/Operations
  - 01
    - Name: `getArrangeOrder`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ArrangeOrderResponse>>`
    - Purpose: Retrieve arrange order for a competition by content type.
    - Parameters:
      - `competitionId: String` — competition identifier from path
      - `contentType: ContentType` — content type enum for filtering
  - 02
    - Name: `saveArrangeOrder`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Save arrange order for a competition.
    - Parameters:
      - `competitionId: String` — competition identifier from path
      - `request: SaveArrangeOrderRequest` — arrange order data, validated
  - 03
    - Name: `randomizeArrangeOrder`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ArrangeOrderResponse>>`
    - Purpose: Randomize arrange order from registrations.
    - Parameters:
      - `competitionId: String` — competition identifier from path
      - `request: RandomizeArrangeOrderRequest` — randomization request data, validated
  - 04
    - Name: `getContentItems`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<ContentItemResponse>>>`
    - Purpose: Get content items for a competition by content type.
    - Parameters:
      - `competitionId: String` — competition identifier from path
      - `contentType: ContentType` — content type enum for filtering

---

#### 3.1.10 AssessorController

- Brief description: REST controller for managing assessor assignments to competitions. Handles listing available assessors, assignment operations, and retrieving assessor information by competition or specialization. Base route: `ApiConstants.API_BASE_PATH + "/assessors"`.

- Attributes

  - 01
    - Name: `assessorService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.AssessorService`
    - Purpose: Handles assessor business logic operations.
  - 02
    - Name: `userRepository`
    - Visibility: private
    - Type: `sep490g65.fvcapi.repository.UserRepository`
    - Purpose: Data access for user entities to resolve authenticated users.

- Methods/Operations
  - 01
    - Name: `listAvailableAssessors`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<UserResponse>>>`
    - Purpose: List all available assessors that can be assigned.
    - Parameters: None
  - 02
    - Name: `getMyAssignments`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<AssessorResponse>>>`
    - Purpose: Get assessor assignments for the currently authenticated user.
    - Parameters:
      - `authentication: Authentication` — Spring Security authentication context
  - 03
    - Name: `listByCompetition`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<AssessorResponse>>>`
    - Purpose: List all assessors assigned to a specific competition.
    - Parameters:
      - `competitionId: String` — competition identifier
  - 04
    - Name: `listByCompetitionAndSpecialization`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<AssessorResponse>>>`
    - Purpose: List assessors by competition and specialization type.
    - Parameters:
      - `competitionId: String` — competition identifier
      - `specialization: Assessor.Specialization` — assessor specialization enum
  - 05
    - Name: `assignAssessor`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<AssessorResponse>>`
    - Purpose: Assign an assessor to a competition.
    - Parameters:
      - `request: AssignAssessorRequest` — assessor assignment data, validated
      - `authentication: Authentication` — Spring Security authentication context for tracking who assigned
  - 06
    - Name: `unassignAssessor`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Unassign an assessor from a competition.
    - Parameters:
      - `assessorId: String` — assessor identifier

---

#### 3.1.11 CompetitionOrderController

- Brief description: REST controller for managing competition order (ordering of performances/athletes within competitions). Supports CRUD operations and bulk operations. Base route: `ApiConstants.API_BASE_PATH + "/competition-orders"`.

- Attributes

  - 01
    - Name: `competitionOrderService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.CompetitionOrderService`
    - Purpose: Handles competition order business logic operations.

- Methods/Operations
  - 01
    - Name: `getByCompetitionId`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<CompetitionOrderResponse>>>`
    - Purpose: Get all competition orders for a specific competition.
    - Parameters:
      - `competitionId: String` — competition identifier
  - 02
    - Name: `getByCompetitionAndContent`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<CompetitionOrderResponse>>>`
    - Purpose: Get competition orders filtered by competition and content selection.
    - Parameters:
      - `competitionId: String` — competition identifier
      - `contentSelectionId: String` — content selection identifier
  - 03
    - Name: `getById`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<CompetitionOrderResponse>>`
    - Purpose: Get a competition order by ID.
    - Parameters:
      - `id: String` — competition order identifier
  - 04
    - Name: `create`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<CompetitionOrderResponse>>`
    - Purpose: Create a new competition order.
    - Parameters:
      - `request: CreateCompetitionOrderRequest` — competition order data, validated
  - 05
    - Name: `createBulk`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<CompetitionOrderResponse>>>`
    - Purpose: Create multiple competition orders in bulk.
    - Parameters:
      - `requests: List<CreateCompetitionOrderRequest>` — list of competition order data, validated
  - 06
    - Name: `update`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<CompetitionOrderResponse>>`
    - Purpose: Update an existing competition order.
    - Parameters:
      - `id: String` — competition order identifier
      - `request: UpdateCompetitionOrderRequest` — update data, validated
  - 07
    - Name: `delete`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Delete a competition order by ID.
    - Parameters:
      - `id: String` — competition order identifier
  - 08
    - Name: `deleteByCompetitionId`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Delete all competition orders for a specific competition.
    - Parameters:
      - `competitionId: String` — competition identifier

---

#### 3.1.12 DrawController

- Brief description: REST controller for managing draw operations (random match/competition pairing generation). Handles performing draws, retrieving draw history, and finalizing draws. Base route: `ApiConstants.API_BASE_PATH + "/draws"`.

- Attributes

  - 01
    - Name: `drawService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.DrawService`
    - Purpose: Handles draw business logic operations.

- Methods/Operations
  - 01
    - Name: `performDraw`
    - Visibility: public
    - Return: `ResponseEntity<DrawResponse>`
    - Purpose: Perform a draw operation to generate match pairings.
    - Parameters:
      - `request: DrawRequest` — draw configuration data
      - `authentication: Authentication` — Spring Security authentication context for tracking who performed the draw
  - 02
    - Name: `getDrawHistory`
    - Visibility: public
    - Return: `ResponseEntity<List<DrawResponse>>`
    - Purpose: Get draw history for a competition and weight class.
    - Parameters:
      - `competitionId: String` — competition identifier
      - `weightClassId: String` — weight class identifier
  - 03
    - Name: `getFinalDraw`
    - Visibility: public
    - Return: `ResponseEntity<DrawResponse>`
    - Purpose: Get the finalized draw for a competition and weight class.
    - Parameters:
      - `competitionId: String` — competition identifier
      - `weightClassId: String` — weight class identifier
  - 04
    - Name: `finalizeDraw`
    - Visibility: public
    - Return: `ResponseEntity<Void>`
    - Purpose: Finalize a draw session to make it the official draw.
    - Parameters:
      - `drawSessionId: String` — draw session identifier
      - `authentication: Authentication` — Spring Security authentication context for tracking who finalized

---

#### 3.1.13 FieldController

- Brief description: REST controller for managing competition fields (venues/locations where matches are held). Provides CRUD operations for field management. Base route: `ApiConstants.API_BASE_PATH + ApiConstants.FIELDS_PATH`.

- Attributes

  - 01
    - Name: `fieldService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.FieldService`
    - Purpose: Handles field business logic operations.

- Methods/Operations
  - 01
    - Name: `list`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<FieldResponse>>>`
    - Purpose: Retrieve paginated list of fields with optional filtering.
    - Parameters:
      - `params: RequestParam` — pagination and filter parameters, validated
  - 02
    - Name: `get`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FieldResponse>>`
    - Purpose: Get a field by ID.
    - Parameters:
      - `id: String` — field identifier
  - 03
    - Name: `create`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FieldResponse>>`
    - Purpose: Create a new field.
    - Parameters:
      - `request: CreateFieldRequest` — field data, validated
  - 04
    - Name: `update`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FieldResponse>>`
    - Purpose: Update an existing field.
    - Parameters:
      - `id: String` — field identifier
      - `request: UpdateFieldRequest` — update data, validated
  - 05
    - Name: `delete`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Delete a field by ID.
    - Parameters:
      - `id: String` — field identifier

---

#### 3.1.14 FistContentController

- Brief description: REST controller for managing Vovinam fist content configurations and items. Handles both fist configs and their associated items. Base route: `ApiConstants.API_BASE_PATH + "/fist-configs"`.

- Attributes

  - 01
    - Name: `service`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.VovinamFistConfigService`
    - Purpose: Handles fist content business logic operations.

- Methods/Operations
  - 01
    - Name: `list`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<FistConfigResponse>>>`
    - Purpose: Retrieve paginated list of fist configurations.
    - Parameters:
      - `params: RequestParam` — pagination and filter parameters, validated
  - 02
    - Name: `get`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FistConfigResponse>>`
    - Purpose: Get a fist configuration by ID.
    - Parameters:
      - `id: String` — fist config identifier
  - 03
    - Name: `create`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FistConfigResponse>>`
    - Purpose: Create a new fist configuration.
    - Parameters:
      - `request: CreateFistConfigRequest` — fist config data, validated
  - 04
    - Name: `update`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FistConfigResponse>>`
    - Purpose: Update an existing fist configuration.
    - Parameters:
      - `id: String` — fist config identifier
      - `request: UpdateFistConfigRequest` — update data, validated
  - 05
    - Name: `delete`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Delete a fist configuration by ID.
    - Parameters:
      - `id: String` — fist config identifier
  - 06
    - Name: `listItems`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<FistItemResponse>>>`
    - Purpose: Retrieve paginated list of all fist items.
    - Parameters:
      - `params: RequestParam` — pagination and filter parameters, validated
  - 07
    - Name: `getItem`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FistItemResponse>>`
    - Purpose: Get a fist item by ID.
    - Parameters:
      - `id: String` — fist item identifier
  - 08
    - Name: `getItemsByConfigId`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<FistItemResponse>>>`
    - Purpose: Get all fist items belonging to a specific configuration.
    - Parameters:
      - `configId: String` — fist config identifier
  - 09
    - Name: `createItem`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FistItemResponse>>`
    - Purpose: Create a new fist item within a configuration.
    - Parameters:
      - `configId: String` — fist config identifier
      - `request: CreateFistItemRequest` — fist item data, validated
  - 10
    - Name: `updateItem`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FistItemResponse>>`
    - Purpose: Update an existing fist item.
    - Parameters:
      - `configId: String` — fist config identifier
      - `itemId: String` — fist item identifier
      - `request: UpdateFistItemRequest` — update data, validated
  - 11
    - Name: `deleteItem`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Delete a fist item from a configuration.
    - Parameters:
      - `configId: String` — fist config identifier
      - `itemId: String` — fist item identifier

---

#### 3.1.15 HealthController

- Brief description: Simple REST controller for health check endpoint. Returns API status information. Base route: `/api/v1`.

- Attributes

  - None

- Methods/Operations
  - 01
    - Name: `health`
    - Visibility: public
    - Return: `ResponseEntity<Map<String, String>>`
    - Purpose: Health check endpoint that returns API status.
    - Parameters: None

---

#### 3.1.16 MatchAssessorController

- Brief description: REST controller for managing match assessor assignments. Handles assigning assessors to matches, retrieving assessor information, and managing assessor assignments. Base route: `ApiConstants.API_BASE_PATH + "/match-assessors"`.

- Attributes

  - 01
    - Name: `matchAssessorService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.MatchAssessorService`
    - Purpose: Handles match assessor business logic operations.
  - 02
    - Name: `userRepository`
    - Visibility: private
    - Type: `sep490g65.fvcapi.repository.UserRepository`
    - Purpose: Data access for user entities to resolve authenticated users.

- Methods/Operations
  - 01
    - Name: `assignAssessors`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<MatchAssessorResponse>>>`
    - Purpose: Assign multiple assessors to a match at once.
    - Parameters:
      - `request: AssignMatchAssessorsRequest` — bulk assignment data, validated
  - 02
    - Name: `createAssessor`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<MatchAssessorResponse>>`
    - Purpose: Create a single assessor assignment for a match.
    - Parameters:
      - `request: CreateMatchAssessorRequest` — assessor assignment data, validated
  - 03
    - Name: `updateAssessor`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<MatchAssessorResponse>>`
    - Purpose: Update an existing match assessor assignment.
    - Parameters:
      - `assessorId: String` — match assessor identifier
      - `request: UpdateMatchAssessorRequest` — update data, validated
  - 04
    - Name: `getAssessorsByMatchId`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<MatchAssessorResponse>>>`
    - Purpose: Get all assessors assigned to a specific match.
    - Parameters:
      - `matchId: String` — match identifier
  - 05
    - Name: `getAssessorById`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<MatchAssessorResponse>>`
    - Purpose: Get a match assessor by ID.
    - Parameters:
      - `assessorId: String` — match assessor identifier
  - 06
    - Name: `getAssessorsByUserId`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<MatchAssessorResponse>>>`
    - Purpose: Get all match assessor assignments for a specific user.
    - Parameters:
      - `userId: String` — user identifier
  - 07
    - Name: `removeAssessor`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Remove an assessor from a match.
    - Parameters:
      - `assessorId: String` — match assessor identifier
  - 08
    - Name: `removeAllAssessors`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Remove all assessors from a match.
    - Parameters:
      - `matchId: String` — match identifier
  - 09
    - Name: `getMyAssignedMatches`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<MyAssignedMatchResponse>>>`
    - Purpose: Get matches assigned to the currently authenticated user as an assessor.
    - Parameters:
      - `authentication: Authentication` — Spring Security authentication context

---

#### 3.1.17 MusicContentController

- Brief description: REST controller for managing music content for performances. Provides CRUD operations for music content management. Base route: `ApiConstants.API_BASE_PATH + ApiConstants.MUSIC_CONTENTS_PATH`.

- Attributes

  - 01
    - Name: `service`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.MusicContentService`
    - Purpose: Handles music content business logic operations.

- Methods/Operations
  - 01
    - Name: `list`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<MusicContentResponse>>>`
    - Purpose: Retrieve paginated list of music contents with optional filtering.
    - Parameters:
      - `params: RequestParam` — pagination and filter parameters, validated
  - 02
    - Name: `get`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<MusicContentResponse>>`
    - Purpose: Get a music content by ID.
    - Parameters:
      - `id: String` — music content identifier
  - 03
    - Name: `create`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<MusicContentResponse>>`
    - Purpose: Create a new music content.
    - Parameters:
      - `request: CreateMusicContentRequest` — music content data, validated
  - 04
    - Name: `update`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<MusicContentResponse>>`
    - Purpose:  
    - Parameters:
      - `id: String` — music content identifier
      - `request: UpdateMusicContentRequest` — update data, validated
  - 05
    - Name: `delete`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Delete a music content by ID.
    - Parameters:
      - `id: String` — music content identifier

---

#### 3.1.18 PerformanceController

- Brief description: REST controller for managing performance entities (athlete/team performances in competitions). Handles creation, retrieval, status management, and athlete management within performances. Base route: `/api/v1/performances`.

- Attributes

  - 01
    - Name: `performanceService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.PerformanceService`
    - Purpose: Handles performance business logic operations.

- Methods/Operations
  - 01
    - Name: `createPerformance`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Create a new performance.
    - Parameters:
      - `request: CreatePerformanceRequest` — performance data, validated
  - 02
    - Name: `getPerformanceById`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Get a performance by ID.
    - Parameters:
      - `id: String` — performance identifier
  - 03
    - Name: `getPerformanceByMatch`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Get a performance by match ID.
    - Parameters:
      - `matchId: String` — match identifier
  - 04
    - Name: `getPerformancesByCompetitionId`
    - Visibility: public
    - Return: `ResponseEntity<List<PerformanceResponse>>`
    - Purpose: Get all performances for a specific competition.
    - Parameters:
      - `competitionId: String` — competition identifier
  - 05
    - Name: `getPerformancesByType`
    - Visibility: public
    - Return: `ResponseEntity<List<PerformanceResponse>>`
    - Purpose: Get performances filtered by competition and performance type.
    - Parameters:
      - `competitionId: String` — competition identifier
      - `performanceType: Performance.PerformanceType` — performance type enum
  - 06
    - Name: `getPerformancesByContentType`
    - Visibility: public
    - Return: `ResponseEntity<List<PerformanceResponse>>`
    - Purpose: Get performances filtered by competition and content type.
    - Parameters:
      - `competitionId: String` — competition identifier
      - `contentType: Performance.ContentType` — content type enum
  - 07
    - Name: `updatePerformanceStatus`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Update the status of a performance.
    - Parameters:
      - `id: String` — performance identifier
      - `status: Performance.PerformanceStatus` — new status enum
  - 08
    - Name: `startPerformance`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Start a performance (change status to started).
    - Parameters:
      - `id: String` — performance identifier
  - 09
    - Name: `completePerformance`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Mark a performance as completed.
    - Parameters:
      - `id: String` — performance identifier
  - 10
    - Name: `cancelPerformance`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Cancel a performance.
    - Parameters:
      - `id: String` — performance identifier
  - 11
    - Name: `deletePerformance`
    - Visibility: public
    - Return: `ResponseEntity<Void>`
    - Purpose: Delete a performance by ID.
    - Parameters:
      - `id: String` — performance identifier
  - 12
    - Name: `addAthleteToPerformance`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Add an athlete to a performance with team position and captain status.
    - Parameters:
      - `performanceId: String` — performance identifier
      - `athleteId: String` — athlete identifier
      - `teamPosition: Integer` — position in team
      - `isCaptain: Boolean` — whether athlete is team captain (default false)
  - 13
    - Name: `removeAthleteFromPerformance`
    - Visibility: public
    - Return: `ResponseEntity<Void>`
    - Purpose: Remove an athlete from a performance.
    - Parameters:
      - `performanceId: String` — performance identifier
      - `athleteId: String` — athlete identifier
  - 14
    - Name: `approve`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Approve a performance.
    - Parameters:
      - `id: String` — performance identifier

---

#### 3.1.19 PerformanceMatchController

- Brief description: REST controller for managing performance matches (matches associated with performances). Handles creation, updates, status management, and retrieval operations. Base route: `/api/v1/performance-matches`.

- Attributes

  - 01
    - Name: `performanceMatchService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.PerformanceMatchService`
    - Purpose: Handles performance match business logic operations.

- Methods/Operations
  - 01
    - Name: `createPerformanceMatch`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceMatchResponse>`
    - Purpose: Create a new performance match.
    - Parameters:
      - `request: CreatePerformanceMatchRequest` — performance match data, validated
  - 02
    - Name: `getPerformanceMatchById`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PerformanceMatchResponse>>`
    - Purpose: Get a performance match by ID.
    - Parameters:
      - `id: String` — performance match identifier
  - 03
    - Name: `getPerformanceMatchByPerformanceId`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PerformanceMatchResponse>>`
    - Purpose: Get a performance match by performance ID.
    - Parameters:
      - `performanceId: String` — performance identifier
  - 04
    - Name: `getPerformanceMatchesByCompetitionId`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<PerformanceMatchResponse>>>`
    - Purpose: Get all performance matches for a specific competition.
    - Parameters:
      - `competitionId: String` — competition identifier
  - 05
    - Name: `updatePerformanceMatchStatus`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceMatchResponse>`
    - Purpose: Update the status of a performance match.
    - Parameters:
      - `id: String` — performance match identifier
      - `status: PerformanceMatch.MatchStatus` — new status enum
  - 06
    - Name: `updatePerformanceMatch`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceMatchResponse>`
    - Purpose: Update a performance match.
    - Parameters:
      - `id: String` — performance match identifier
      - `request: CreatePerformanceMatchRequest` — update data, validated
  - 07
    - Name: `deletePerformanceMatch`
    - Visibility: public
    - Return: `ResponseEntity<Void>`
    - Purpose: Delete a performance match by ID.
    - Parameters:
      - `id: String` — performance match identifier
  - 08
    - Name: `savePerformanceMatchSetup`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PerformanceMatchResponse>>`
    - Purpose: Save performance match setup configuration.
    - Parameters:
      - `performanceId: String` — performance identifier
      - `body: SavePerformanceMatchSetupRequest` — setup configuration data (optional)

---

#### 3.1.20 PerformanceScoringController

- Brief description: REST controller for managing performance scoring operations. Handles score submission, retrieval, and average score calculation. Base route: `/api/v1/performance-scoring`.

- Attributes

  - 01
    - Name: `performanceScoringService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.PerformanceScoringService`
    - Purpose: Handles performance scoring business logic operations.

- Methods/Operations
  - 01
    - Name: `submitScore`
    - Visibility: public
    - Return: `ResponseEntity<AssessorScore>`
    - Purpose: Submit a score for a performance by an assessor.
    - Parameters:
      - `request: SubmitScoreRequest` — score submission data, validated
  - 02
    - Name: `getPerformanceScores`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Get performance with all associated scores.
    - Parameters:
      - `performanceId: String` — performance identifier
  - 03
    - Name: `getAverageScore`
    - Visibility: public
    - Return: `ResponseEntity<BigDecimal>`
    - Purpose: Calculate and get the average score for a performance.
    - Parameters:
      - `performanceId: String` — performance identifier
  - 04
    - Name: `getScoresByPerformanceId`
    - Visibility: public
    - Return: `ResponseEntity<List<AssessorScore>>`
    - Purpose: Get all scores for a specific performance.
    - Parameters:
      - `performanceId: String` — performance identifier

---

#### 3.1.21 ProfileController

- Brief description: REST controller for managing user profile operations. Handles retrieving and updating current user profile, and password changes. Requires authentication. Base route: `ApiConstants.API_BASE_PATH + "/profile"`.

- Attributes

  - 01
    - Name: `userService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.UserService`
    - Purpose: Handles user business logic operations.

- Methods/Operations
  - 01
    - Name: `getProfile`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ProfileResponse>>`
    - Purpose: Get the profile of the currently authenticated user.
    - Parameters: None
  - 02
    - Name: `updateProfile`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<ProfileResponse>>`
    - Purpose: Update the profile of the currently authenticated user.
    - Parameters:
      - `request: UpdateProfileRequest` — profile update data, validated
  - 03
    - Name: `changePassword`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Change the password of the currently authenticated user.
    - Parameters:
      - `request: ChangePasswordRequest` — password change data, validated

---

#### 3.1.22 ScoringController

- Brief description: REST controller for managing scoring operations across different scoring modes. Handles score submission, updates, deletions, and scoring status queries. Base route: `/api/v1/scoring`.

- Attributes

  - 01
    - Name: `scoringService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.ScoringService`
    - Purpose: Handles general scoring business logic operations.
  - 02
    - Name: `performanceScoringService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.PerformanceScoringService`
    - Purpose: Handles performance-specific scoring operations.

- Methods/Operations
  - 01
    - Name: `submitScore`
    - Visibility: public
    - Return: `ResponseEntity<?>`
    - Purpose: Submit a score (delegates to performance scoring service).
    - Parameters:
      - `request: SubmitScoreRequest` — score submission data, validated
  - 02
    - Name: `getPerformanceScores`
    - Visibility: public
    - Return: `ResponseEntity<PerformanceResponse>`
    - Purpose: Get performance with all associated scores.
    - Parameters:
      - `performanceId: String` — performance identifier
  - 03
    - Name: `getAverageScore`
    - Visibility: public
    - Return: `ResponseEntity<BigDecimal>`
    - Purpose: Calculate and get the average score for a performance.
    - Parameters:
      - `performanceId: String` — performance identifier
  - 04
    - Name: `getScoresByPerformanceId`
    - Visibility: public
    - Return: `ResponseEntity<List<AssessorScore>>`
    - Purpose: Get all scores for a specific performance.
    - Parameters:
      - `performanceId: String` — performance identifier
  - 05
    - Name: `getScoresByAssessorId`
    - Visibility: public
    - Return: `ResponseEntity<List<AssessorScore>>`
    - Purpose: Get all scores submitted by a specific assessor.
    - Parameters:
      - `assessorId: String` — assessor identifier
  - 06
    - Name: `updateScore`
    - Visibility: public
    - Return: `ResponseEntity<AssessorScore>`
    - Purpose: Update an existing score.
    - Parameters:
      - `scoreId: String` — score identifier
      - `newScore: BigDecimal` — new score value
      - `criteriaScores: String` — optional criteria scores JSON string
      - `notes: String` — optional notes
  - 07
    - Name: `deleteScore`
    - Visibility: public
    - Return: `ResponseEntity<Void>`
    - Purpose: Delete a score by ID.
    - Parameters:
      - `scoreId: String` — score identifier
  - 08
    - Name: `getRemainingAssessors`
    - Visibility: public
    - Return: `ResponseEntity<Integer>`
    - Purpose: Get count of assessors who haven't scored a performance yet.
    - Parameters:
      - `performanceId: String` — performance identifier
  - 09
    - Name: `getTotalAssessors`
    - Visibility: public
    - Return: `ResponseEntity<Integer>`
    - Purpose: Get total count of assessors assigned to a performance.
    - Parameters:
      - `performanceId: String` — performance identifier
  - 10
    - Name: `canAssessorScore`
    - Visibility: public
    - Return: `ResponseEntity<Boolean>`
    - Purpose: Check if an assessor can score a performance.
    - Parameters:
      - `assessorId: String` — assessor identifier
      - `performanceId: String` — performance identifier
  - 11
    - Name: `isPerformanceActive`
    - Visibility: public
    - Return: `ResponseEntity<Boolean>`
    - Purpose: Check if a performance is currently active (can accept scores).
    - Parameters:
      - `performanceId: String` — performance identifier

---

#### 3.1.23 SubmittedApplicationFormController

- Brief description: REST controller for managing submitted application forms. Handles listing, submission, and status management of submitted forms. Base route: `ApiConstants.API_BASE_PATH + "/submitted-forms"`.

- Attributes

  - 01
    - Name: `service`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.SubmittedApplicationFormService`
    - Purpose: Handles submitted application form business logic operations.

- Methods/Operations
  - 01
    - Name: `list`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<SubmittedApplicationFormResponse>>>`
    - Purpose: Retrieve paginated list of submitted forms with optional filtering by type.
    - Parameters:
      - `params: RequestParam` — pagination and filter parameters, validated
      - `type: ApplicationFormType` — optional form type filter
  - 02
    - Name: `submit`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<SubmittedApplicationFormResponse>>`
    - Purpose: Submit a new application form.
    - Parameters:
      - `request: SubmitApplicationFormRequest` — form submission data, validated
  - 03
    - Name: `updateStatus`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Update the status of a submitted form.
    - Parameters:
      - `id: Long` — submitted form identifier
      - `request: UpdateSubmissionStatusRequest` — status update data, validated
  - 04
    - Name: `bulkUpdateStatus`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Update status of multiple submitted forms in bulk.
    - Parameters:
      - `request: BulkUpdateStatusRequest` — bulk status update data, validated

---

#### 3.1.24 TeamController

- Brief description: REST controller for managing team entities within challenge cycles. Handles CRUD operations for teams. Base route: `ApiConstants.API_BASE_PATH`.

- Attributes

  - 01
    - Name: `teamService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.TeamService`
    - Purpose: Handles team business logic operations.

- Methods/Operations
  - 01
    - Name: `listByCycle`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<TeamDto>>>`
    - Purpose: Retrieve paginated list of teams within a cycle with optional search.
    - Parameters:
      - `cycleId: String` — challenge cycle identifier
      - `search: String` — optional search keyword
      - `pageable: Pageable` — pagination parameters
  - 02
    - Name: `getById`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<TeamDto>>`
    - Purpose: Get a team by ID.
    - Parameters:
      - `id: String` — team identifier
  - 03
    - Name: `create`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<TeamDto>>`
    - Purpose: Create a new team within a cycle.
    - Parameters:
      - `cycleId: String` — challenge cycle identifier
      - `request: TeamCreateRequest` — team data, validated
  - 04
    - Name: `update`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<TeamDto>>`
    - Purpose: Update an existing team.
    - Parameters:
      - `id: String` — team identifier
      - `request: TeamUpdateRequest` — update data, validated
  - 05
    - Name: `delete`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Delete a team by ID.
    - Parameters:
      - `id: String` — team identifier

---

#### 3.1.25 TeamMemberController

- Brief description: REST controller for managing team membership. Handles adding, removing, and listing team members, including bulk operations and re-adding previously removed members. Base route: `ApiConstants.API_BASE_PATH`.

- Attributes

  - 01
    - Name: `teamMemberService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.TeamMemberService`
    - Purpose: Handles team member business logic operations.

- Methods/Operations
  - 01
    - Name: `listByTeam`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<TeamMemberDto>>>`
    - Purpose: Retrieve paginated list of team members for a team.
    - Parameters:
      - `teamId: String` — team identifier
      - `activeOnly: boolean` — filter to show only active members (default true)
      - `pageable: Pageable` — pagination parameters
  - 02
    - Name: `historyByUser`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<TeamMemberDto>>>`
    - Purpose: Get team membership history for a user across all teams.
    - Parameters:
      - `userId: String` — user identifier
      - `pageable: Pageable` — pagination parameters
  - 03
    - Name: `add`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<TeamMemberDto>>`
    - Purpose: Add a member to a team.
    - Parameters:
      - `teamId: String` — team identifier
      - `request: TeamMemberAddRequest` — member addition data, validated
  - 04
    - Name: `remove`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<TeamMemberDto>>`
    - Purpose: Remove a member from a team.
    - Parameters:
      - `teamId: String` — team identifier
      - `userId: String` — user identifier
      - `request: TeamMemberRemoveRequest` — optional removal request data
  - 05
    - Name: `bulkAdd`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<TeamMemberDto>>>`
    - Purpose: Add multiple members to a team in bulk.
    - Parameters:
      - `teamId: String` — team identifier
      - `request: TeamMemberBulkAddRequest` — bulk addition data, validated
      - `pageable: Pageable` — pagination parameters
  - 06
    - Name: `reAdd`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<TeamMemberDto>>`
    - Purpose: Re-add a previously removed member to a team.
    - Parameters:
      - `teamId: String` — team identifier
      - `userId: String` — user identifier

---

#### 3.1.26 TeamStatsController

- Brief description: REST controller for team statistics and analytics. Provides dashboard summaries, phase breakdowns, at-risk member identification, and export functionality. Base route: `ApiConstants.API_BASE_PATH + "/stats"`.

- Attributes

  - 01
    - Name: `teamStatsService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.TeamStatsService`
    - Purpose: Handles team statistics business logic operations.

- Methods/Operations
  - 01
    - Name: `dashboard`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<TeamStatsDashboardSummary>>`
    - Purpose: Get dashboard summary statistics with filtering.
    - Parameters:
      - `params: StatsFilterParams` — statistics filter parameters
  - 02
    - Name: `phaseBreakdown`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<PhaseTeamStatsDto>>>`
    - Purpose: Get phase-team breakdown statistics with pagination.
    - Parameters:
      - `params: StatsFilterParams` — statistics filter parameters
      - `pageable: Pageable` — pagination parameters
  - 03
    - Name: `phaseTeamDetail`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PhaseTeamDetailStatsDto>>`
    - Purpose: Get detailed statistics for a specific phase and team.
    - Parameters:
      - `phaseId: String` — challenge phase identifier
      - `teamId: String` — team identifier
      - `params: StatsDetailParams` — detail filter parameters
  - 04
    - Name: `atRisk`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<TeamMemberRiskDto>>>`
    - Purpose: Get list of at-risk team members with pagination.
    - Parameters:
      - `params: StatsFilterParams` — statistics filter parameters
      - `pageable: Pageable` — pagination parameters
  - 05
    - Name: `export`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<byte[]>>`
    - Purpose: Export statistics data (e.g., Excel, CSV) based on export request.
    - Parameters:
      - `request: StatsExportRequest` — export configuration data

---

#### 3.1.27 TournamentFormController

- Brief description: REST controller for managing tournament forms and their submissions. Handles form creation, updates, status management, and submission operations. Base route: `ApiConstants.API_BASE_PATH + ApiConstants.TOURNAMENT_FORMS_PATH`.

- Attributes

  - 01
    - Name: `tournamentFormService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.TournamentFormService`
    - Purpose: Handles tournament form business logic operations.
  - 02
    - Name: `competitionRepository`
    - Visibility: private
    - Type: `sep490g65.fvcapi.repository.CompetitionRepository`
    - Purpose: Data access for competition entities to list available competitions.

- Methods/Operations
  - 01
    - Name: `list`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<TournamentFormResponse>>>`
    - Purpose: Retrieve paginated list of tournament forms.
    - Parameters:
      - `params: RequestParam` — pagination and filter parameters, validated
  - 02
    - Name: `create`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<TournamentFormResponse>>`
    - Purpose: Create a new tournament form.
    - Parameters:
      - `req: CreateFormRequest` — tournament form data, validated
  - 03
    - Name: `listCompetitions`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<List<CompetitionOptionResponse>>>`
    - Purpose: List all available competitions as options.
    - Parameters: None
  - 04
    - Name: `get`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FormDetailResponse>>`
    - Purpose: Get a tournament form by ID with full details.
    - Parameters:
      - `id: String` — tournament form identifier
  - 05
    - Name: `update`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<FormDetailResponse>>`
    - Purpose: Update an existing tournament form.
    - Parameters:
      - `id: String` — tournament form identifier
      - `req: UpdateFormRequest` — update data, validated
  - 06
    - Name: `updateStatus`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Update the status of a tournament form.
    - Parameters:
      - `id: String` — tournament form identifier
      - `req: UpdateFormStatusRequest` — status update data
  - 07
    - Name: `listSubmissions`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<SubmittedFormResponse>>>`
    - Purpose: Get paginated list of submissions for a tournament form.
    - Parameters:
      - `id: String` — tournament form identifier
      - `params: RequestParam` — pagination and filter parameters, validated
  - 08
    - Name: `changeSubmissionStatus`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Change the status of a form submission.
    - Parameters:
      - `submissionId: Long` — submission identifier
      - `req: UpdateSubmissionStatusRequest` — status update data
  - 09
    - Name: `submit`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Submit a new form submission for a tournament form.
    - Parameters:
      - `id: String` — tournament form identifier
      - `req: CreateSubmissionRequest` — submission data, validated

---

#### 3.1.28 UserController

- Brief description: REST controller for managing user entities. Handles user creation, retrieval, search operations, and deletion. Includes specialized search for challenge users. Base route: `/api/v1/users`.

- Attributes

  - 01
    - Name: `userService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.UserService`
    - Purpose: Handles user business logic operations.

- Methods/Operations
  - 01
    - Name: `createUser`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<UserResponse>>`
    - Purpose: Create a new user.
    - Parameters:
      - `request: CreateUserRequest` — user data, validated
  - 02
    - Name: `getUserById`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<UserResponse>>`
    - Purpose: Get a user by ID.
    - Parameters:
      - `userId: String` — user identifier
  - 03
    - Name: `getAllUsers`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Page<UserResponse>>>`
    - Purpose: Get paginated list of all users.
    - Parameters:
      - `page: int` — page number (default 0)
      - `size: int` — page size (default 10)
  - 04
    - Name: `searchChallengeUsers`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Page<UserResponse>>>`
    - Purpose: Search users specifically for challenge operations with optional query.
    - Parameters:
      - `page: int` — page number (default 0)
      - `size: int` — page size (default 10)
      - `query: String` — optional search query
  - 05
    - Name: `searchUsers`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Page<UserResponse>>>`
    - Purpose: Advanced user search with multiple filter criteria.
    - Parameters:
      - `page: int` — page number (default 0)
      - `size: int` — page size (default 10)
      - `query: String` — optional search query
      - `role: String` — optional role filter
      - `status: Boolean` — optional status filter
  - 06
    - Name: `deleteUser`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Delete a user by ID.
    - Parameters:
      - `userId: String` — user identifier

---

#### 3.1.29 WaitlistController

- Brief description: REST controller for managing waitlist entries. Handles adding users to waitlist for application forms. Base route: `ApiConstants.API_BASE_PATH + "/waitlist"`.

- Attributes

  - 01
    - Name: `waitlistService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.WaitlistService`
    - Purpose: Handles waitlist business logic operations.

- Methods/Operations
  - 01
    - Name: `addToWaitlist`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Add a user to the waitlist for an application form.
    - Parameters:
      - `request: AddToWaitlistRequest` — waitlist entry data, validated

---

#### 3.1.30 WeightClassController

- Brief description: REST controller for managing weight classes for competitions. Provides CRUD operations and status management for weight classes. Base route: `ApiConstants.API_BASE_PATH + ApiConstants.WEIGHT_CLASSES_PATH`.

- Attributes

  - 01
    - Name: `weightClassService`
    - Visibility: private
    - Type: `sep490g65.fvcapi.service.WeightClassService`
    - Purpose: Handles weight class business logic operations.

- Methods/Operations
  - 01
    - Name: `list`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<PaginationResponse<WeightClassResponse>>>`
    - Purpose: Retrieve paginated list of weight classes with optional filtering.
    - Parameters:
      - `params: RequestParam` — pagination and filter parameters, validated
  - 02
    - Name: `get`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<WeightClassResponse>>`
    - Purpose: Get a weight class by ID.
    - Parameters:
      - `id: String` — weight class identifier
  - 03
    - Name: `create`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<WeightClassResponse>>`
    - Purpose: Create a new weight class.
    - Parameters:
      - `request: CreateWeightClassRequest` — weight class data, validated
  - 04
    - Name: `update`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<WeightClassResponse>>`
    - Purpose: Update an existing weight class.
    - Parameters:
      - `id: String` — weight class identifier
      - `request: UpdateWeightClassRequest` — update data, validated
  - 05
    - Name: `changeStatus`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Change the status of a weight class.
    - Parameters:
      - `id: String` — weight class identifier
      - `status: WeightClassStatus` — new status enum
  - 06
    - Name: `delete`
    - Visibility: public
    - Return: `ResponseEntity<BaseResponse<Void>>`
    - Purpose: Delete a weight class by ID.
    - Parameters:
      - `id: String` — weight class identifier

---
