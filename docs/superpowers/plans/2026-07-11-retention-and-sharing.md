# Retention and Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect spirit hatching, the free daily fortune, first care, streak rewards, daily missions, and a privacy-safe fortune share card into one understandable loop.

**Architecture:** Keep progression in the existing `SpiritProgress` and streak stores. Add small pure selectors for next-action and next-milestone copy, consume them from `AppShell`, and extend the existing canvas share-card API rather than introducing a second renderer.

**Tech Stack:** React 18, TypeScript, Apps in Toss Web Framework, Canvas API, localStorage, Playwright browser verification.

## Global Constraints

- Today's fortune and spirit hatching, care, and growth remain free.
- Existing rewarded-ad gates for detailed fortune routes remain unchanged.
- Ads remain optional growth bonuses and are not required for basic spirit growth.
- Do not add payment, server, analytics, or third-party dependencies.
- Do not include birth date, birth time, gender, or profile identifiers in share images.
- Preserve existing users' progress and localStorage keys.

---

### Task 1: Pure Retention Selectors

**Files:**
- Modify: `src/lib/spirit-economy.ts`
- Create: `scripts/verify-retention-selectors.ts`

**Interfaces:**
- Produces: `nextStreakMilestone(streak: number): { day: number; daysLeft: number; reward: number } | null`
- Produces: `nextCareAction(actions: DayActions): ActionKind | null`

- [ ] **Step 1: Write the failing verification script**

Create assertions that `nextStreakMilestone(1)` returns day 3 with two days left, `nextStreakMilestone(30)` returns `null`, and `nextCareAction` returns the first incomplete action in feed, pet, meditate order.

- [ ] **Step 2: Run the script and verify failure**

Run: `npx tsx scripts/verify-retention-selectors.ts`

Expected: FAIL because the two selector exports do not exist.

- [ ] **Step 3: Implement the selectors**

Add the following behavior to `spirit-economy.ts`:

```ts
export function nextStreakMilestone(streak: number) {
  const day = STREAK_MILESTONES.find((milestone) => milestone > streak);
  return day ? { day, daysLeft: day - streak, reward: STREAK_REWARD } : null;
}

export function nextCareAction(actions: DayActions): ActionKind | null {
  return (Object.keys(ACTION_GAIN) as ActionKind[]).find((kind) => !actions[kind]) ?? null;
}
```

- [ ] **Step 4: Run verification**

Run: `npx tsx scripts/verify-retention-selectors.ts`

Expected: `retention selectors: ok` and exit code 0.

- [ ] **Step 5: Commit**

Commit only `src/lib/spirit-economy.ts` and `scripts/verify-retention-selectors.ts` with a Lore-format message describing why deterministic selectors were introduced.

### Task 2: First-Day Fortune-to-Care Handoff

**Files:**
- Modify: `src/screens/AppShell.tsx` in `ScreenToday` and `ScreenPetHome`

**Interfaces:**
- Consumes: `nextCareAction(actions: DayActions): ActionKind | null`
- Preserves: `go('home')`, `claimBonus(spirit.key, 'fortune')`, and all rewarded-route behavior.

- [ ] **Step 1: Capture the pre-change browser state**

Use a fresh localStorage profile, finish hatching, open today's fortune, and confirm there is no explicit CTA from the bottom of the fortune back to care.

- [ ] **Step 2: Add the handoff CTA**

At the bottom of `ScreenToday`, before the monthly-fortune teaser, add a full-width command button labeled `정령에게 오늘 기운 전하기`. It calls `go('home')`; it must not show an ad or alter the existing fortune bonus.

- [ ] **Step 3: Emphasize the next free care action**

In `ScreenPetHome`, derive `nextCareAction(tgtProg.actions)`. When fortune has been checked and at least one care action remains, show `운세를 들었으니 {spirit.name}에게 {action label} 해주세요` immediately above the care buttons and visually emphasize only that corresponding button.

- [ ] **Step 4: Verify the first-day flow**

In a 390x844 browser viewport, verify `hatch -> free today fortune -> handoff CTA -> home -> highlighted care -> bond gain`. Confirm no rewarded-ad gate appears on today's fortune.

- [ ] **Step 5: Commit**

Commit only the first-day handoff changes with a Lore-format message and record the browser scenario under `Tested:`.

### Task 3: Streak Forecast and Mission Navigation

**Files:**
- Modify: `src/screens/AppShell.tsx` in `ScreenPetHome`

**Interfaces:**
- Consumes: `nextStreakMilestone(streak.streak)`
- Preserves: `ieum-saju.streak.v1`, `ieum-saju.mission.v1`, `MISSION_REWARD`, and existing mission completion conditions.

- [ ] **Step 1: Add the streak forecast**

Replace the header's streak-only badge with a compact badge/card that shows the current streak and, when present, `N일 뒤 +20`. At streak 30 or above, show `최고 기록 진행 중` instead of inventing another reward.

- [ ] **Step 2: Add deterministic mission destinations**

Extend each local mission entry with an action: care scrolls to `anchorRef`, today's fortune calls `go('today')`, and spirit catch calls `go('today')`. Render a small arrow command only for incomplete missions.

- [ ] **Step 3: Keep rewards unchanged**

Confirm the card still awards exactly `MISSION_REWARD` once per day and does not grant bond for navigation or sharing.

- [ ] **Step 4: Verify rollover-shaped states**

Using browser localStorage fixtures, check streak values 1, 2, 7, and 30. Verify mission links navigate correctly and completed rows no longer show action arrows.

- [ ] **Step 5: Commit**

Commit the streak forecast and mission navigation as one independently reviewable UI change.

### Task 4: Daily Fortune Share Card

**Files:**
- Modify: `src/lib/spirit-card.ts`
- Modify: `src/screens/AppShell.tsx` in `ScreenToday`
- Create: `scripts/verify-spirit-card-privacy.mjs`

**Interfaces:**
- Modify: `shareSpiritCard(spirit: Spirit, stage: Stage, oneLine?: string, context?: 'spirit' | 'fortune'): Promise<ShareResult>`
- The optional fourth argument defaults to `'spirit'` so the home call remains source-compatible.

- [ ] **Step 1: Add a privacy verification script**

The script reads `src/lib/spirit-card.ts` and fails if card drawing or share text references profile birth date, birth time, gender, `myeongsik`, or profile ID fields. It succeeds with `spirit card privacy: ok`.

- [ ] **Step 2: Extend the existing renderer**

For `context === 'fortune'`, render `오늘의 운세` as the card eyebrow and make the one-line fortune the primary lower caption. Keep spirit image, name, rarity, and brand. Do not add user profile fields.

- [ ] **Step 3: Add the share CTA to today's fortune**

Add `오늘 운세 카드 공유` near the bottom of `ScreenToday`. Call `shareSpiritCard(spirit, stage, fortune.oneLine, 'fortune')`. Treat native share cancellation as silent; show a notice only for downloaded fallback or generation failure, consistent with the existing home action.

- [ ] **Step 4: Verify image output and privacy**

Run `node scripts/verify-spirit-card-privacy.mjs`. In the browser, trigger the fallback and inspect the generated 720x960 PNG for readable text, transparent-background spirit rendering, no overlap, and no personal birth information.

- [ ] **Step 5: Commit**

Commit the renderer, CTA, and privacy script with a Lore-format message.

### Task 5: Regression and Release Verification

**Files:**
- Modify only files required to fix failures found by this task.

**Interfaces:**
- Verifies all outputs from Tasks 1-4.

- [ ] **Step 1: Run static checks**

Run:

```bash
npx tsx scripts/verify-retention-selectors.ts
node scripts/verify-spirit-card-privacy.mjs
yarn lint
yarn build
git diff --check
```

Expected: selector and privacy scripts pass, lint has zero errors, AIT build succeeds, and diff check is clean.

- [ ] **Step 2: Run mobile browser regression**

Verify at 390x844: existing-user home, new-user hatch, free daily fortune, first care handoff, streak forecast, all three mission links, share CTA, and a detailed fortune route's existing rewarded-ad gate.

- [ ] **Step 3: Check unrelated worktree changes**

Run `git status --short` and ensure `.pw-browsers/` plus pre-existing scratch scripts remain unmodified and uncommitted.

- [ ] **Step 4: Commit verification fixes if any**

If verification required code changes, commit only those files with the exact checks recorded in `Tested:`. If no fixes were needed, do not create an empty commit.
