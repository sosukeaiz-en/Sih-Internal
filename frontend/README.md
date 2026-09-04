# Quantum Guard Console

Build a high-end, interactive cybersecurity web application frontend for the existing project “CBOM Sentinel — Cryptographic Bill of Materials & PQC Risk Engine.”

IMPORTANT: This is a frontend redesign and implementation task. Do NOT replace, rewrite, or simplify the existing backend logic. The repository already contains the scanner, risk engine, Mosca calculator, PQC recommendation logic, and FastAPI endpoints. The frontend must consume the existing backend/API contract wherever possible.

The current project is designed to:

Scan source repositories for cryptographic artifacts

Detect algorithms such as RSA, ECDSA, ECDH, DH, DSA, Ed25519, AES, DES, 3DES, MD5, SHA-1, SHA-256 and SHA-512

Classify cryptographic risk

Identify quantum-vulnerable algorithms

Evaluate Mosca’s Theorem

Recommend post-quantum replacements

Show NIST PQC standards

Export CBOM reports

The goal is to transform the current functional dashboard into something that feels like a premium cybersecurity command center, not a normal dashboard.

Do not make it look like a generic SaaS admin panel.

The experience should feel like:
“quantum-security operations console + developer security workstation + futuristic threat intelligence interface.”

==================================================

OVERALL VISUAL DIRECTION
==================================================

Use a sophisticated dark cybersecurity visual system.

Primary background:

Deep near-black navy: #070B14

Secondary surfaces: #0B1220 / #101827

Subtle blue-black gradients

Accent palette:

Electric cyan: #22D3EE

Bright blue: #3B82F6

Violet: #8B5CF6

Warning amber: #F59E0B

High risk orange: #F97316

Critical red: #EF4444

Safe green: #10B981

Do NOT use excessive neon effects everywhere.

Use neon accents strategically for:

active states

scan progress

important metrics

graph highlights

buttons

status indicators

quantum-risk indicators

Typography:

Use a modern technical font such as Inter for normal UI

Use a slightly more technical/monospace style for:

code

algorithm names

file paths

metrics

technical labels

scan logs

Visual language:

Glassmorphism, but restrained

Thin 1px borders

Low-opacity cyan/blue borders

Soft inner glow

Slight surface gradients

Subtle depth

Rounded corners around 14–20px

Avoid giant generic cards with excessive padding

Avoid bootstrap-like layouts

Avoid overly rounded “startup SaaS” UI

The page should feel engineered, precise and technical.

==================================================
2. DYNAMIC BACKGROUND

Create a dynamic full-page background.

Do NOT use a static plain color.

Use a combination of:

animated radial gradients

subtle grid

faint circuit-board style lines

tiny moving particles/nodes

extremely subtle noise texture

slow-moving blue/cyan light fields

occasional scanning line effect

The background should move very slowly and continuously.

It must remain subtle enough that content remains readable.

Possible visual concept:

A dark quantum/cyber grid where faint nodes periodically light up and tiny signals travel along horizontal/diagonal paths.

Use CSS/canvas/WebGL only if appropriate.

Do not make it look like a gaming website.

==================================================
3. HERO / LANDING SECTION

The first viewport should immediately communicate what CBOM Sentinel does.

IMPORTANT:
The Code Scanner must be at the LEFT side of the starting/hero section.

Create a split hero layout.

LEFT:
A large futuristic “Codebase Scanner” interface.

RIGHT:
Brand, title, tagline and system summary.

The scanner should look like a real security analysis console, not a file-upload card.

LEFT SCANNER PANEL:

Header:
“CODEBASE SCANNER”

Small status:
“READY FOR ANALYSIS”

Provide two scan modes:

Local Repository

Upload ZIP

For the frontend demo, the scanner panel must be interactive.

Include:

repository input area / drag-and-drop zone

upload button

scan button

supported languages indicator:
Python
Java
JavaScript / TypeScript
Go

When scanning:
show a convincing animated scan sequence.

Example visual states:

READY
→ INITIALIZING ENGINE
→ WALKING REPOSITORY
→ PARSING SOURCE FILES
→ DETECTING CRYPTOGRAPHIC ARTIFACTS
→ CLASSIFYING QUANTUM RISK
→ BUILDING CBOM
→ ANALYSIS COMPLETE

Show:

animated progress bar

scan percentage

current file being analyzed

tiny terminal-like log area

moving scan-line

subtle pulse around the scanner

artifact count increasing during the animation

When complete:
transition smoothly into a successful state:

“SCAN COMPLETE”
“47 cryptographic artifacts discovered”
“18 quantum-vulnerable”
“4 critical”

Do not fake API data when a real backend response is available.

If backend is unavailable, provide a polished mock/demo mode so the UI remains usable.

RIGHT HERO:

Create a very strong brand presentation.

Small eyebrow:
“POST-QUANTUM SECURITY INTELLIGENCE”

Main title:
“CBOM SENTINEL”

Subtitle:
“Cryptographic Bill of Materials & PQC Risk Engine”

Tagline should be something powerful and concise, for example:

“Find the cryptography that won’t survive the quantum era.”

Highlight “quantum” / “PQC” visually.

Add a short supporting sentence about discovering vulnerable cryptographic assets, evaluating quantum risk, and planning migration.

Add a small system-status row:
“SCANNER ONLINE”
“RISK ENGINE ONLINE”
“PQC ENGINE ONLINE”

Use small glowing status indicators.

==================================================
4. HERO BRAND SHRINK / STICKY TRANSFORMATION

This is very important.

The initial logo + title + tagline should appear LARGE and visually dominant.

As the user scrolls down:

logo gradually shrinks

title reduces in size

tagline fades/reduces

hero spacing collapses

navigation becomes compact

Eventually the branding should become a small fixed/sticky header at the top.

The transition should be continuous based on scroll position.

Do NOT simply snap from large header to small header.

Animation concept:

At scroll = 0:
Large CBOM Sentinel branding.

At moderate scroll:
branding scales down + opacity adjusts.

At deeper scroll:
compact top navigation appears.

Final state:
fixed compact header with:

small shield/logo

CBOM Sentinel

navigation tabs/anchors

scan button

system status

Use Framer Motion / Motion for React or equivalent scroll animation.

==================================================
5. NAVIGATION

Do not use a standard navbar from the beginning.

The hero branding itself should act as the visual introduction.

Once the user scrolls, transform into a compact command-center navigation.

Navigation sections:

SCAN
CBOM
MOSCA
PQC ROADMAP
EXPORT

Active section should have:

animated cyan indicator

subtle glowing underline

smooth transition

Scrolling to sections should be smooth.

==================================================
6. TRANSITION BETWEEN SECTIONS

Every major section should reveal itself as the user scrolls.

Use:

fade + upward translation

blur-to-sharp transitions

scale from ~0.97 to 1

staggered child animations

Do NOT animate every element excessively.

Animations should feel deliberate and premium.

Use:

500–900ms section entrance transitions

staggered cards around 50–100ms

smooth easing

slight parallax where appropriate

Respect prefers-reduced-motion.

==================================================
7. CBOM OVERVIEW SECTION

After the hero scanner, create a strong CBOM Overview section.

Header:

“CRYPTOGRAPHIC BILL OF MATERIALS”

Supporting description:
“Every cryptographic artifact discovered across the scanned codebase.”

At the top show 5 high-level metrics:

TOTAL ASSETS
QUANTUM VULNERABLE
CRITICAL
HIGH RISK
SAFE / PQC READY

Do not make them ordinary dashboard metric cards.

Instead:
Use compact intelligence tiles with:

large number

tiny explanation

status indicator

micro-animation

subtle background glow

optional micro-sparkline or decorative signal

Numbers should animate from 0 → final value when the section enters the viewport.

==================================================
8. CBOM ARTIFACT TABLE — VERY IMPORTANT

The current implementation has a data table, but redesign it completely.

Do NOT dump every property into one huge spreadsheet-like table.

The table must look clean, sorted, structured and readable.

Primary columns:

RISK
ALGORITHM
LANGUAGE
FILE
LINE
OPERATION
KEY SIZE
QUANTUM IMPACT
RECOMMENDED PQC

Hide secondary technical details behind expansion or a detail drawer.

Use visual hierarchy.

Risk:

Critical = red

High = orange

Medium = amber

Low = blue

Safe = green

Quantum vulnerability:
use a compact visual badge instead of large text.

Language:
use small language badges/icons.

Algorithm:
make prominent.

File:
use monospace typography.

Recommended PQC:
show compact recommendation chips.

Add:

search

filter

sort

risk filter

language filter

quantum vulnerable toggle

Default sort:
Critical → High → Medium → Low → Safe

Add smooth row hover.

When clicking a row, open an animated detail panel/drawer.

==================================================
9. FINDING DETAIL DRAWER

When the user clicks a CBOM finding:

Open a right-side detail panel with smooth spring animation.

Show:

FILE
LINE NUMBER
LANGUAGE
ALGORITHM
OPERATION
KEY SIZE
RISK LEVEL
QUANTUM IMPACT
CLASSICAL SECURITY BITS
RECOMMENDED PQC
PQC CATEGORY
NOTES

Then show the code snippet in a beautiful code viewer.

Syntax highlighting should look like an actual developer security tool.

Add a highlighted line showing where the vulnerable cryptography was detected.

Below the code:

“MIGRATION RECOMMENDATION”

Show:
Legacy algorithm → Recommended PQC

Example:
RSA
↓
ML-KEM / ML-DSA

Make this feel actionable.

==================================================
10. RISK VISUALIZATION

The Risk Level Breakdown pie chart must NOT appear instantly.

When the section enters the viewport:

chart container fades in

chart scales slightly from 0.85 → 1

pie/ring segments animate outward from the center

values/counts appear after the chart starts

legend items reveal sequentially

Prefer a modern donut chart over a basic pie chart.

Center:
“RISK”
with total artifact count.

Use the repository’s existing risk categories:
Critical
High
Medium
Low
Safe

Use the risk colors consistently.

On hover:
segment expands slightly
and shows:
risk level
count
percentage

==================================================
11. ALGORITHM GRAPH

Next to the risk visualization create an “ALGORITHMS DISCOVERED” visualization.

Do NOT use a plain default bar chart.

Use a polished horizontal bar chart or hybrid chart.

Show:
algorithm → occurrence count

Visually distinguish:
quantum vulnerable
vs
quantum safe / weakened / ready

Bars should animate from zero to their values.

Animation:

container fade

bars grow horizontally from 0

labels fade in

totals appear last

Hover:
show algorithm details:
risk
quantum impact
recommended migration

Make this feel like an intelligence visualization.

==================================================
12. CBOM VISUAL STORY

Do not make this section just:

metrics
table
chart
chart

Create visual hierarchy:

CBOM section heading

→ top summary metrics

→ artifact inventory

→ charts / intelligence layer

→ detailed finding inspector

Use different visual densities so the page has rhythm.

==================================================
13. MOSCA SECTION

The Mosca section should feel like a dedicated quantum threat simulator.

Header:

“MOSCA’S THEOREM”

Subtitle:
“Will your data outlive your migration window?”

Show the formula prominently:

x + y > z

Below it explain visually:

x = Data Shelf Life
y = Migration Time
z = Estimated Q-Day Timeline

==================================================
14. MOSCA CONTROLS

Create three visually rich controls:

DATA SHELF LIFE
MIGRATION TIME
Q-DAY TIMELINE

Do NOT make them plain HTML sliders.

They should look like futuristic instruments.

Each control:

circular/arc indicator or premium slider

numeric value

unit

small explanatory label

VERY IMPORTANT:

When the user opens/clicks the MOSCA tab/section, the displayed values must initially animate from 0 to the actual configured values.

Example:

Data Shelf Life:
0 → 2 → 5 → 8 → 10 years

Migration Time:
0 → 1 → 2 → 3 → 4 years

Q-Day:
0 → 2 → 4 → 6 → 8 → 10 years

Use animated count-up.

The gauges should visually fill while the number increases.

==================================================
15. MOSCA THREAT RATIO

The threat ratio must be highly visual.

Formula:

Threat Ratio = (x + y) / z

Display it inside a large animated gauge.

When entering the section:

gauge starts at 0

arc fills smoothly

numeric ratio counts upward

threshold marker becomes visible

risk indicator appears after the animation

Use the actual backend result whenever available.

Risk state colors:
LOW → blue/green
MEDIUM → amber
HIGH → orange
CRITICAL → red

If the result is “AT RISK NOW”:
make the final state visually urgent but not obnoxious.

Possible interaction:
The gauge can subtly pulse once when entering a critical state.

==================================================
16. MOSCA TIMELINE VISUALIZATION

Add a horizontal timeline below the controls.

Visualize:

DATA SHELF LIFE
───────────────→

MIGRATION WINDOW
───────────────→

Q-DAY
───────────────→

Show the mathematical relationship visually.

Example:

|------ Data Shelf Life ------|
|---- Migration ----|
|----------- Q-Day -----------|

If x + y exceeds z:
show the overlap with a strong “THREAT EXISTS NOW” indicator.

This will make Mosca’s Theorem understandable even to judges who are not cryptography experts.

==================================================
17. MOSCA INTERACTION

Whenever the user changes a value:

Do NOT instantly replace the visual.

Animate:

numeric values

gauge position

timeline positions

risk result

recommendation card

The interface should feel alive.

Use debouncing if API calls are needed.

The existing backend Mosca endpoint should be used for authoritative calculations.

==================================================
18. NIST PQC ROADMAP

Redesign the current NIST section completely.

Do NOT use ordinary expandable text boxes.

Turn it into a visual migration roadmap.

Header:

“NIST POST-QUANTUM MIGRATION ROADMAP”

Supporting text:
“From vulnerable classical cryptography to quantum-resistant infrastructure.”

Create a horizontal or vertical roadmap/timeline:

CURRENT CRYPTO
↓
IDENTIFY
↓
PRIORITIZE
↓
HYBRID MIGRATION
↓
PQC READY

Then map standards into this journey.

==================================================
19. NIST STANDARD CARDS

Use large visual cards for:

ML-KEM
NIST FIPS 203

ML-DSA
NIST FIPS 204

SLH-DSA
NIST FIPS 205

Falcon
NIST Selection / standardization status as represented by the existing project data

Each card should contain:

Algorithm
NIST standard
former name
purpose
variants
recommended hybrid mode

But visually organize this information.

Do not dump paragraphs.

Use:

badges

small labels

arrows

tags

mini diagrams

Example visual hierarchy:

ML-KEM
FIPS 203

KEY ENCAPSULATION

Recommended:
ML-KEM-768

Hybrid:
X25519 + ML-KEM-768

==================================================
20. MIGRATION PATH VISUALIZATION

For each detected vulnerable algorithm, show a migration path.

Example:

RSA
↓
ML-KEM
↓
Hybrid X25519 + ML-KEM-768
↓
PQC-ready

ECDSA
↓
ML-DSA
↓
Hybrid ECDSA + ML-DSA-65

MD5 / SHA-1 / DES
↓
AES-256-GCM / SHA-3

Represent this as animated connected nodes.

When a node becomes visible:

line draws from left to right

next node fades/appears

final target gets a glow

==================================================
21. NIST ROADMAP INTERACTION

The roadmap should be interactive.

When clicking:
ML-KEM
ML-DSA
SLH-DSA
Falcon

expand the corresponding information.

Use smooth expansion.

Show:
purpose
variants
recommended use
hybrid mode

Also allow clicking an algorithm from the CBOM table to highlight its recommended PQC migration in the roadmap.

For example:
click RSA in CBOM
→ roadmap highlights ML-KEM / ML-DSA recommendation.

==================================================
22. EXPORT SECTION

Create a polished export area.

Heading:
“GENERATE SECURITY EVIDENCE”

Three large export actions:

CycloneDX v1.6 JSON
Raw CBOM JSON
Executive HTML Report

Do not make them ordinary download buttons.

Use document/report visualizations.

Click animation:

brief processing state

checkmark

“Report ready”

Preserve the existing backend export functionality where available.

==================================================
23. PAGE FLOW

The final page should feel like a single cinematic security-analysis journey:

HERO / CBOM SENTINEL

CODEBASE SCANNER

CBOM OVERVIEW

ARTIFACT INVENTORY

RISK INTELLIGENCE

MOSCA QUANTUM THREAT

NIST PQC ROADMAP

EXPORT SECURITY EVIDENCE

Do not make every section look identical.

Each section should have its own visual identity while remaining part of one design system.

==================================================
24. PAGE TRANSITIONS

Add subtle transitions between major sections.

Examples:

scanner → CBOM: scanning lines transform into data nodes

CBOM → Mosca: artifact data visually condenses into risk signal

Mosca → NIST: threat graph transitions into migration roadmap

roadmap → export: roadmap nodes connect toward report generation

These transitions should be subtle.

The website should feel like one continuous system.

==================================================
25. MICRO-INTERACTIONS

Add high-quality micro-interactions:

Buttons:

hover glow

slight lift

active press state

Cards:

slight elevation on hover

border glow

subtle gradient movement

Tabs:

animated active pill/indicator

Table rows:

hover highlight

smooth expansion

Charts:

hover state

tooltip animation

Status indicators:

subtle pulse

Upload area:

drag-over glow

Scanner:

animated scanning line

No cheesy excessive animation.

==================================================
26. RESPONSIVE DESIGN

Desktop should be the strongest experience because this is primarily a technical dashboard/demo.

Still make it fully responsive.

Desktop:

wide multi-column layouts

Tablet:

controlled collapse

Mobile:

one-column layouts

scanner first

charts stacked

table becomes card/list view

navigation becomes compact

The sticky compact header must remain usable on mobile.

==================================================
27. FRONTEND TECHNOLOGY

Prefer:

React
TypeScript
Tailwind CSS
Framer Motion / Motion
Recharts or another strong React visualization library

Use reusable components.

Suggested component structure:

AppShell
Hero
ScannerConsole
SystemStatus
CBOMOverview
MetricTile
ArtifactTable
ArtifactDrawer
RiskDonut
AlgorithmChart
MoscaSimulator
MoscaGauge
ThreatTimeline
PQCRoadmap
PQCStandardCard
MigrationPath
ExportPanel
StickyCommandBar

Do not put everything into one huge component.

==================================================
28. API INTEGRATION

Respect and connect to the existing API architecture.

Existing backend functionality includes:

GET /api/v1/scan
POST /api/v1/scan-upload
POST /api/v1/mosca
GET /api/v1/pqc-standards
GET /api/v1/recommendation?algo=...

Use a centralized API service layer.

Do not scatter fetch calls across components.

Create loading, error, and empty states.

The frontend must gracefully handle:

backend unavailable

invalid repository

failed upload

scan in progress

empty results

API error

==================================================
29. MOCK DATA / DEMO MODE

For hackathon presentation reliability, include a demo mode.

The demo mode should use realistic sample cryptographic findings based on the repository’s existing sample projects.

Do not use random nonsense data.

Make it possible to run the frontend even when the backend is not running.

Clearly distinguish demo/mock mode internally without making the UI look fake.

==================================================
30. VISUAL QUALITY BAR

This is the most important design instruction:

DO NOT BUILD A GENERIC DASHBOARD.

Avoid:

generic purple SaaS gradients

plain cards everywhere

huge blank spaces

boring standard tables

default chart styling

static dashboard appearance

excessive rounded rectangles

stock illustrations

cartoon cybersecurity graphics

cliché hacker imagery

matrix rain

skulls

padlocks everywhere

meaningless neon

Instead, create:

sophisticated cyber command-center aesthetics

dark technical surfaces

intelligent information hierarchy

subtle motion

animated data visualization

precision typography

glowing status signals

strong transitions

cinematic scrolling

professional enterprise cybersecurity feel

It should look like a product that could be presented to:

cybersecurity engineers

enterprise security teams

technical judges

government / infrastructure stakeholders

==================================================
31. MOST IMPORTANT ANIMATION REQUIREMENTS

Implement these explicitly:

A. Hero branding:
large → shrinks during scroll → becomes sticky compact header.

B. Scanner:
idle → scanning animation → completion state.

C. Metric counters:
0 → final values on reveal.

D. Risk donut:
segments animate into place rather than appearing instantly.

E. Algorithm chart:
bars grow from 0.

F. Mosca:
all values begin from 0 and animate to their final state when the section/tab opens.

G. Mosca gauge:
0 → final threat ratio.

H. Mosca timeline:
positions animate to their calculated locations.

I. NIST roadmap:
nodes and connecting lines reveal progressively.

J. Migration paths:
connections draw progressively.

K. Export buttons:
processing → ready animation.

==================================================
32. PERFORMANCE

Animations must remain smooth.

Avoid:

unnecessary re-renders

massive DOM effects

constantly running expensive canvas calculations

excessive blur filters

Use CSS transforms where possible.

Animations should target:
transform
opacity
scale
width
stroke-dashoffset where appropriate

==================================================
33. ACCESSIBILITY

Ensure:

sufficient text contrast

keyboard navigation

visible focus states

accessible buttons

accessible tab controls

charts have textual labels/tooltips

reduced-motion support

==================================================
34. FINAL EXPERIENCE

When a user opens the website, the first impression should be:

“This is a serious quantum-security analysis platform.”

Not:

“This is a student dashboard.”

The user should immediately see:

CBOM Sentinel branding

what the system does

an interactive code scanner at the LEFT

live security-system indicators

a sense of depth and motion

As they scroll:
the branding transforms into the compact command bar,
the code scan evolves into CBOM intelligence,
the CBOM intelligence evolves into quantum risk,
and the quantum risk evolves into an actionable NIST migration roadmap.

The entire application should feel like a single interactive security narrative, not a collection of dashboard widgets.

Before finishing, ensure:

no section feels visually unfinished

no chart looks like a default library chart

no large table feels like raw database output

no animation blocks usability

all existing backend capabilities remain usable

desktop presentation quality is excellent

the design is cohesive from first viewport to final export section

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://quantum-guard-view.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b495770b-2af6-477a-b8c3-7bca471f07e5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
