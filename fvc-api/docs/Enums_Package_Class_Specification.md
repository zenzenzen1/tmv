# Class Specification - Enums Package

## 1. SystemRole

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | MEMBER, ATHLETE, TEACHER, EXECUTIVE_BOARD, ORGANIZATION_COMMITTEE, ADMIN |

---

## 2. Gender

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | MALE, FEMALE |

---

## 3. MatchStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | PENDING (Chờ bắt đầu), IN_PROGRESS (Đang đấu), PAUSED (Tạm dừng), ENDED (Kết thúc), CANCELLED (Hủy) |

---

## 4. TournamentStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | DRAFT, OPEN_REGISTRATION, IN_PROGRESS, FINISHED, CANCELLED |

---

## 5. ErrorCode

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | code | Visibility: private final
Type: String
Purpose: Error code string identifier |
| 02 | message | Visibility: private final
Type: String
Purpose: Error message description |
| **Methods/Operations** |
| 01 | ErrorCode(String code, String message) | Visibility: private
Return: ErrorCode
Purpose: Constructor for enum values with code and message
Parameters:
- `code: String` — error code identifier
- `message: String` — error message |
| 02 | getCode() | Visibility: public
Return: String
Purpose: Returns the error code
Parameters: None |
| 03 | getMessage() | Visibility: public
Return: String
Purpose: Returns the error message
Parameters: None |
| 04 | (Enum values) | Multiple error code constants including:
- USER_NOT_FOUND, USER_ALREADY_EXISTS, INVALID_USER_CREDENTIALS, USER_ACCOUNT_DISABLED
- VALIDATION_ERROR, INVALID_INPUT
- UNAUTHORIZED, TOKEN_EXPIRED, INVALID_TOKEN
- INTERNAL_SERVER_ERROR, RESOURCE_NOT_FOUND, OPERATION_FAILED
- COMPETITION_NOT_FOUND, COMPETITION_ALREADY_EXISTS, and other competition-related errors
- MATCH_NOT_FOUND, MATCH_ALREADY_ENDED, and other match-related errors
- ARRANGE_INVALID_CONTENT_TYPE, ARRANGE_DUPLICATE_ITEM, and other arrange-related errors |

---

## 6. ApplicationFormStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | PENDING, APPROVED, REJECTED |

---

## 7. MatchEventType

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | SCORE_PLUS_1 (+1 điểm), SCORE_PLUS_2 (+2 điểm), SCORE_MINUS_1 (-1 điểm), MEDICAL_TIMEOUT (Tạm dừng y tế), WARNING (Cảnh cáo) |

---

## 8. PhaseStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | NOT_STARTED, IN_PROGRESS, DONE |

---

## 9. ContentType

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | QUYEN, VONHAC |

---

## 10. FormStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | DRAFT, PUBLISH, ARCHIVED, POSTPONE |

---

## 11. TrainingSessionStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for training session status |

---

## 12. RoundType

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for round types |

---

## 13. EventStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for event status |

---

## 14. EvaluationSessionType

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for evaluation session types |

---

## 15. EvaluationScheduleStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for evaluation schedule status |

---

## 16. EvaluationResultStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for evaluation result status |

---

## 17. DrawType

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for draw types |

---

## 18. Corner

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for corner positions |

---

## 19. ChallengeCycleStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for challenge cycle status |

---

## 20. AuditActionType

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for audit action types |

---

## 21. AuditTargetType

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for audit target types |

---

## 22. AuditRole

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for audit roles |

---

## 23. AttendanceStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for attendance status |

---

## 24. AttendanceMethod

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for attendance methods |

---

## 25. AssessorRole

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for assessor roles |

---

## 26. ArrangeItemType

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for arrange item types |

---

## 27. WeightClassStatus

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for weight class status |

---

## 28. MatchControlAction

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for match control actions |

---

## 29. ApplicationFormType

| No | Name | Description |
|---|---|---|
| **Attributes** |
| 01 | (None) | Simple enum with no attributes |
| **Methods/Operations** |
| 01 | (Enum values) | Enum values for application form types (e.g., COMPETITION_REGISTRATION, CLUB_REGISTRATION) |

---

## Package Structure

```
sep490g65.fvcapi.enums
├── SystemRole
├── Gender
├── MatchStatus
├── TournamentStatus
├── ErrorCode
├── ApplicationFormStatus
├── MatchEventType
├── PhaseStatus
├── ContentType
├── FormStatus
├── TrainingSessionStatus
├── RoundType
├── EventStatus
├── EvaluationSessionType
├── EvaluationScheduleStatus
├── EvaluationResultStatus
├── DrawType
├── Corner
├── ChallengeCycleStatus
├── AuditActionType
├── AuditTargetType
├── AuditRole
├── AttendanceStatus
├── AttendanceMethod
├── AssessorRole
├── ArrangeItemType
├── WeightClassStatus
└── MatchControlAction
└── ApplicationFormType
```

