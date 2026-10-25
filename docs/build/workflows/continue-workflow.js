export const meta = {
  name: 'milo-section-continue',
  description: 'Finish an interrupted section build in its existing worktree, review it from two angles, fix, commit',
  phases: [
    { title: 'Build', detail: 'continue the interrupted builder (skipped when already committed)' },
    { title: 'Review', detail: 'brief-compliance reviewer and regression reviewer' },
    { title: 'Fix', detail: 'apply confirmed findings in the same worktree' },
  ],
}

// args: { name, brief, port, wave, worktree, skipBuild? }
const B = '/home/user/milovancroton/docs/build'  // adjust if the repo is cloned elsewhere
const CHECK = '/home/user/milovancroton/docs/build/tools/check-all.sh'
const { name, brief, port, wave, worktree, skipBuild } = args
const branch = `${wave}-${name}`

const BUILT = {
  type: 'object',
  properties: {
    worktree: { type: 'string' }, branch: { type: 'string' }, commit: { type: 'string' },
    done: { type: 'array', items: { type: 'string' }, description: 'review item numbers done, each with one line on how' },
    skipped: { type: 'array', items: { type: 'string' }, description: 'items not done, with why' },
    outside: { type: 'array', items: { type: 'string' }, description: 'edits made outside your region' },
    checks: { type: 'string', description: 'check-all.sh summary lines' },
  },
  required: ['worktree', 'branch', 'commit', 'done', 'skipped', 'outside', 'checks'],
}
const FINDINGS = {
  type: 'object',
  properties: { findings: { type: 'array', items: { type: 'object', properties: {
    title: { type: 'string' }, severity: { type: 'string', enum: ['blocker', 'major', 'minor'] },
    where: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' },
  }, required: ['title', 'severity', 'where', 'problem', 'fix'] } } },
  required: ['findings'],
}
const NOTE = `The machine is shared with other builders running browser tests, so a suite can be slow; if a browser suite times out or fails in a way that looks random, re-run that suite alone before investigating. Commit your progress on ${branch} at sensible checkpoints (even with tests not yet green, with a "work in progress" message), so an interruption never loses work; the final commit must pass every check.`

phase('Build')
let built
if (skipBuild) {
  built = { worktree, branch, commit: 'HEAD', done: ['see git log'], skipped: [], outside: [], checks: 'already passing per builder' }
} else {
  built = await agent(`You are continuing the ${wave} ${name} build for Milo van Croton. An earlier builder was cut off by a usage limit partway through; its uncommitted changes are still in the git worktree ${worktree} (branch ${branch}). cd there and work only in that worktree (do not create another worktree or switch branches). First commit the current state as "Work in progress: ${name}" so it is safe, then read ${B}/PLAN.md, ${B}/API.md and your brief ${B}/${brief} and the review items it names in docs/build/review.md. Read the existing diff (git diff against the parent of that commit) to see what is already done, check it is correct, and complete everything else in the brief, inside your region. Test with ${CHECK} ${worktree} ${port}. ${NOTE} Finish with a commit on ${branch} when every check passes (node tools/update-integrity.cjs first). Report in the schema.`, { label: `build:${name}`, phase: 'Build', schema: BUILT })
  if (!built) return { name, error: 'builder returned nothing' }
}

phase('Review')
const ctx = `The ${name} builder worked in the git worktree ${built.worktree} on branch ${built.branch}. Its work is every commit on that branch after 5dc6f88 (or after 40d5ebb if that is its base): use git -C ${built.worktree} log and diff to see it. Read ${B}/PLAN.md, ${B}/API.md and ${B}/${brief}. Do not edit files in the worktree; scratch goes in /tmp/milo-build/review-${name}-<lens>/ (never inside the repo). ${NOTE.split(' Commit')[0]} Report only real problems, each with evidence (file:line, a reproduction, or a quoted hunk). Blocker = breaks saved data, crashes, unsafe, or clearly wrong training numbers; major = a brief item missing or wrong in a real case; minor = small. Builder's report: ${JSON.stringify(built)}`
const lenses = [
  { key: 'brief', text: `Lens: did the builder do every item in the brief, correctly and as the review intended? Check each item against the code and run the logic in Node where it computes training numbers. Check any new research claims or citations with WebSearch. Check the on-screen text is short and plain.` },
  { key: 'regress', text: `Lens: regressions. Run ${CHECK} ${built.worktree} ${port + 2}. Then serve the worktree (python3 -m http.server ${port + 3} --bind 127.0.0.1, stop it after) and drive the app in Chromium at 390x844 with touch (require('playwright'); chromium.launch() with no options): load it with a saved state made by the original app (check out bd25f38 into a scratch folder with git worktree add, serve it on port ${port + 5}, set up Together with all three sections and log a few sessions there, read its localStorage with page.evaluate, write the same keys into the new app's origin, and remove the scratch worktree afterwards), then use every screen the builder touched, start and finish a session, and check nothing errors in the console and old data still shows. Look for broken flows in other sections caused by this change.` },
]
const reviews = await parallel(lenses.map(l => () => agent(`${ctx}\n\n${l.text}`, { label: `review:${name}:${l.key}`, phase: 'Review', schema: FINDINGS })))
const findings = reviews.filter(Boolean).flatMap(r => r.findings)
const reviewed = reviews.filter(Boolean).length
log(`${name}: ${reviewed}/2 reviews, ${findings.length} findings (${findings.filter(f => f.severity !== 'minor').length} blocker or major)`)

phase('Fix')
let fixed = null
if (findings.length) {
  fixed = await agent(`You are fixing review findings for the ${wave} ${name} work on Milo van Croton. Work in the existing git worktree ${built.worktree} on branch ${built.branch} (cd there; do not create a new worktree or switch branches). Read ${B}/PLAN.md, ${B}/API.md and ${B}/${brief}. Check each finding yourself; fix every real blocker and major, and the cheap minors; say why for any you reject. Run node tools/update-integrity.cjs and ${CHECK} ${built.worktree} ${port + 4}; everything must pass. ${NOTE} Commit on ${built.branch}. Report each finding as fixed / rejected (why), the new commit hash, and the check-all summary.\n\nFindings:\n${JSON.stringify(findings, null, 1)}`, { label: `fix:${name}`, phase: 'Fix' })
}
return { name, built, reviewed, findings, fixed }
