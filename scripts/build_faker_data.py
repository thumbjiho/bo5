"""Join db/faker_bo5.csv (one row per series) with
db/faker_matches_leaguepedia.csv (one row per game Faker played) into
src/data/faker.json, keeping only the fields the app shows.

Run from the project root:  python3 scripts/build_faker_data.py
"""
import csv
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SERIES = ROOT / "db" / "faker_bo5.csv"
GAMES = ROOT / "db" / "faker_matches_leaguepedia.csv"
OUT = ROOT / "src" / "data" / "faker.json"


def read(p):
    with open(p, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def day(s):
    return dt.date.fromisoformat(s[:10])


def num(s):
    try:
        return int(float(s))
    except (TypeError, ValueError):
        return None


games = read(GAMES)
out = []
skipped = []
for s in read(SERIES):
    seq = s["faker_seq"]
    total = sum(int(n) for n in s["score"].split("-"))
    # Faker was subbed in/out: his W/L run isn't the series' shape
    if len(seq) != total:
        skipped.append(f'{s["date"]} {s["opponent"]}')
        continue
    d = day(s["date"])
    match = []
    # the series date is KST for most rows and UTC for a few; try both
    for field in ("date_kst", "datetime_utc"):
        g = sorted(
            (x for x in games if x["opponent"] == s["opponent"] and day(x[field]) == d),
            key=lambda x: x["datetime_utc"],
        )
        if "".join("W" if x["result"] == "Victory" else "L" for x in g) == seq:
            match = g
            break
    if not match:
        raise SystemExit(f'no per-game rows for {s["date"]} {s["opponent"]}')
    out.append({
        "date": s["date"],
        "tournament": s["tournament"],
        "round": s["round"],
        "team": s["team"],
        "opponent": s["opponent"],
        "score": s["score"],
        "key": seq.replace("W", "a").replace("L", "b"),
        "games": [{
            "win": g["result"] == "Victory",
            "side": g["side"],
            "champion": g["champion"],
            "duration": g["duration"],
            "k": num(g["kills"]), "d": num(g["deaths"]), "a": num(g["assists"]),
            "cs": num(g["cs"]),
            "gold": num(g["gold"]),
            "damage": num(g["damage"]),
            "teamKills": num(g["team_kills"]),
            "patch": g["patch"] or None,
            "keystone": g["keystone"] or None,
            "items": [i for i in g["items"].split(";") if i],
        } for g in match],
    })

OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(out)} series -> {OUT.relative_to(ROOT)} (skipped {len(skipped)}: {', '.join(skipped)})")
