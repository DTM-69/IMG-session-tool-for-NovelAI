#!/usr/bin/env python3
"""Inline ledger-core.js and app.js into template.html -> session-ledger.html (single offline file)."""
import pathlib
d = pathlib.Path(__file__).parent
t = (d / "template.html").read_text(encoding="utf-8")
t = t.replace("/*CORE*/", (d / "ledger-core.js").read_text(encoding="utf-8").replace("</script", "<\\/script"))
t = t.replace("/*APP*/", (d / "app.js").read_text(encoding="utf-8"))
(d / "session-ledger.html").write_text(t, encoding="utf-8")
print("wrote", d / "session-ledger.html", len(t), "bytes")
