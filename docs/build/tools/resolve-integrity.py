#!/usr/bin/env python3
"""Resolve merge conflicts that are only in generated integrity lines (script hashes, CSP hashes, cache name).

Usage: resolve-integrity.py <repo>. For index.html, sw.js and _headers, a conflict hunk whose lines on both sides
are all generated integrity lines is resolved by keeping our side; node tools/update-integrity.cjs then rewrites
them from the merged files. Any other hunk is left for a person, and the script exits 1.
"""
import re, sys, pathlib, subprocess

GEN = re.compile(r"Content-Security-Policy|integrity=\"sha256-|const CACHE = PREFIX|\?v=[0-9a-f]+")
repo = pathlib.Path(sys.argv[1])
left = []
for name in ["index.html", "sw.js", "_headers"]:
    p = repo / name
    text = p.read_text()
    if "<<<<<<< " not in text:
        continue
    out, i, lines = [], 0, text.split("\n")
    while i < len(lines):
        if lines[i].startswith("<<<<<<< "):
            j = lines.index("=======", i)
            k = next(n for n in range(j, len(lines)) if lines[n].startswith(">>>>>>> "))
            ours, theirs = lines[i + 1:j], lines[j + 1:k]
            if all(GEN.search(l) for l in ours + theirs if l.strip()):
                out.extend(ours)
            else:
                out.extend(lines[i:k + 1]); left.append(f"{name}:{i + 1}")
            i = k + 1
        else:
            out.append(lines[i]); i += 1
    p.write_text("\n".join(out))
if left:
    print("conflicts that are not integrity-only, resolve by hand:", ", ".join(left)); sys.exit(1)
subprocess.run(["node", "tools/update-integrity.cjs"], cwd=repo, check=True)
for name in ["index.html", "sw.js", "_headers"]:
    subprocess.run(["git", "add", name], cwd=repo, check=True)
print("integrity-only conflicts resolved and regenerated")
