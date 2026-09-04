# MASTER IMPLEMENTATION PROMPT — CBOM SENTINEL FRONTEND

You are working on an existing Figma Create-generated React/TypeScript frontend called **CBOM Sentinel**, a cybersecurity / post-quantum cryptography intelligence dashboard.

The current frontend already has a strong visual direction, including a dark cyber-security aesthetic, animated hero/scanner, CBOM findings dashboard, risk visualization, algorithm visualization, MOSCA simulator, NIST PQC migration roadmap, export section, animated background, and sticky navigation.

**Do not throw away the existing design and rebuild it as a generic SaaS dashboard.**

The goal is to transform the current frontend from a mostly visual/mock implementation into a **production-quality, backend-connected, interactive cybersecurity application** while preserving and improving the existing visual identity.

The application should feel like a serious security analysis command center—not a normal admin dashboard.

---

# 1. PRIMARY OBJECTIVE

Convert the current application into a real frontend for a CBOM scanning and post-quantum migration platform.

The frontend must:

* communicate with the existing backend APIs
* accept a repository URL/path
* support ZIP upload and drag-and-drop
* display real CBOM scan results
* handle loading, success, empty, and error states
* calculate/display dashboard metrics from real backend data
* use the backend MOSCA endpoint for authoritative MOSCA calculations
* support dynamic PQC recommendations
* connect CBOM findings to the PQC migration roadmap
* generate actual downloadable reports rather than simulating export
* remain visually polished and animated
* work on desktop, tablet, and mobile
* support keyboard navigation and accessibility
* respect `prefers-reduced-motion`
* gracefully fall back to demo/mock mode when explicitly enabled or when appropriate
* never silently display fake data as though it came from the backend

The finished result must be a functioning frontend application, not a clickable visual prototype.

---

# 2. IMPORTANT EXISTING CODEBASE RULE

You are modifying the current project.

Before making changes:

1. Inspect the existing project structure.
2. Identify the existing components, API files, types/interfaces, mock data, styles, hooks, and utility functions.
3. Reuse good existing components instead of duplicating them.
4. Preserve the existing visual language wherever possible.
5. Remove duplicated or contradictory implementations.
6. Do not create multiple competing API layers.
7. Do not hardcode data that should come from the backend.
8. Do not replace working UI simply because you can build it differently.
9. Keep the code modular and maintainable.

The current visual design is an asset. The goal is to make it real and robust.

---

# 3. REQUIRED APPLICATION ARCHITECTURE

Create a clean data flow:

```text
                         ┌──────────────────┐
                         │     Scanner      │
                         └────────┬─────────┘
                                  │
                    repository / ZIP upload
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   API Service    │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     Backend      │
                         └────────┬─────────┘
                                  │
                              CBOMReport
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Global/App State│
                         └────────┬─────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            ▼                     ▼                     ▼
      CBOM Findings          MOSCA Analysis       PQC Roadmap
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  ▼
                              Export
```

Use a single source of truth for the scan result.

The application must have a real state model capable of representing at least:

```ts
type ScanStatus =
  | "idle"
  | "scanning"
  | "success"
  | "empty"
  | "error";

interface AppState {
  scanStatus: ScanStatus;
  report: CBOMReport | null;
  selectedFinding: Finding | null;
  selectedAlgorithm: string | null;
  backendStatus: "unknown" | "online" | "offline";
  demoMode: boolean;
  error: string | null;
}
```

Use appropriate React context, reducer, state management, or another clean approach.

Do not scatter unrelated copies of the same report state across components.

---

# 4. TYPE SYSTEM

Create or improve centralized TypeScript types.

Do not use `any` for backend data.

Create clear interfaces for:

* `CBOMReport`
* `CBOMSummary`
* `Finding`
* `Artifact`
* `AlgorithmStatistics`
* `MOSCARequest`
* `MOSCAResponse`
* `PQCStandard`
* `MigrationRecommendation`
* `ExportResponse`

The frontend must map backend data into typed models through a single normalization/adapter layer when necessary.

If backend field names differ from frontend names, normalize them once instead of adding defensive hacks everywhere.

---

# 5. CENTRALIZED API SERVICE

Keep all backend communication inside a centralized API service.

The existing `src/api/cbom.ts` can be expanded/refactored rather than creating random fetch calls throughout components.

Implement functions conceptually equivalent to:

```ts
scanRepo(repoUrl)
scanUpload(file)
calculateMosca(payload)
getPqcStandards()
getRecommendation(algorithm)
generateReport(format, report)
```

Use one configurable base URL.

Support environment configuration such as:

```text
VITE_API_BASE_URL
```

Do not hardcode localhost URLs throughout the application.

The API service must:

* use `fetch` or the existing project HTTP mechanism consistently
* handle non-2xx responses
* parse JSON safely
* detect malformed responses
* preserve useful backend error messages
* throw typed/meaningful errors
* support cancellation using `AbortController` where appropriate
* avoid duplicate requests
* allow request timeout handling where appropriate

---

# 6. ENVIRONMENT CONFIGURATION

Use an environment variable for the backend URL.

For example:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Do not expose secrets in frontend code.

Create a clearly documented configuration path for development and production.

If the backend uses CORS, make the frontend implementation compatible with it.

---

# 7. REAL SCANNER IMPLEMENTATION

The current scanner animation is visually good but currently behaves largely like a simulation.

Change it into a real scanner.

There should be two actual modes:

```text
LOCAL REPOSITORY
UPLOAD ZIP
```

These must be real selectable states.

Use something like:

```ts
const [scanMode, setScanMode] =
  useState<"repository" | "upload">("repository");
```

The active mode must be visually obvious.

---

# 8. REPOSITORY SCAN

For repository mode:

Provide a proper input field for repository URL/path.

The value must actually be used.

When the user clicks:

```text
INITIATE SCAN
```

call:

```text
GET /api/v1/scan
```

using the backend's required parameter structure.

Do not simply wait 4.5 seconds and display mock data.

The animation should represent the real request state.

Correct flow:

```text
Idle
 ↓
User submits repository
 ↓
Validate input
 ↓
Request begins
 ↓
Scanner animation
 ↓
Backend responds
 ↓
Normalize report
 ↓
Store report
 ↓
Dashboard updates
```

Disable duplicate submissions while a request is active.

---

# 9. ZIP UPLOAD

Implement genuine ZIP upload functionality.

Provide:

* visible file picker
* drag and drop
* click-to-select
* selected filename display
* file size display
* file validation
* remove/replace file action
* upload progress/loading state where technically possible

Use:

```html
<input type="file">
```

with appropriate MIME/extension validation.

Send the ZIP as multipart form data to:

```text
POST /api/v1/scan-upload
```

using the exact backend parameter expected by the API.

Do not fake a successful upload.

The drop handler must actually capture the file.

Example behavior:

```text
Drop ZIP
 ↓
Validate
 ↓
Show selected file
 ↓
INITIATE SCAN
 ↓
POST multipart/form-data
 ↓
Show scanning UI
 ↓
Receive CBOM report
 ↓
Display results
```

---

# 10. SCAN VALIDATION

Before making API calls:

Repository mode:

* reject empty input
* validate basic repository URL/path syntax
* show a useful inline validation message

ZIP mode:

* reject no file
* reject invalid extension/type
* optionally enforce a reasonable size limit
* explain validation failure clearly

Do not use browser alerts for ordinary validation.

Use visually integrated inline messages.

---

# 11. SCAN LOADING EXPERIENCE

Do not remove the existing cyber-terminal scanner aesthetic.

Improve it.

During a real scan display:

* scanning state
* animated terminal/log output
* current phase if backend information is available
* elapsed time
* subtle progress indicator if actual progress is available
* disabled scan action while active

Do not claim fake backend events.

If the backend does not provide scan phases, use clearly generic UI such as:

```text
INITIALIZING ANALYSIS
ANALYZING ARTIFACTS
BUILDING CBOM
FINALIZING REPORT
```

but never imply these are exact backend events if they aren't.

---

# 12. SCAN SUCCESS

When the backend responds successfully:

Store the real `CBOMReport`.

Do not merge the backend report with `MOCK_REPORT`.

Do not overwrite real values with mock defaults.

The dashboard must derive its content from the actual report.

Then smoothly transition from scanner state to results.

---

# 13. EMPTY RESULT STATE

Handle a valid scan that produces no findings.

Show something like:

```text
SCAN COMPLETE

No cryptographic findings were detected in this repository.

The CBOM contains no actionable cryptographic migration items.
```

Still display useful scan metadata such as files/artifacts analyzed if available.

Do not show an empty dashboard populated with fake findings.

---

# 14. BACKEND ERROR STATE

Handle:

* network failure
* timeout
* 400-level response
* 500-level response
* malformed response
* backend offline

Show a professional error state.

Example:

```text
SCAN COULD NOT BE COMPLETED

The analysis service could not process this request.

[Retry Scan]
[Use Demo Mode]
```

Only show `Use Demo Mode` when demo mode is intentionally supported.

Never silently switch from real backend data to fake data.

---

# 15. DEMO MODE

Implement an explicit demo mode.

Demo data may remain in the repository for hackathon/demo purposes, but it must be clearly separated from real API data.

For example:

```ts
const DEMO_MODE = ...
```

or an environment/config switch.

Display subtle status:

```text
DEMO MODE
```

or:

```text
LIVE BACKEND
```

somewhere appropriate.

The user must always be able to tell whether the displayed results are real backend results or demonstration data.

Do not allow demo data to masquerade as real scan output.

---

# 16. GLOBAL REPORT STATE

The main application currently only tracks something similar to:

```ts
scanComplete
```

This is insufficient.

Replace this with proper application state.

The main app should know:

```text
scan status
report
selected finding
selected algorithm
backend state
demo state
error
```

The report should be passed into downstream sections or made available through a clean context/state architecture.

---

# 17. CBOM SECTION MUST USE REAL DATA

`CBOMSection` must not default to mock data during normal operation.

Do not do:

```ts
report = MOCK_REPORT
```

as the normal fallback.

Use:

```ts
report: CBOMReport | null
```

and handle null explicitly.

All dashboard numbers must be derived from the actual report.

This includes:

* total artifacts
* quantum-vulnerable count
* critical findings
* high findings
* medium findings
* low findings
* safe findings
* file count
* algorithm counts
* migration statistics

---

# 18. REMOVE ALL CONTRADICTORY HARD-CODED METRICS

There are currently contradictory values such as scan results and export statistics not matching the mock report.

Remove all hardcoded dashboard numbers.

Never display values such as:

```text
47
4
312
```

unless those values come from actual report data.

Create computed selectors/helpers:

```ts
getSummary(report)
getSeverityDistribution(report)
getAlgorithmStats(report)
getFileCount(report)
getQuantumVulnerabilityCount(report)
```

The same report must produce consistent numbers throughout the application.

---

# 19. SUMMARY CONSISTENCY

Ensure:

```text
critical + high + medium + low + safe
```

matches the total findings where those categories are mutually exclusive.

Ensure quantum-vulnerable counts have a clearly defined meaning.

Do not accidentally mix:

* classically broken
* quantum-vulnerable
* quantum-weakened
* quantum-resistant

Define the semantics clearly in code and UI.

---

# 20. CBOM TABLE

Preserve the current terminal/security-tool visual style.

Improve the table so it provides:

* artifact/file
* cryptographic algorithm
* key size
* severity
* quantum status
* impact
* recommendation
* finding details

Ensure consistent alignment.

Make rows truly interactive.

Use semantic buttons or accessible interactive elements rather than non-focusable `<div>` click targets.

---

# 21. RESPONSIVE CBOM TABLE

Desktop:

Use the rich table/grid layout.

Tablet:

Allow controlled horizontal scrolling or an adaptive layout.

Mobile:

Transform rows into stacked cards/list items.

Mobile finding cards should show:

```text
FILE
ALGORITHM
SEVERITY
QUANTUM STATUS
RECOMMENDATION
VIEW DETAILS
```

Do not simply force a huge desktop table into a mobile viewport.

---

# 22. CBOM FILTERS

Filters must work from the actual report.

Support:

* severity
* algorithm
* quantum vulnerability
* file/path search

Filtering must be composable.

For example:

```text
Severity = Critical
+
Algorithm = RSA
+
Quantum = Vulnerable
```

should produce the correct subset.

Show a useful empty-filter state:

```text
NO MATCHING FINDINGS
Try changing or clearing your filters.
```

---

# 23. CBOM DETAIL DRAWER

Keep the existing detailed drawer concept but improve it.

It must include:

* finding title
* file path
* algorithm
* key size
* severity
* quantum vulnerability
* quantum impact
* migration recommendation
* code snippet
* vulnerable line
* contextual explanation

Accessibility requirements:

```text
role="dialog"
aria-modal="true"
```

Use an accessible close button.

Support Escape-to-close.

Trap focus while open.

Restore focus to the triggering row/button when closed.

Prevent inappropriate background interaction.

---

# 24. CODE VIEWER

The code viewer must look like a real developer/security code panel.

Include:

* line numbers
* syntax highlighting
* highlighted vulnerable line
* horizontal scrolling when necessary
* monospace font
* file path/header

Determine the vulnerable line from backend data when available.

If the backend only provides a snippet without line metadata, clearly indicate the relevant region without inventing an exact source line.

Do not claim a line is vulnerable unless the data supports it.

---

# 25. ALGORITHM VISUALIZATION

The algorithm visualization must be based on actual findings.

Do not reduce all variants blindly.

Keep enough information to distinguish meaningful variants where relevant, for example:

```text
RSA-2048
RSA-4096
ECDSA-P256
ECDSA-P384
AES-128
AES-256
```

Where aggregation is appropriate, make the aggregation deliberate and documented.

The chart should support hover/focus details.

Show:

* algorithm
* number of occurrences
* severity
* quantum impact
* recommended migration

Use a rich tooltip or accessible detail panel.

---

# 26. ALGORITHM ACCESSIBILITY

Do not rely solely on hover.

Tooltip information must also be accessible by:

* keyboard focus
* click/tap

Do not communicate risk only using color.

Use:

* labels
* icons
* text
* severity indicators

---

# 27. RISK DISTRIBUTION ANIMATION

Keep the current polished donut/risk visualization.

Improve it so:

* the chart animates once on entry
* segments reveal smoothly
* legend items reveal sequentially
* values come from the real report
* zero values are handled safely
* labels remain readable

Do not let animation distort numerical meaning.

---

# 28. MOSCA — BACKEND INTEGRATION

This is critical.

Do NOT calculate the authoritative MOSCA result entirely in the frontend.

Use the backend endpoint:

```text
POST /api/v1/mosca
```

Send the required input values.

Use the backend's response for the authoritative result.

The UI may still calculate harmless display-only values locally, but the security conclusion/result must come from the backend when that backend endpoint exists.

---

# 29. MOSCA INPUT CONTROLS

Keep the interactive controls for:

* data shelf life
* migration window
* Q-day estimate / relevant configured value

Each value must be editable.

Use numeric validation.

Prevent negative/invalid values.

Show the configured unit clearly.

When a value changes:

```text
input changes
 ↓
debounce or explicit calculate
 ↓
call MOSCA backend
 ↓
receive result
 ↓
animate UI to the new state
```

Avoid excessive API requests while the user is rapidly typing.

---

# 30. MOSCA GAUGE ANIMATION

Fix the existing gauge animation.

The gauge should conceptually animate:

```text
0%
 ↓
actual threat ratio
```

on initial entry.

When the user changes the values, animate:

```text
previous ratio
 ↓
new ratio
```

not:

```text
0
 ↓
new ratio
```

Do not fake the gauge position by simply drawing the final arc and animating its path length.

Animate the actual numerical ratio/angle state.

---

# 31. MOSCA NUMBER ANIMATION

Use animated interpolation.

Example:

```text
10 → 15
```

must visibly transition from 10 to 15.

Do not restart from zero every time a value changes.

---

# 32. MOSCA TIMELINE

Redesign the MOSCA timeline as a true shared conceptual timeline rather than three unrelated progress bars.

Represent:

```text
DATA SHELF LIFE
──────────────────────────────►

MIGRATION WINDOW
────────────────────────►

Q-DAY
──────────────────────────────────►
```

The timeline should visually communicate overlap and risk.

When the configured values change:

* marker positions should smoothly transition
* bars should smoothly resize
* risk state should update
* the animation should start from the previous position rather than resetting to zero

Keep the interaction visually understandable.

---

# 33. MOSCA RISK STATE

Show clear states such as:

```text
LOW RISK
MODERATE RISK
HIGH RISK
CRITICAL / AT RISK
```

Use the backend result when available.

Do not hardcode the final risk conclusion.

Explain the risk state in clear security language.

---

# 34. MOSCA LOADING/ERROR STATES

The MOSCA section must support:

```text
Calculating…
```

and:

```text
Unable to calculate MOSCA
[Retry]
```

Do not freeze the rest of the dashboard because the MOSCA API failed.

The application should remain usable.

---

# 35. PQC STANDARDS API

Use:

```text
GET /api/v1/pqc-standards
```

where supported by the backend.

Do not hardcode the authoritative standard list if the backend already provides it.

Handle:

* loading
* success
* empty response
* error

Cache the standards where appropriate.

---

# 36. RECOMMENDATION API

Use:

```text
GET /api/v1/recommendation?algo=...
```

for algorithm-specific migration recommendations if implemented by the backend.

Do not blindly show one static recommendation for every algorithm.

---

# 37. OPERATION-AWARE CRYPTO MIGRATION

Do not oversimplify migration recommendations.

Distinguish operations where necessary.

Examples:

```text
RSA encryption/key establishment → ML-KEM
RSA signatures → ML-DSA / SLH-DSA
ECDH → ML-KEM
ECDSA → ML-DSA / SLH-DSA
```

The recommendation should be based on the cryptographic operation and backend intelligence whenever available.

Avoid misleading mappings such as treating every RSA usage as identical.

---

# 38. PQC ROADMAP

The roadmap must reflect actual findings rather than always displaying the same static migration path.

Use real affected algorithms from the CBOM report.

When the report contains RSA, the roadmap can emphasize relevant RSA migration paths.

When it contains ECDSA, highlight the relevant signature migration path.

When it contains ECDH, highlight the relevant key-establishment migration path.

---

# 39. CBOM → ROADMAP INTERACTION

Create shared interaction state.

When a user selects an algorithm/finding in the CBOM:

```text
User clicks RSA finding
        ↓
selectedAlgorithm = "RSA"
        ↓
Roadmap updates
        ↓
RSA migration path highlighted
```

Likewise:

```text
ECDSA
 ↓
signature migration path highlighted
```

Use subtle animation to guide the user's attention.

Do not navigate the user away from the dashboard unnecessarily.

---

# 40. ROADMAP VISUALIZATION

Build the migration path as a genuine visual sequence, for example:

```text
CURRENT CRYPTO
      ↓
PQC TRANSITION
      ↓
HYBRID DEPLOYMENT
      ↓
PQC-READY
```

Where appropriate:

```text
RSA
 ↓
ML-DSA / ML-KEM based on operation
 ↓
Hybrid deployment
 ↓
PQC-ready
```

Do not represent the hybrid stage as merely a sentence underneath the graph.

Make it an actual migration node/step.

---

# 41. EXPORT FUNCTIONALITY

This is currently only a visual simulation.

Make export real.

Supported report formats should be determined by the backend/application requirements.

At minimum support the formats actually implemented by the project.

Examples may include:

```text
JSON
HTML
CBOM-compatible output
```

depending on backend support.

Do not show:

```text
REPORT READY
```

unless a real report has been generated.

---

# 42. EXPORT DATA MUST MATCH CURRENT REPORT

Export statistics must be derived from the current report.

Never hardcode:

```text
FINDINGS 47
CRITICAL 4
FILES 312
```

unless those are actually the report values.

The export section should always reflect the currently scanned repository.

---

# 43. EXPORT EXPERIENCE

When generating:

```text
Preparing report…
Generating…
Finalizing…
Ready
```

These states must correspond to an actual process.

Provide:

```text
Download
```

actions once the report exists.

Handle generation errors professionally.

---

# 44. HERO / BRANDING TRANSITION

Preserve the existing hero design.

Improve the transition into the sticky navigation.

Current behavior causes the large branding to disappear and a separate navbar to appear.

Instead create a more coherent transformation:

```text
LARGE HERO BRANDING
        ↓
scroll
        ↓
brand scales down
        ↓
compact sticky command bar
```

The visual identity should feel continuous rather than like two unrelated headers.

---

# 45. STICKY NAVIGATION

The sticky navigation should provide:

* section navigation
* current section indication where useful
* NEW SCAN action
* dashboard identity

The `NEW SCAN` action should actually reset/open the scanner state.

It should not merely scroll to the scanner while leaving stale results in place.

When creating a new scan:

* clear selected finding
* optionally clear old report depending on UX
* reset relevant scanner state
* focus the primary input

---

# 46. BACKGROUND ANIMATION

Preserve the dynamic background because it contributes strongly to the cybersecurity aesthetic.

However optimize it.

Requirements:

* account for `devicePixelRatio`
* resize correctly
* avoid unnecessary redraw complexity
* stop or reduce animation when the page/tab is hidden
* handle cleanup
* do not leak animation frames/listeners

Use:

```ts
requestAnimationFrame
```

appropriately and cancel it during cleanup.

---

# 47. REDUCED MOTION

Implement:

```css
@media (prefers-reduced-motion: reduce)
```

and/or Framer Motion's reduced-motion support.

For users who prefer reduced motion:

* disable or reduce background particle animation
* remove unnecessary large transitions
* reduce scanner effects
* reduce gauge movement
* retain information and usability

Motion should enhance the interface, not be required for comprehension.

---

# 48. ACCESSIBILITY

Implement proper accessibility throughout.

Requirements include:

* semantic buttons
* semantic inputs
* labels
* keyboard operation
* visible focus states
* accessible names
* appropriate ARIA
* accessible tooltips
* dialog semantics
* Escape behavior
* logical tab order
* color-independent status communication

Do not use:

```text
color alone
```

to communicate severity.

Every interactive element must be keyboard reachable.

---

# 49. FOCUS STATES

Every button, input, tab, filter, table interaction, and roadmap interaction should have a clear visible focus state.

Focus styling should fit the cyber aesthetic while remaining clearly visible.

---

# 50. MOBILE RESPONSIVENESS

The application must work at:

```text
desktop
tablet
mobile
```

Do not treat mobile as simply "shrink desktop."

On mobile:

* hero typography scales intelligently
* scanner controls stack vertically
* command controls remain usable
* CBOM table becomes cards/list
* detail drawer becomes a full-screen modal/sheet where appropriate
* charts resize correctly
* roadmap becomes vertically readable
* MOSCA timeline remains legible
* export cards stack
* sticky navigation remains usable

Prevent horizontal page overflow.

---

# 51. TOUCH INTERACTION

Do not depend exclusively on hover.

Anything important on desktop hover should have an equivalent:

* tap
* click
* keyboard focus

interaction.

---

# 52. TYPOGRAPHY

Preserve the existing technical/cyber typography.

Use a clear hierarchy:

```text
hero title
section title
subsection
metric
body
metadata
terminal/log text
```

Avoid excessive uppercase text where it hurts readability.

---

# 53. VISUAL DESIGN RULE

Maintain the current aesthetic:

* dark security-command-center environment
* restrained neon accents
* terminal-inspired panels
* grid/technical motifs
* subtle glow
* high contrast
* controlled gradients
* sharp information hierarchy

Avoid:

* generic gradients everywhere
* excessive glassmorphism
* huge blur effects
* unnecessary floating cards
* overly colorful dashboards
* stock illustrations
* generic SaaS visual patterns

The application should feel specialized to cybersecurity and post-quantum analysis.

---

# 54. ANIMATION RULES

Animations should communicate state or hierarchy.

Use animation for:

* section entry
* scanner progress
* result reveal
* gauge transition
* timeline transition
* chart reveal
* drawer opening
* roadmap highlighting
* sticky navigation transformation

Do NOT animate every element constantly.

Avoid:

* distracting infinite pulses
* unnecessary bouncing
* random motion
* excessive glow
* motion that impacts readability

---

# 55. ERROR BOUNDARIES / RESILIENCE

A failure in one section must not destroy the entire dashboard.

For example:

```text
CBOM report loads successfully
MOSCA API fails
```

should produce:

```text
CBOM dashboard = usable
MOSCA = error state
Roadmap = still usable
Export = still usable if possible
```

Use graceful component-level error handling where appropriate.

---

# 56. API FALLBACK BEHAVIOR

Never silently fall back to mock data.

Correct:

```text
LIVE MODE
API fails
 ↓
show API error
 ↓
user chooses "Use Demo Mode"
```

Incorrect:

```text
LIVE MODE
API fails
 ↓
silently display MOCK_REPORT
```

---

# 57. DATA NORMALIZATION

If the backend returns data with slightly different naming or nested structures, normalize it in one place.

Example:

```ts
normalizeCBOMReport(rawResponse)
```

This function should:

* validate required fields
* provide safe defaults only when semantically valid
* calculate derived display metrics
* preserve original backend values when needed

Do not spread response-shape work throughout the UI components.

---

# 58. SECURITY-SENSITIVE FRONTEND BEHAVIOR

Since this is a cybersecurity product:

* never expose backend secrets
* never expose internal server credentials
* sanitize externally supplied strings before displaying dangerous HTML
* do not render arbitrary HTML from scan results
* treat file paths and repository names as untrusted input
* do not execute scanned code
* display snippets safely

Use text rendering rather than `dangerouslySetInnerHTML` unless there is a strong reason and proper sanitization.

---

# 59. PERFORMANCE

The dashboard should remain smooth with a large number of findings.

Avoid:

```text
unnecessary re-renders
```

Use:

* memoization where beneficial
* stable callbacks where useful
* virtualization if the CBOM becomes very large
* debounced filter inputs where necessary
* request cancellation
* controlled animation complexity

Do not optimize prematurely, but ensure the architecture can handle hundreds/thousands of findings.

---

# 60. LARGE DATA HANDLING

If a report contains many findings:

* avoid rendering thousands of DOM rows at once
* paginate or virtualize where appropriate
* keep filtering responsive
* keep drawer interaction fast
* calculate summaries efficiently

---

# 61. CONSISTENT LOADING UI

Every backend-driven section should have a deliberate loading state.

Examples:

```text
Scanning…
Calculating…
Loading standards…
Generating report…
```

Use skeletons/spinners/progress indicators consistent with the visual system.

Do not leave blank areas while requests are running.

---

# 62. CONSISTENT EMPTY STATES

Use meaningful empty states.

Examples:

```text
NO FINDINGS
```

```text
NO ALGORITHMS FOUND
```

```text
NO MIGRATION DATA AVAILABLE
```

Do not display broken charts or NaN values.

---

# 63. SAFE NUMERICAL HANDLING

Guard against:

* division by zero
* null values
* undefined values
* empty arrays
* invalid percentages
* negative values
* NaN

MOSCA and chart calculations must never produce:

```text
NaN
Infinity
```

in the UI.

---

# 64. DATA SEMANTICS

Make the security vocabulary precise.

Clearly distinguish:

```text
Classically vulnerable
Quantum vulnerable
Quantum weakened
Quantum resistant
Migration recommended
PQC ready
```

Do not label an algorithm "quantum vulnerable" merely because it is generally important in migration unless the application's defined data model explicitly supports that interpretation.

---

# 65. CURRENT KNOWN UI BUGS TO FIX

Fix all known implementation issues including:

* duplicate `samples/` breadcrumb
* hardcoded export statistics
* scan output not matching report data
* hardcoded scan counts
* fake upload mode
* inactive mode selector
* mock report being used as normal output
* missing roadmap interaction
* missing MOSCA API integration
* missing PQC standards/recommendation API integration
* missing actual export generation
* inaccessible clickable table rows
* incomplete drawer accessibility
* no vulnerable-line highlighting
* no actual syntax highlighting
* no algorithm detail tooltip
* non-responsive CBOM table
* incorrect animation reset behavior
* fragmented hero/sticky-nav transition
* missing reduced-motion support
* background animation performance issues

---

# 66. REMOVE DUPLICATION

Do not duplicate:

* API logic
* report calculation logic
* algorithm classification logic
* severity calculation logic
* formatting logic
* migration mapping logic

Place reusable logic into appropriate utilities/hooks/services.

---

# 67. COMPONENT ORGANIZATION

Maintain a clean structure similar to:

```text
src/
  api/
    cbom.ts
    mosca.ts
    pqc.ts
    export.ts

  components/
    scanner/
    cbom/
    mosca/
    roadmap/
    export/
    navigation/
    common/

  hooks/
    useScan.ts
    useMosca.ts
    useReducedMotion.ts

  types/
    cbom.ts
    mosca.ts
    pqc.ts

  utils/
    normalization.ts
    calculations.ts
    formatting.ts
```

Do not blindly create all folders if unnecessary, but maintain equivalent separation of concerns.

---

# 68. TESTABLE BEHAVIOR

The following user journeys must work:

## Journey A — Repository scan

```text
Open application
 ↓
Enter repository URL
 ↓
Click INITIATE SCAN
 ↓
Backend API request
 ↓
Loading state
 ↓
Real CBOM report returned
 ↓
Dashboard populates
```

## Journey B — ZIP scan

```text
Select UPLOAD ZIP
 ↓
Drop ZIP
 ↓
File appears
 ↓
Click scan
 ↓
POST /api/v1/scan-upload
 ↓
Real CBOM report
 ↓
Dashboard populates
```

## Journey C — Finding inspection

```text
Scan completes
 ↓
Click finding
 ↓
Accessible detail drawer opens
 ↓
Code + vulnerable location + recommendation shown
```

## Journey D — Algorithm → roadmap

```text
Click RSA finding
 ↓
RSA becomes selected
 ↓
Roadmap highlights RSA migration path
```

## Journey E — MOSCA

```text
Change shelf-life value
 ↓
Backend calculation
 ↓
Gauge transitions from previous value to new value
 ↓
Timeline transitions
 ↓
Risk state updates
```

## Journey F — Export

```text
Click JSON export
 ↓
Report generated
 ↓
Correct current statistics shown
 ↓
Download real file
```

---

# 69. BROWSER CONSOLE QUALITY

The finished application should not generate avoidable console errors.

Resolve:

* React warnings
* missing keys
* invalid nesting
* accessibility warnings where practical
* failed requests caused by frontend bugs
* uncaught promises
* stale state issues

---

# 70. TYPESCRIPT QUALITY

Avoid unnecessary:

```ts
any
as any
@ts-ignore
```

Use proper typing.

If a backend response cannot be trusted, parse/validate it rather than using `any`.

---

# 71. FINAL VALIDATION CHECKLIST

Before considering the implementation complete, verify all of the following:

### Scanner

* [ ] repository input works
* [ ] repository scan reaches backend
* [ ] ZIP mode works
* [ ] drag/drop works
* [ ] file picker works
* [ ] real loading state works
* [ ] errors work
* [ ] empty scans work
* [ ] demo mode is explicit

### Data

* [ ] real CBOM report stored centrally
* [ ] all metrics derive from report
* [ ] no contradictory numbers
* [ ] no accidental mock fallback
* [ ] algorithms are correctly categorized

### CBOM

* [ ] filters work
* [ ] search works
* [ ] detail drawer works
* [ ] keyboard interaction works
* [ ] vulnerable line is represented correctly
* [ ] code viewer is high quality
* [ ] mobile cards work

### MOSCA

* [ ] backend endpoint used
* [ ] controls work
* [ ] loading state works
* [ ] errors work
* [ ] gauge animates actual ratio
* [ ] number animations interpolate correctly
* [ ] timeline behaves like a real timeline

### PQC

* [ ] standards API integrated where available
* [ ] recommendations API integrated where available
* [ ] migration paths use real findings
* [ ] CBOM selection highlights roadmap
* [ ] hybrid stage is visually represented

### Export

* [ ] export actually generates a file
* [ ] export data matches current report
* [ ] download works
* [ ] errors are handled

### UX

* [ ] hero/sticky navigation transition feels continuous
* [ ] NEW SCAN actually resets/starts a new scan
* [ ] background animation optimized
* [ ] reduced motion respected
* [ ] mobile layout works
* [ ] focus states visible
* [ ] dialogs accessible
* [ ] keyboard navigation works
* [ ] no horizontal overflow

---

# 72. MOST IMPORTANT IMPLEMENTATION PRINCIPLE

Do not optimize this project merely for visual appearance.

A user should be able to interact with the application and trust that:

```text
WHAT I ENTER
      ↓
WHAT THE BACKEND ANALYZES
      ↓
WHAT THE DASHBOARD SHOWS
      ↓
WHAT THE ROADMAP RECOMMENDS
      ↓
WHAT THE EXPORT CONTAINS
```

are all connected to the same underlying scan/report.

There must be **one coherent source of truth**.

---

# 73. PRESERVE THE VISUAL IDENTITY

Do not replace the existing CBOM Sentinel visual design with a generic component library look.

Keep and refine:

* cyber-command-center aesthetic
* dark background
* technical grid
* restrained neon accents
* terminal-inspired scanner
* animated sections
* security-focused terminology
* sharp information hierarchy
* futuristic but professional visual style

The final product should look like a **real post-quantum security intelligence platform** suitable for a serious cybersecurity demonstration and Smart India Hackathon presentation.

---

# 74. IMPLEMENTATION PRIORITY

Work in this order:

### PHASE 1 — Foundation

1. inspect current code
2. centralize types
3. centralize API layer
4. configure backend URL
5. create application/report state

### PHASE 2 — Real scanner

6. repository scan
7. ZIP upload
8. drag/drop
9. loading/error/empty states
10. explicit demo mode

### PHASE 3 — Real CBOM dashboard

11. real report propagation
12. dynamic metrics
13. filters
14. findings drawer
15. code viewer
16. algorithm/risk charts

### PHASE 4 — Security intelligence

17. MOSCA backend
18. MOSCA animation corrections
19. PQC standards
20. recommendations
21. dynamic roadmap
22. CBOM → roadmap interaction

### PHASE 5 — Output

23. real exports
24. dynamic export statistics

### PHASE 6 — Quality

25. accessibility
26. responsive/mobile
27. reduced motion
28. performance
29. error resilience
30. console/type cleanup

Do not stop after making the UI visually impressive. Continue until the actual data flows and interactions work.

---

# 75. FINAL SUCCESS CRITERIA

The final frontend should behave like this:

```text
                  CBOM SENTINEL

          ┌─────────────────────────┐
          │ Repository / ZIP Input  │
          └────────────┬────────────┘
                       │
                       ▼
                 REAL API SCAN
                       │
                       ▼
               REAL CBOM REPORT
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     FINDINGS        MOSCA         ROADMAP
        │              │              │
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                    EXPORT
```

Every displayed number, recommendation, security finding, chart, migration path, and exported result must ultimately correspond to the current report/backend state.

**Do not leave any feature as a visual placeholder when the required backend functionality exists.**

Implement the changes directly in the existing codebase, preserve the visual quality, and prioritize correctness and real data flow over superficial animation.

After implementation, review the entire project again for:

* broken interactions
* hardcoded/mock values accidentally left in production flow
* contradictory statistics
* responsiveness problems
* accessibility issues
* unnecessary duplicated logic
* API error handling
* animation regressions

The finished result must be a polished, responsive, accessible, backend-connected **CBOM Sentinel Post-Quantum Security Intelligence Dashboard**, not a mockup.
