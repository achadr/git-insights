# SSE Event Flow Diagram

## Complete Event Sequence

```
Client Request
     |
     v
[connected] 0%
"Connected to analysis stream"
     |
     v
[validation] 5%
"Validating repository URL"
     |
     v
[parsing] 10%
"Parsing repository URL"
     |
     v
[fetching_tree] 15%
"Fetching repository file tree"
     |
     v
[tree_fetched] 25%
"Found N code files"
data: { totalCodeFiles: N }
     |
     v
[analysis_starting] 30%
"Starting analysis of N files"
data: { filesToAnalyze: N }
     |
     v
[analyzing_file] 37%  <-- File 1/N
"Analyzing src/index.js"
current: 1, total: N
data: { fileName: "src/index.js" }
     |
     v
[analyzing_file] 43%  <-- File 2/N
"Analyzing src/utils.js"
current: 2, total: N
data: { fileName: "src/utils.js" }
     |
     v
    ...
     |
     v
[analyzing_file] 95%  <-- File N/N
"Analyzing src/main.js"
current: N, total: N
data: { fileName: "src/main.js" }
     |
     v
[generating_report] 95%
"Generating analysis report"
     |
     v
[complete] 100%
"Analysis complete"
data: {
  summary: { ... },
  quality: { ... },
  files: [ ... ]
}
     |
     v
Connection Closed
```

## Error Flow

```
Client Request
     |
     v
[connected] 0%
     |
     v
[validation] 5%
     |
     v
     X  (Error occurs)
     |
     v
[error] 0%
"Error message here"
data: {
  error: "Error details",
  code: "ERROR_CODE"
}
     |
     v
Connection Closed
```

## Cached Result Flow

```
Client Request
     |
     v
[connected] 0%
     |
     v
[validation] 5%
     |
     v
     (Cache hit detected)
     |
     v
[cached] 100%
"Returning cached analysis"
     |
     v
Connection Closed
```

## File Error Flow (Non-Fatal)

```
[analyzing_file] 43%
"Analyzing src/broken.js"
current: 2, total: 10
     |
     X  (File fails)
     |
     v
[file_error] 43%
"Failed to analyze src/broken.js"
current: 2, total: 10
data: {
  fileName: "src/broken.js",
  error: "File not found"
}
     |
     v
[analyzing_file] 50%  <-- Continue with next file
"Analyzing src/next.js"
current: 3, total: 10
```

## Progress Calculation

```
Stage                    Progress Range    Notes
-----------------        --------------    -----
connected                0%                Initial
validation               5%                Quick
parsing                  10%               Quick
fetching_tree            15%               Network call
tree_fetched             25%               -
analysis_starting        30%               -
analyzing_file           30-95%            Largest range
  - File 1/10            37%               +7%
  - File 2/10            43%               +6.5%
  - File 3/10            50%               +6.5%
  - ...
  - File 10/10           95%               Final file
generating_report        95%               -
complete                 100%              Done!
```

## Timeline Example (10 Files)

```
Time    Stage              Progress  Description
------  -----------------  --------  -----------
0.0s    connected          0%        Connection
0.1s    validation         5%        Validate
0.2s    parsing            10%       Parse URL
0.3s    fetching_tree      15%       GitHub API
1.5s    tree_fetched       25%       Got files
1.6s    analysis_starting  30%       Start
2.0s    analyzing_file     37%       File 1/10
3.0s    analyzing_file     43%       File 2/10
4.0s    analyzing_file     50%       File 3/10
5.0s    analyzing_file     56%       File 4/10
6.0s    analyzing_file     63%       File 5/10
7.0s    analyzing_file     69%       File 6/10
8.0s    analyzing_file     76%       File 7/10
9.0s    analyzing_file     82%       File 8/10
10.0s   analyzing_file     89%       File 9/10
11.0s   analyzing_file     95%       File 10/10
11.1s   generating_report  95%       Create report
11.2s   complete           100%      Done!
```

## State Transitions

```
          ┌─────────────┐
          │   IDLE      │
          └──────┬──────┘
                 │ POST /api/analyze/stream
                 v
          ┌─────────────┐
          │ CONNECTED   │ 0%
          └──────┬──────┘
                 │
                 v
          ┌─────────────┐
          │ VALIDATING  │ 5%
          └──────┬──────┘
                 │
                 v
          ┌─────────────┐
          │  PARSING    │ 10%
          └──────┬──────┘
                 │
                 v
          ┌─────────────┐
    ┌────>│ FETCHING    │ 15%
    │     └──────┬──────┘
    │            │
    │            v
    │     ┌─────────────┐
    │     │TREE_FETCHED │ 25%
    │     └──────┬──────┘
    │            │
    │            ├─── Cache hit ───> [CACHED] 100% ──> END
    │            │
    │            v
    │     ┌─────────────┐
    │     │  STARTING   │ 30%
    │     └──────┬──────┘
    │            │
    │            v
    │     ┌─────────────┐
    │  ┌─>│ ANALYZING   │ 30-95%
    │  │  │    FILE     │
    │  │  └──────┬──────┘
    │  │         │
    │  │         ├─── More files ───┘
    │  │         │
    │  │         ├─── File error ──> [FILE_ERROR] ──┘
    │  │         │
    │  │         v
    │  │  ┌─────────────┐
    │  │  │ GENERATING  │ 95%
    │  │  │   REPORT    │
    │  │  └──────┬──────┘
    │  │         │
    │  │         v
    │  │  ┌─────────────┐
    │  │  │  COMPLETE   │ 100%
    │  │  └──────┬──────┘
    │  │         │
    │  │         v
    │  │       END
    │  │
    │  └─── Error at any stage ──> [ERROR] 0% ──> END
    │
    └─── Network error ──> [ERROR] 0% ──> END
```

## Event Properties by Stage

```
Stage              | stage | message | progress | current | total | data
-------------------+-------+---------+----------+---------+-------+------
connected          |   ✓   |    ✓    |    ✓     |         |       |
validation         |   ✓   |    ✓    |    ✓     |         |       |
parsing            |   ✓   |    ✓    |    ✓     |         |       |
fetching_tree      |   ✓   |    ✓    |    ✓     |         |       |
tree_fetched       |   ✓   |    ✓    |    ✓     |         |       |  ✓
analysis_starting  |   ✓   |    ✓    |    ✓     |         |       |  ✓
analyzing_file     |   ✓   |    ✓    |    ✓     |    ✓    |   ✓   |  ✓
file_error         |   ✓   |    ✓    |    ✓     |    ✓    |   ✓   |  ✓
generating_report  |   ✓   |    ✓    |    ✓     |         |       |
cached             |   ✓   |    ✓    |    ✓     |         |       |
complete           |   ✓   |    ✓    |    ✓     |         |       |  ✓
error              |   ✓   |    ✓    |    ✓     |         |       |  ✓
```

## Client State Machine

```javascript
// Recommended client state management
const STATE = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  VALIDATING: 'validating',
  FETCHING: 'fetching',
  ANALYZING: 'analyzing',
  COMPLETING: 'completing',
  COMPLETE: 'complete',
  ERROR: 'error'
};

function getClientState(serverStage) {
  switch (serverStage) {
    case 'connected':
      return STATE.CONNECTING;
    case 'validation':
    case 'parsing':
      return STATE.VALIDATING;
    case 'fetching_tree':
    case 'tree_fetched':
    case 'analysis_starting':
      return STATE.FETCHING;
    case 'analyzing_file':
    case 'file_error':
      return STATE.ANALYZING;
    case 'generating_report':
      return STATE.COMPLETING;
    case 'complete':
    case 'cached':
      return STATE.COMPLETE;
    case 'error':
      return STATE.ERROR;
    default:
      return STATE.IDLE;
  }
}
```

## UI Recommendations by Stage

```
Stage              UI Element                     Action
-----------------  -----------------------------  ------------------
connected          Loading indicator              Show spinner
validation         Progress text                  "Validating..."
parsing            Progress text                  "Processing..."
fetching_tree      Progress bar + text            "Fetching files..."
tree_fetched       Info badge                     "Found N files"
analysis_starting  Progress bar + text            "Starting analysis..."
analyzing_file     Progress bar + file list       Highlight current file
file_error         Warning icon + message         Show warning badge
generating_report  Progress bar + text            "Generating report..."
cached             Success icon                   "Loaded from cache"
complete           Results display                Show full results
error              Error message                  Show error alert
```

## Summary

- **12 possible event stages**
- **Progress range: 0-100%**
- **3 possible outcomes:** complete, cached, error
- **1 non-fatal event:** file_error (continues)
- **Average duration:** 10-60 seconds (depends on file count)
- **Events per analysis:** 7 + (2 × file_count) typically
