export const meta = {
  name: 'milo-section-build',
  description: 'Build one section of the Milo changes in its own worktree, review it from two angles, fix, commit',
  phases: [
    { title: 'Build', detail: 'one builder in a fresh worktree' },
    { title: 'Review', detail: 'brief-compliance reviewer and regression reviewer' },
    { title: 'Fix', detail: 'apply confirmed findings in the same worktree' },
  ],
}

// args: { name: 'muscle', brief: 'wave1-muscle.md', port: 8170, wave: 'wave1' }
const B = '/home/user/milovancroton/docs/build'  // adjust if the repo is cloned elsewhere
const CHECK = '/home/user/milovancroton/docs/build/tools/check-all.sh'
const { name, brief, port, wave } = args
const branch = `${wave}-${name}`

const BUILT = {
  type: 'object',
  properties: {
    worktree: { type: 'string', description: 'absolute path of your worktree (output of pwd)' },
    branch: { type: 'string' }, commit: { type: 'string' },
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
const NOTE = `The machine is shared with other builders running browser tests, so a suite can be slow; if a browser suite times out or fails in a way that looks random, re-run that suite alone before investigating. Commit your progress on ${branch} at sensible checkpoints (even with tests not yet green, with a "Work in progress" message), so an interruption never loses work; the final commit must pass every check.`

phase('Build')
const built = await agent(`You are the ${wave} ${name} builder for Milo van Croton. You are in your own fresh git worktree of /home/user/milovancroton; run pwd to get its path and git checkout -b ${branch} first. Read ${B}/PLAN.md, ${B}/API.md (the shared engine from wave 0, already in your checkout) and your brief ${B}/${brief}, then the review items it names in docs/build/review.md. Implement everything in your brief, inside your region. Test with ${CHECK} <your worktree path> ${port}. ${NOTE} Commit on ${branch} when every check passes (node tools/update-integrity.cjs first). Report in the schema.`, { label: `build:${name}`, phase: 'Build', isolation: 'worktree', schema: BUILT })
if (!built) return { name, error: 'builder returned nothing' }

phase('Review')
const ctx = `The ${name} builder worked in the git worktree ${built.worktree} on branch ${built.branch} (commit ${built.commit}). Compare with git -C ${built.worktree} diff HEAD~1..HEAD (or against the wave-0 commit, the parent of the builder's first commit). Read ${B}/PLAN.md, ${B}/API.md and ${B}/${brief}. Do not edit files in the worktree; scratch goes in /tmp/milo-build/review-${name}-<lens>/ (never inside the repo). ${NOTE} Report only real problems, each with evidence (file:line, a reproduction, or a quoted hunk). Blocker = breaks saved data, crashes, unsafe, or clearly wrong training numbers; major = a brief item missing or wrong in a real case; minor = small. Builder's report: ${JSON.stringify(built)}`
const lenses = [
  { key: 'brief', port: port + 1, text: `Lens: did the builder do every item in the brief, correctly and as the review intended? Check each item against the code and run the logic in Node where it computes training numbers. Check any new research claims or citations with WebSearch. Check the on-screen text is short and plain.` },
  { key: 'regress', port: port + 2, text: `Lens: regressions. Run ${CHECK} ${built.worktree} ${port + 2}. Then serve the worktree (python3 -m http.server ${port + 3} --bind 127.0.0.1, stop it after) and drive the app in Chromium at 390x844 with touch (require('playwright'); chromium.launch() with no options): load it with a saved state made by the original app (check out bd25f38 into a scratch folder with git worktree add, serve it on port ${port + 5}, set up Together with all three sections and log a few sessions there, read its localStorage with page.evaluate, write the same keys into the new app's origin, and remove the scratch worktree afterwards), then use every screen the builder touched, start and finish a session, and check nothing errors in the console and old data still shows. Look for broken flows in other sections caused by this change.` },
]
const reviews = await parallel(lenses.map(l => () => agent(`${ctx}\n\n${l.text}`, { label: `review:${name}:${l.key}`, phase: 'Review', schema: FINDINGS })))
const findings = reviews.filter(Boolean).flatMap(r => r.findings)
log(`${name}: ${findings.length} findings (${findings.filter(f => f.severity !== 'minor').length} blocker or major)`)

phase('Fix')
let fixed = null
if (findings.length) {
  fixed = await agent(`You are fixing review findings for the ${wave} ${name} work on Milo van Croton. Work in the existing git worktree ${built.worktree} on branch ${built.branch} (cd there; do not create a new worktree or switch branches). Read ${B}/PLAN.md, ${B}/API.md and ${B}/${brief}. Check each finding yourself; fix every real blocker and major, and the cheap minors; say why for any you reject. Run node tools/update-integrity.cjs and ${CHECK} ${built.worktree} ${port + 4}; everything must pass. ${NOTE} Commit on ${built.branch}. Report each finding as fixed / rejected (why), the new commit hash, and the check-all summary.\n\nFindings:\n${JSON.stringify(findings, null, 1)}`, { label: `fix:${name}`, phase: 'Fix' })
}
return { name, built, findings, fixed }
