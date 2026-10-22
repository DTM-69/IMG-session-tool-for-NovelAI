#!/usr/bin/env python3
"""Build release/セッション管理ツール_for_NovelAI_v<version>.zip from extension/, ledger/session-ledger.html and release/README.md."""
import json, pathlib, shutil, subprocess
root = pathlib.Path(__file__).resolve().parent.parent
ver = json.load(open(root / "extension/manifest.json", encoding="utf-8"))["version"]
name = f"session-manager-for-NovelAI_v{ver}"
stage = root / "release" / "stage" / name
shutil.rmtree(stage.parent, ignore_errors=True)
(stage / "extension").mkdir(parents=True); (stage / "ledger").mkdir()
for f in ["manifest.json", "core.js", "viewer.js", "content.js"]:
    shutil.copy2(root / "extension" / f, stage / "extension" / f)
shutil.copy2(root / "ledger/session-ledger.html", stage / "ledger/session-ledger.html")
shutil.copy2(root / "release/README.md", stage / "README.md")
out = root / "release" / f"{name}.zip"
out.unlink(missing_ok=True)
subprocess.run(["zip", "-qr", "-X", str(out), name, "-x", "*.DS_Store"], cwd=stage.parent, check=True)
shutil.rmtree(stage.parent)
print(out)
