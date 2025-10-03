# Updated Tournament-Fist Content Relationship Requirements

## Overview
The relationship between tournaments and fist content is more complex than initially specified. It involves a two-level selection process where users first select fist configurations, then choose specific items within each configuration.

## Entity Relationship Structure

### Current Entities:
1. **Competition** (Tournament) - Main tournament entity
2. **VovinamFistConfig** - Fist content configuration (e.g., "Song luyện", "Đơn luyện")
3. **VovinamFistItem** - Specific fist items within a config (e.g., "Song luyện kiếm", "Song luyện đạo")
4. **CompetitionVovinamFist** - Junction table linking competitions to fist configs

### Relationship Chain:
```
Competition → CompetitionVovinamFist → VovinamFistConfig → VovinamFistItem
```

## Tournament Creation Workflow

### Forms Section Process:
1. **Select Fist Configurations**
   - User selects from existing `VovinamFistConfig` entities
   - Examples: "Song luyện", "Đơn luyện", "Đa luyện", "Đồng đội"

2. **Select Specific Items for Each Config**
   - For each selected `VovinamFistConfig`, user chooses specific `VovinamFistItem` entities
   - Example: For "Song luyện" config, select "Song luyện kiếm" and "Song luyện đạo" items

3. **Data Structure**
   - `fistConfigIds`: List of selected fist config IDs
   - `fistConfigItemSelections`: Map<String, List<String>> where key is config ID and value is list of selected item IDs

## Updated DTOs

### CreateCompetitionRequest:
```java
private List<String> vovinamFistConfigIds = new ArrayList<>();
private Map<String, List<String>> fistConfigItemSelections = new HashMap<>();
```

### CompetitionResponse:
```java
private List<FistConfigResponse> vovinamFistConfigs;
private Map<String, List<FistItemResponse>> fistConfigItemSelections;
```

## Frontend Components Required

### 1. FistContentMultiSelect Component
- Multi-select dropdown for fist configurations
- Search/filter functionality
- Expandable item selection for each selected config

### 2. FistItemSelection Component
- Hierarchical display of fist items
- Multi-selection within each config
- Parent-child relationship support

## UI/UX Flow

1. **Step 1: Select Fist Configurations**
   - Multi-select dropdown showing available fist configs
   - Search/filter capability
   - Selected configs shown below with expand/collapse

2. **Step 2: Select Items for Each Config**
   - For each selected config, show expandable section
   - Display fist items in hierarchical structure
   - Allow multi-selection of specific items
   - Show selection count for each config

3. **Step 3: Review and Validate**
   - Show summary of selected configs and items
   - Validate that at least one item is selected per config
   - Allow modification before submission

## Implementation Tasks Updated

### Task 4.3: Forms Section (3-4 days)
- Create fist config multi-select component
- Create fist item selection component
- Implement hierarchical display
- Add proper state management
- Implement validation for both levels

## Benefits of This Approach

1. **Granular Control**: Users can select exactly which forms are included
2. **Flexibility**: Different tournaments can have different combinations
3. **Scalability**: Easy to add new configs and items
4. **User Experience**: Clear two-step process with visual feedback
5. **Data Integrity**: Proper validation at both levels

## Example Usage

**Tournament: "FVCUP 2025 — Spring"**

**Selected Fist Configurations:**
- "Song luyện" (Paired Forms)
- "Đơn luyện" (Individual Forms)

**Selected Items:**
- "Song luyện" → ["Song luyện kiếm", "Song luyện đạo"]
- "Đơn luyện" → ["Đơn luyện quyền Thập Tự"]

This provides precise control over which specific forms are included in each tournament while maintaining the existing entity structure.

