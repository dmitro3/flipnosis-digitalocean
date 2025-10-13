Goal
Integrate the Test Tubes flip experience into your existing server-authoritative architecture, where the outcome is determined when the coin “stops,” securely and fairly.
Core Principles
Server-authoritative: Server decides outcomes; client only animates.
CSPRNG + commit–reveal: Prevents server bias and proves randomness integrity.
Deterministic client visuals: Client animates to the server’s signed outcome.
Bounded skill feel: Power/material affect duration/feel, not guaranteed results.
High-level Flow
Client requests flip start with inputs (choice, coin, material, power).
Server creates flip session:
Generates CSPRNG seed and sends commitHash = hash(seed) to client.
Optionally returns animation parameters (duration, base speed) for consistent UX.
Client animates the coin.
At “stop” time (end of animation), client requests outcome.
Server computes outcome using:
Player inputs + a server-only perturbation derived from seed.
Either a micro-physics step or a simple stop-orientation resolver.
Server finalizes outcome, reveals seed, signs the result, and returns it.
Client verifies hash(seed) == commitHash, snaps animation if needed, and displays result.
Server Responsibilities
Session create
Input validation: power caps, rate limits, allowed coin/material IDs.
Generate seed = crypto.randomBytes(32), commitHash = H(seed).
Persist flip session with inputs, seed (secret), commit, timestamps, and status=“in_progress”.
Outcome resolve
Use seed to derive small, unbiased perturbations (e.g., ±0.5% to initial angular velocity).
Determine result when simulated angular velocity < threshold or via resolver logic.
Mark session final, sign response, and reveal seed.
Integrity & audit
Sign all outcomes (Ed25519 or secp256k1) with server key.
Store immutable log: inputs, commit, seed, result, signature, latency, IP.
Anti-cheat
Ignore client-proposed orientations; treat client timing as a hint only.
Enforce time windows (min/max flip durations) and debounce “stop” requests.
Per-IP/account rate-limits; anomaly detection (too-perfect win streaks).
Client Responsibilities
Before flip
Send choice/coin/material/power; receive flipId, commitHash, animation params.
During animation
Animate deterministically from inputs and the server-sent params.
Track nominal stop time (based on duration).
At stop
Call resolve endpoint with flipId.
On response: verify hash(seed), check signature, then show result.
If visual drift: gently ease rotation to the final face over ~200–400ms.
Outcome Determination Options
Option A: Server micro-physics
Reuse a lightweight rotational model (no full 3D physics needed).
Inputs: material coefficients, power → initial angular velocity.
Add tiny server-side noise from seed.
Integrate until under threshold, quantize to heads/tails by final angle.
Option B: Resolver without simulation
Compute target duration and total rotations from inputs.
Use seed to jitter total rotations by ±ε turns.
If within tolerance of heads/tails at stop, choose that; break ties with CSPRNG.
Both preserve the “decide-at-stop” feel while preventing prediction/exploitation.
API Sketch
POST /flip/start
Body: { userId, gameId, choice, coinId, materialId, power }
Response: { flipId, commitHash, anim: { durationMs, baseSpeed, materialSpeedMult } }
POST /flip/resolve
Body: { flipId } (server uses stored inputs + seed)
Response: { result: 'heads'|'tails', seed, signature, audit: { decidedAt, durationMs } }
GET /flip/verify/:flipId
Response: { commitHash, result, seed, signature } (for replays/audits)
Data Model (minimal)
FlipSession: flipId, userId, gameId, choice, coinId, materialId, power, commitHash, seed (encrypted), status, result, signature, createdAt, resolvedAt, metadata.
Security & Fairness
CSPRNG: Use crypto.randomBytes (Node) for seeds.
Commit–reveal: Proves no post-hoc server manipulation.
Unpredictable but unbiased: Noise is tiny and symmetric; EV remains 50/50.
Bounded skill: Power/material affects animation profile/duration, not certainty.
Rollout Plan
Phase 1: Implement server endpoints + commit–reveal; client animates to server outcome at stop.
Phase 2: Add resolver logic (start with Option B), then iterate to micro-physics (Option A) if desired.
Phase 3: Add signatures, audit logs, dashboards.
Phase 4: A/B test noise magnitude and tolerance windows to balance “skill feel” vs. fairness.
Acceptance Criteria
Outcomes cannot be forced by client (tampering with JS, time dilation, or devtools).
Each outcome verifiable: hash(seed) == commitHash and signature valid.
EV ~50/50 across large sample regardless of coin/material/power.
Latency: resolve < 100ms p95; visual snap < 400ms when needed.
No elevated win rates from repeated timing/power/material exploitation beyond variance.
If you want, I can turn this into a concrete task list for your repo (endpoints, schema, client hooks) when you’re ready to integrate.