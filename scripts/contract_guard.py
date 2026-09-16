#!/usr/bin/env python3
"""Local contract guard. No dependencies, network access, or semantic approval."""
import argparse
import json
import pathlib
import re
import subprocess
import sys


def git(*args, check=True):
    result = subprocess.run(["git", *args], capture_output=True, text=True)
    if check and result.returncode:
        raise ValueError(result.stderr.strip() or "git command failed")
    return result


def read_at(path, target):
    if target == "worktree":
        return pathlib.Path(path).read_text()
    return git("show", (":" if target == "index" else target + ":") + path).stdout


def ancestor(older, newer):
    return git("merge-base", "--is-ancestor", older, newer, check=False).returncode == 0


def policy():
    # Use the committed policy: editing a working/index policy must not disable checks.
    return json.loads(git("show", "HEAD:.harness/policy.json").stdout)


def baseline(target, config):
    record = json.loads(read_at(config["baseline_file"], target))
    sha = record.get("commit", "")
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ValueError("Baseline must be a full commit SHA")
    if not record.get("review_reference", "").strip():
        raise ValueError("A handoff/review reference is required; it is not semantic approval")
    if not ancestor(sha, config["planning_branch"]):
        raise ValueError("Baseline is not in local planning branch history; fetch/update plan first")
    tips = ["HEAD"] if target in ("index", "worktree") else [target]
    if target in ("index", "worktree"):
        merge = git("rev-parse", "--verify", "MERGE_HEAD", check=False)
        if merge.returncode == 0:
            tips.append(merge.stdout.strip())
    if not any(ancestor(sha, tip) for tip in tips):
        raise ValueError("Merge the selected plan commit into dev before adopting it")
    return sha


def check_contracts(target, config):
    sha = baseline(target, config)
    args = ["diff", "--name-only", "-z"]
    if target == "index":
        args += ["--cached", sha]
    elif target == "worktree":
        args += [sha]
    else:
        args += [sha, target]
    paths = config["protected_paths"]
    changed = git(*args, "--", *paths).stdout.split("\0")
    if target == "worktree":
        changed += git("ls-files", "--others", "--exclude-standard", "-z", "--", *paths).stdout.split("\0")
    changed = sorted(set(filter(None, changed)))
    if changed:
        raise ValueError("Protected files differ from adopted plan " + sha[:12] + ":\n  " + "\n  ".join(changed))
    print("PASS: contracts match adopted plan " + sha[:12])


def install():
    desired = ".githooks"
    current = git("config", "--get", "core.hooksPath", check=False).stdout.strip()
    if current and current != desired:
        raise ValueError("Existing core.hooksPath must be integrated explicitly: " + current)
    hooks = pathlib.Path(git("rev-parse", "--git-path", "hooks").stdout.strip())
    if not current and hooks.exists():
        active = [p.name for p in hooks.iterdir() if p.is_file() and not p.name.endswith(".sample")]
        if active:
            raise ValueError("Existing hooks must be integrated explicitly: " + ", ".join(active))
    git("config", "--local", "core.hooksPath", desired)
    print("Installed shared repository hooks: " + desired)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    check = sub.add_parser("check")
    check.add_argument("--target", default="worktree", help="worktree, index, or commit/ref")
    check.add_argument("--branch", help="Branch being validated (for a push ref)")
    adopt = sub.add_parser("adopt")
    adopt.add_argument("commit")
    adopt.add_argument("--review-reference", required=True)
    sub.add_parser("install")
    sub.add_parser("pre-push")
    args = parser.parse_args()
    root = git("rev-parse", "--show-toplevel").stdout.strip()
    import os
    os.chdir(root)
    if args.command == "install":
        install()
        return
    config = policy()
    branch = git("branch", "--show-current").stdout.strip()
    if args.command == "adopt":
        if branch != config["development_branch"]:
            raise ValueError("Adoption records are written only on the configured development branch")
        sha = git("rev-parse", "--verify", args.commit + "^{commit}").stdout.strip()
        path = pathlib.Path(config["baseline_file"])
        previous = path.read_bytes() if path.exists() else None
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({"commit": sha, "review_reference": args.review_reference}, indent=2) + "\n")
        try:
            check_contracts("worktree", config)
        except Exception:
            if previous is None:
                path.unlink()
            else:
                path.write_bytes(previous)
            raise
        print("Adoption recorded. Stage and commit " + str(path) + "; pending semantic decisions remain pending.")
    elif args.command == "pre-push":
        for line in sys.stdin:
            local_ref, sha, remote_ref, _ = line.split()
            if sha == "0" * 40:
                continue
            if remote_ref == "refs/heads/" + config["development_branch"]:
                check_contracts(sha, config)
    else:
        selected = args.branch or branch
        if selected == config["release_branch"] and args.target == "index":
            raise ValueError("No direct release-branch commits; promote reviewed development with a fast-forward merge")
        if selected == config["development_branch"]:
            check_contracts(args.target, config)
        elif not selected:
            raise ValueError("Detached HEAD: specify --branch for an explicit check")
        else:
            print("SKIP: development contract guard on branch " + selected)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError) as error:
        print("FAIL: " + str(error), file=sys.stderr)
        sys.exit(1)
