# -*- coding: utf-8 -*-
"""Canonical class list -> classes.json.

Every class at Nashville MMA appears EXACTLY ONCE below. Names are verbatim from
the live site (nashvillemma.com/Home/Schedule), including its own inconsistent
Gi / No-Gi / No Gi spellings. Program tags and audience are derived, never typed
by hand, so a rename can't drift between the master schedule and a program page.
"""
import json, re, os

RAW = {
"Monday": [
 ("6:00 AM","7:00 AM","Gi Brazilian Jiu-Jitsu: Intermediate"),
 ("6:00 AM","7:00 AM","Sports Performance"),
 ("7:00 AM","8:00 AM","Boxing Fundamentals"),
 ("9:00 AM","10:00 AM","Muay Thai: Fundamentals"),
 ("10:30 AM","11:30 AM","Gi Brazilian Jiu-Jitsu"),
 ("11:30 AM","12:30 PM","No-Gi Brazilian Jiu-Jitsu"),
 ("4:15 PM","5:00 PM","Kids No Gi Brazilian Jiu-Jitsu (Ages 6-10)"),
 ("5:00 PM","6:00 PM","Kids No Gi Brazilian Jiu-Jitsu (ages 9-14)"),
 ("5:30 PM","6:30 PM","Rolling Class (Gi & No Gi)"),
 ("5:30 PM","6:30 PM","MMA: Intermediate"),
 ("5:30 PM","6:30 PM","Boxing: Intermediate"),
 ("5:30 PM","6:30 PM","Boxing: Fundamentals"),
 ("6:00 PM","7:00 PM","Kids Fitness (ages 9-14)"),
 ("6:30 PM","7:30 PM","Muay Thai: Advanced"),
 ("6:30 PM","7:30 PM","No Gi Brazilian Jiu-Jitsu: Intermediate"),
 ("7:30 PM","8:30 PM","No Gi Brazilian Jiu-Jitsu: Fundamentals"),
 ("7:30 PM","8:30 PM","Muay Thai: Fundamentals"),
],
"Tuesday": [
 ("6:00 AM","7:00 AM","No-Gi Brazilian Jiu-Jitsu: Advanced"),
 ("6:00 AM","7:00 AM","Sports Performance"),
 ("7:00 AM","8:00 AM","MMA Fundamentals & Self Defense"),
 ("10:30 AM","11:30 AM","Gi Brazilian Jiu-Jitsu"),
 ("11:30 AM","12:30 PM","No-Gi Brazilian Jiu-Jitsu"),
 ("4:15 PM","5:00 PM","Kids Gi Brazilian Jiu-Jitsu (ages 6-10)"),
 ("5:00 PM","6:00 PM","Kids Gi Brazilian Jiu Jitsu (ages 9-14)"),
 ("5:30 PM","6:30 PM","No Gi Brazilian Jiu-Jitsu: Advanced"),
 ("5:30 PM","6:30 PM","MMA Fundamental & Self-Defense"),
 ("5:30 PM","6:30 PM","MMA: Intermediate"),
 ("6:00 PM","7:00 PM","Kids Fitness (ages 9-14)"),
 ("6:30 PM","7:30 PM","Gi Brazilian Jiu-Jitsu: Intermediate"),
 ("6:30 PM","7:30 PM","Muay Thai: Advanced"),
 ("6:30 PM","7:30 PM","Wrestling: All Levels"),
 ("7:30 PM","8:30 PM","Gi Brazilian Jiu-Jitsu Fundamentals"),
 ("7:30 PM","8:30 PM","Muay Thai Fundamentals"),
],
"Wednesday": [
 ("6:00 AM","7:00 AM","Gi Brazilian Jiu-Jitsu: Intermediate"),
 ("6:00 AM","7:00 AM","Sports Performance"),
 ("7:00 AM","8:00 AM","MMA Fundamentals & Self Defense"),
 ("9:00 AM","10:00 AM","Muay Thai: Fundamentals"),
 ("10:30 AM","11:30 AM","Gi Brazilian Jiu-Jitsu"),
 ("11:30 AM","12:30 PM","No-Gi Brazilian Jiu-Jitsu"),
 ("4:15 PM","5:00 PM","Kids No Gi Brazilian Jiu-Jitsu (ages 6-10)"),
 ("5:00 PM","6:00 PM","Kids No Gi Brazilian Jiu-Jitsu (ages 9-14)"),
 ("5:30 PM","6:30 PM","MMA: Intermediate"),
 ("5:30 PM","6:30 PM","No-Gi Brazilian Jiu-Jitsu Fundamentals"),
 ("5:30 PM","6:30 PM","Boxing: Intermediate"),
 ("5:30 PM","6:30 PM","Boxing: Fundamentals"),
 ("6:00 PM","7:00 PM","Kids Fitness (ages 9-14)"),
 ("6:30 PM","7:30 PM","No Gi Brazilian Jiu-Jitsu: Intermediate"),
 ("6:30 PM","7:30 PM","Member's Sparring (Invite only)"),
 ("7:30 PM","8:30 PM","No-Gi Brazilian Jiu-Jitsu: Fundamentals"),
 ("7:30 PM","8:30 PM","Muay Thai: Fundamentals"),
],
"Thursday": [
 ("6:00 AM","7:00 AM","Gi Brazilian Jiu-Jitsu: Advanced"),
 ("6:00 AM","7:00 AM","Sports Performance"),
 ("7:00 AM","8:00 AM","MMA: Intermediate"),
 ("10:30 AM","11:30 AM","Gi Brazilian Jiu-Jitsu"),
 ("11:30 AM","12:30 PM","No-Gi Brazilian Jiu-Jitsu"),
 ("4:15 PM","5:00 PM","Kids Gi Brazilian Jiu-Jitsu(ages 6-10)"),
 ("5:00 PM","6:00 PM","Kids Gi Brazilian Jiu Jitsu(ages 9-14)"),
 ("5:30 PM","6:30 PM","No-Gi Brazilian Jiu-Jitsu: Advanced"),
 ("5:30 PM","6:30 PM","MMA Fundamental & Self-Defense"),
 ("5:30 PM","6:30 PM","MMA: Intermediate"),
 ("6:00 PM","7:00 PM","Kids Fitness (ages 9-14)"),
 ("6:30 PM","7:30 PM","Gi Brazilian Jiu-Jitsu: Intermediate"),
 ("6:30 PM","7:30 PM","Muay Thai: Advanced"),
 ("6:30 PM","7:30 PM","Wrestling: All Levels"),
 ("7:30 PM","8:30 PM","No-Gi Brazilian Jiu-Jitsu: Fundamentals"),
 ("7:30 PM","8:30 PM","Muay Thai: Fundamentals"),
],
"Friday": [
 ("6:00 AM","7:00 AM","No-Gi Brazilian Jiu-Jitsu: Advanced"),
 ("6:00 AM","7:00 AM","Sports Performance"),
 ("7:00 AM","8:00 AM","Boxing Fundamentals"),
 ("9:00 AM","10:00 AM","Muay Thai: Fundamentals"),
 ("10:30 AM","11:30 AM","Gi Brazilian Jiu-Jitsu"),
 ("11:30 AM","12:30 AM","No-Gi Brazilian Jiu-Jitsu"),
 ("4:30 PM","5:30 PM","No-Gi Brazilian Jiu-Jitsu: Intermediate"),
 ("5:30 PM","6:30 PM","Wrestling: All Levels"),
 ("5:30 PM","6:30 PM","MMA: Intermediate"),
 ("6:30 PM","7:30 PM","Muay Thai: Intermediate"),
],
"Saturday": [
 ("8:30 AM","10:00 AM","Brazilian Jiu-Jitsu OPEN MAT ROLLING (All Levels)"),
 ("9:00 AM","10:00 AM","MMA: Intermediate"),
 ("9:00 AM","10:00 AM","MMA Fundamentals & Self Defense"),
 ("10:30 AM","11:30 AM","Women's Muay Thai"),
 ("10:30 AM","12:00 PM","Judo"),
 ("11:30 AM","12:30 PM","No Gi Brazilian Jiu Jitsu: Fundamentals"),
 ("11:30 AM","12:30 PM","Muay Thai: All-Levels"),
],
"Sunday": [
 ("9:00 AM","10:00 AM","Wrestling: All Levels"),
 ("10:30 AM","11:30 AM","Women's Jiu Jitsu All Levels"),
 ("11:30 AM","12:30 PM","Beginner Sparring"),
],
}

# name pattern -> program slug. A class may match several (a kids BJJ class
# belongs to both the jiu-jitsu page and the kids-martial-arts page).
PROGRAM_RULES = [
 (r"jiu[- ]?jitsu|rolling class|open mat",            "jiu-jitsu"),
 (r"\bboxing\b",                                      "boxing"),
 (r"muay thai",                                       "muay-thai"),
 (r"\bmma\b",                                         "mixed-martial-arts"),
 (r"wrestling",                                       "wrestling"),
 (r"\bjudo\b",                                        "judo"),
 (r"self[- ]?defense",                                "self-defense"),
 (r"sports performance",                              "sports-performance"),
 (r"sparring",                                        "sparring"),
 (r"^kids|kids ",                                     "kids-martial-arts"),
 (r"kids fitness",                                    "kids-fitness-classes"),
 (r"women'?s",                                        "womens-classes"),
]

def programs_for(name):
    low = name.lower()
    out = [slug for pat, slug in PROGRAM_RULES if re.search(pat, low)]
    # Kids Fitness is a fitness class, not a martial art.
    if "kids-fitness-classes" in out and "kids-martial-arts" in out:
        out.remove("kids-martial-arts")
    return out

def audience_for(name):
    low = name.lower()
    if low.startswith("kids") or "kids " in low:
        return "kids"
    if "sports performance" in low or "fitness" in low:
        return "fitness"
    return "adult"

def minutes(t):
    m = re.match(r"(\d+):(\d+) (AM|PM)", t)
    h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3)
    if ap == "PM" and h != 12: h += 12
    if ap == "AM" and h == 12: h = 0
    return h * 60 + mi

classes = []
for day, rows in RAW.items():
    for start, end, name in rows:
        classes.append({
            "day": day,
            "start": start,
            "end": end,
            "name": name,
            "programs": programs_for(name),
            "audience": audience_for(name),
            "sort": minutes(start),
        })

here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(here, "classes.json"), "w", encoding="utf-8") as f:
    json.dump({"source": "https://nashvillemma.com/Home/Schedule",
               "note": "Single source of truth. Every schedule view is generated from this file.",
               "classes": classes}, f, indent=2, ensure_ascii=False)

untagged = [c["name"] for c in classes if not c["programs"]]
print("classes:", len(classes))
print("untagged:", sorted(set(untagged)) or "none")
from collections import Counter
print("per program:", dict(Counter(p for c in classes for p in c["programs"])))
print("per audience:", dict(Counter(c["audience"] for c in classes)))
