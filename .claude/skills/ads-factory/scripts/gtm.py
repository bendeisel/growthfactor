#!/usr/bin/env python3
"""Google Tag Manager API v2, direct.

    gtm.py accounts                              GTM accounts this token sees
    gtm.py containers <account-id>               containers in an account
    gtm.py workspaces <client>                   workspaces, and which is default
    gtm.py tags       <client>                   every tag in the workspace
    gtm.py triggers   <client>                   every trigger
    gtm.py variables  <client>                   built-in and user variables
    gtm.py live       <client>                   what is actually published
    gtm.py audit      <client>                   the tags that should exist, and do not
    gtm.py add-ga4-config <client> --measurement-id G-XXXX [--confirm]
    gtm.py add-ga4-event  <client> --event generate_lead --trigger N [--confirm]
    gtm.py publish        <client> --name "..." [--confirm]

Paths taken from the v2 discovery document
(https://tagmanager.googleapis.com/$discovery/rest?version=v2). Container
paths are accounts/<a>/containers/<c>/workspaces/<w>, and the numeric
container ID is not the GTM-XXXXXXX public ID: the API wants the number.
"""

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import accounts  # noqa: E402
import gfads  # noqa: E402

BASE = "https://tagmanager.googleapis.com/tagmanager/v2"


def get(path, params=None):
    import urllib.parse
    url = "%s/%s" % (BASE, path.lstrip("/"))
    if params:
        url += "?" + urllib.parse.urlencode(params)
    return gfads.request("GET", url, headers=gfads.google_headers())


def post(path, body=None, params=None):
    import urllib.parse
    url = "%s/%s" % (BASE, path.lstrip("/"))
    if params:
        url += "?" + urllib.parse.urlencode(params)
    return gfads.request("POST", url, headers=gfads.google_headers(),
                         body=body if body is not None else {})


def container_path(args):
    """accounts/<account>/containers/<container> for a client, from the
    registry. Both halves are needed and the registry stores both."""
    if getattr(args, "container_path", None):
        return args.container_path
    slug = getattr(args, "client", None)
    if not slug:
        gfads.die("need a client slug or --container-path")
    row = accounts.find(slug)
    if not row:
        gfads.die("no client %r in the registry" % slug)
    acct = row.get("gtm_account_id", "")
    cont = row.get("gtm_container_id", "")
    if not acct or not cont:
        gfads.die("%s needs both a GTM account ID and container ID on file. "
                  "Find them with `gtm.py accounts` then "
                  "`gtm.py containers <account-id>`, and save with "
                  "`accounts.py set %s --gtm-account A --gtm-container C`."
                  % (row.get("client") or slug, slug))
    return "accounts/%s/containers/%s" % (acct, cont)


def default_workspace(cpath):
    """GTM edits happen in a workspace, never against the container. The
    'Default Workspace' is the one the UI opens, so that is the one to touch
    unless told otherwise."""
    got = get("%s/workspaces" % cpath)
    spaces = got.get("workspace") or []
    if not spaces:
        gfads.die("container %s has no workspace" % cpath, gfads.EXIT_API)
    for w in spaces:
        if w.get("name") == "Default Workspace":
            return w
    return spaces[0]


def workspace_path(args):
    cpath = container_path(args)
    if getattr(args, "workspace_id", None):
        return "%s/workspaces/%s" % (cpath, args.workspace_id)
    return default_workspace(cpath).get("path")


# --------------------------------------------------------------------------
# Reads
# --------------------------------------------------------------------------

def cmd_accounts(args):
    got = get("accounts")
    rows = [{"account_id": a.get("accountId"), "name": a.get("name", ""),
             "path": a.get("path", "")}
            for a in (got.get("account") or [])]
    gfads.out(rows, ["account_id", "name", "path"], as_json=args.json,
              empty="no GTM accounts. The Google user needs access in GTM first.")


def cmd_containers(args):
    got = get("accounts/%s/containers" % args.account_id)
    rows = [{
        "container_id": c.get("containerId"),
        "public_id": c.get("publicId", ""),
        "name": c.get("name", ""),
        "usage": ",".join(c.get("usageContext") or []),
        "path": c.get("path", ""),
    } for c in (got.get("container") or [])]
    gfads.out(rows, ["container_id", "public_id", "name", "usage", "path"],
              as_json=args.json, empty="no containers in this account")
    gfads.note("Save the numeric container_id, not the GTM- public ID: the "
               "API addresses containers by number.")


def cmd_workspaces(args):
    got = get("%s/workspaces" % container_path(args))
    rows = [{"workspace_id": w.get("workspaceId"), "name": w.get("name", ""),
             "description": w.get("description", "")}
            for w in (got.get("workspace") or [])]
    gfads.out(rows, ["workspace_id", "name", "description"], as_json=args.json)


def cmd_tags(args):
    got = get("%s/tags" % workspace_path(args))
    rows = [{
        "tag_id": t.get("tagId"),
        "name": t.get("name", ""),
        "type": t.get("type", ""),
        "paused": t.get("paused", False),
        "firing": ",".join(t.get("firingTriggerId") or []) or "-",
    } for t in (got.get("tag") or [])]
    gfads.out(rows, ["tag_id", "name", "type", "paused", "firing"],
              as_json=args.json, empty="no tags in this workspace")


def cmd_triggers(args):
    got = get("%s/triggers" % workspace_path(args))
    rows = [{"trigger_id": t.get("triggerId"), "name": t.get("name", ""),
             "type": t.get("type", "")}
            for t in (got.get("trigger") or [])]
    gfads.out(rows, ["trigger_id", "name", "type"], as_json=args.json,
              empty="no triggers in this workspace")


def cmd_variables(args):
    wpath = workspace_path(args)
    rows = [{"kind": "user", "id": v.get("variableId"), "name": v.get("name", ""),
             "type": v.get("type", "")}
            for v in (get("%s/variables" % wpath).get("variable") or [])]
    rows += [{"kind": "built-in", "id": "", "name": v.get("name", ""),
              "type": v.get("type", "")}
             for v in (get("%s/built_in_variables" % wpath).get("builtInVariable") or [])]
    gfads.out(rows, ["kind", "id", "name", "type"], as_json=args.json)


def cmd_live(args):
    """What is published, which is the only thing a visitor's browser runs.
    A workspace full of correct tags that was never published measures
    nothing, and that is the single most common tagging failure."""
    got = get("%s/versions:live" % container_path(args))
    tags = got.get("tag") or []
    gfads.note("live version %s (%s), %d tag(s) published"
               % (got.get("containerVersionId"), got.get("name") or "unnamed",
                  len(tags)))
    rows = [{"tag_id": t.get("tagId"), "name": t.get("name", ""),
             "type": t.get("type", ""), "paused": t.get("paused", False)}
            for t in tags]
    gfads.out(rows, ["tag_id", "name", "type", "paused"], as_json=args.json,
              empty="nothing is published on this container")


# The tag types worth checking for on a client that runs ads. Anything
# missing here means a channel is spending money it cannot measure.
EXPECTED = [
    ("googtag", "GA4 configuration (Google tag)", "GA4 sees no traffic at all"),
    ("gaawe", "GA4 event", "no conversion events reach GA4"),
    ("awct", "Google Ads conversion", "Google Ads cannot optimise on conversions"),
    ("sp", "Google Ads remarketing", "no Google Ads audience is being built"),
]


def cmd_audit(args):
    """The read that answers 'is this client actually measurable', which is
    the question worth asking before touching their budget."""
    cpath = container_path(args)
    wpath = workspace_path(args)
    draft = get("%s/tags" % wpath).get("tag") or []
    try:
        live = get("%s/versions:live" % cpath)
        live_tags = live.get("tag") or []
        live_id = live.get("containerVersionId")
    except SystemExit:
        live_tags, live_id = [], None

    draft_types = {t.get("type") for t in draft}
    live_types = {t.get("type") for t in live_tags}
    rows = []
    for tag_type, label, consequence in EXPECTED:
        rows.append({
            "expected": label,
            "type": tag_type,
            "in_workspace": "yes" if tag_type in draft_types else "NO",
            "published": "yes" if tag_type in live_types else "NO",
            "if_missing": "" if tag_type in live_types else consequence,
        })
    gfads.out(rows, ["expected", "type", "in_workspace", "published", "if_missing"],
              as_json=args.json)

    paused = [t.get("name") for t in live_tags if t.get("paused")]
    if paused:
        gfads.note("paused in the live version: %s" % ", ".join(paused))
    unpublished = len(draft) - len(live_tags)
    if live_id is None:
        gfads.note("this container has never been published, so none of these "
                   "tags are running")
    elif unpublished > 0:
        gfads.note("%d tag(s) exist in the workspace but are not in live "
                   "version %s. They are not running until published."
                   % (unpublished, live_id))


# --------------------------------------------------------------------------
# Writes, gated
# --------------------------------------------------------------------------

def cmd_add_ga4_config(args):
    wpath = workspace_path(args)
    mid = args.measurement_id
    if not mid.upper().startswith("G-"):
        gfads.die("a GA4 measurement ID looks like G-XXXXXXX, got %r" % mid)
    existing = [t for t in (get("%s/tags" % wpath).get("tag") or [])
                if t.get("type") == "googtag"]
    if existing:
        gfads.note("this workspace already has a Google tag: %s"
                   % ", ".join(t.get("name", "?") for t in existing))
    body = {
        "name": args.name or "GA4 Configuration",
        "type": "googtag",
        "parameter": [{"type": "template", "key": "tagId", "value": mid}],
        "firingTriggerId": ["2147479553"],  # All Pages, a GTM built-in
    }
    gfads.gate(args.confirm,
               "create a GA4 configuration tag for %s in %s, firing on all pages"
               % (mid, wpath), body)
    got = post("%s/tags" % wpath, body)
    print("created tag %s (%s). Not live until you publish."
          % (got.get("tagId"), got.get("name")))


def cmd_add_ga4_event(args):
    wpath = workspace_path(args)
    tags = get("%s/tags" % wpath).get("tag") or []
    config = next((t for t in tags if t.get("type") == "googtag"), None)
    if not config:
        gfads.die("no GA4 configuration tag in this workspace yet. A GA4 event "
                  "tag has nothing to send through. Run add-ga4-config first.",
                  gfads.EXIT_API)
    body = {
        "name": args.name or "GA4 Event - %s" % args.event,
        "type": "gaawe",
        "parameter": [
            {"type": "template", "key": "eventName", "value": args.event},
            {"type": "tagReference", "key": "measurementIdOverride",
             "value": config.get("name")},
        ],
        "firingTriggerId": [str(args.trigger)],
    }
    gfads.gate(args.confirm,
               "create a GA4 event tag '%s' in %s, firing on trigger %s"
               % (args.event, wpath, args.trigger), body)
    got = post("%s/tags" % wpath, body)
    print("created tag %s (%s). Not live until you publish."
          % (got.get("tagId"), got.get("name")))


def cmd_publish(args):
    """Two calls: freeze the workspace into a version, then publish it.

    This is the one write here that changes what runs in a visitor's
    browser on the client's live site, so it says exactly that before
    asking for --confirm.
    """
    cpath = container_path(args)
    wpath = workspace_path(args)
    draft = get("%s/tags" % wpath).get("tag") or []
    gfads.note("workspace holds %d tag(s): %s"
               % (len(draft), ", ".join(t.get("name", "?") for t in draft) or "none"))
    gfads.gate(args.confirm,
               "publish %s to the client's LIVE site. This changes what runs in "
               "every visitor's browser, immediately." % cpath,
               {"name": args.name, "tags_in_workspace": len(draft)})
    version = post("%s:create_version" % wpath,
                   {"name": args.name,
                    "notes": args.notes or "Published by Growth Factor"})
    cv = version.get("containerVersion") or {}
    vpath = cv.get("path")
    if not vpath:
        if version.get("compilerError"):
            gfads.die("GTM refused to build a version from this workspace: %s"
                      % version.get("compilerError"), gfads.EXIT_API)
        gfads.die("no version came back from create_version: %s" % version,
                  gfads.EXIT_API)
    post("%s:publish" % vpath)
    print("published version %s (%s)"
          % (cv.get("containerVersionId"), cv.get("name")))


def main():
    ap = argparse.ArgumentParser(description="Google Tag Manager API v2, direct.")
    ap.add_argument("--json", action="store_true")
    sub = ap.add_subparsers(dest="cmd", required=True)
    common = gfads.json_parent()

    def sp(cmd_name, **kw):
        return sub.add_parser(cmd_name, parents=[common], **kw)


    def client_arg(p):
        p.add_argument("client", nargs="?", help="registry slug")
        p.add_argument("--container-path", dest="container_path",
                       help="accounts/<a>/containers/<c>, instead of a slug")
        p.add_argument("--workspace-id", dest="workspace_id",
                       help="workspace to use (default the Default Workspace)")
        return p

    sp("accounts", help="GTM accounts").set_defaults(func=cmd_accounts)

    p = sp("containers", help="containers in an account")
    p.add_argument("account_id")
    p.set_defaults(func=cmd_containers)

    client_arg(sp("workspaces")).set_defaults(func=cmd_workspaces)
    client_arg(sp("tags", help="tags in the workspace")).set_defaults(
        func=cmd_tags)
    client_arg(sp("triggers")).set_defaults(func=cmd_triggers)
    client_arg(sp("variables")).set_defaults(func=cmd_variables)
    client_arg(sp("live", help="what is published")).set_defaults(
        func=cmd_live)
    client_arg(sp("audit", help="measurement gaps")).set_defaults(
        func=cmd_audit)

    p = client_arg(sp("add-ga4-config", help="create the Google tag"))
    p.add_argument("--measurement-id", dest="measurement_id", required=True,
                   help="G-XXXXXXX")
    p.add_argument("--name")
    p.add_argument("--confirm", action="store_true")
    p.set_defaults(func=cmd_add_ga4_config)

    p = client_arg(sp("add-ga4-event", help="create a GA4 event tag"))
    p.add_argument("--event", required=True, help="e.g. generate_lead")
    p.add_argument("--trigger", required=True, help="trigger ID from `gtm.py triggers`")
    p.add_argument("--name")
    p.add_argument("--confirm", action="store_true")
    p.set_defaults(func=cmd_add_ga4_event)

    p = client_arg(sp("publish", help="version and publish the workspace"))
    p.add_argument("--name", required=True, help="version name, e.g. 'GA4 + Ads conversions'")
    p.add_argument("--notes")
    p.add_argument("--confirm", action="store_true")
    p.set_defaults(func=cmd_publish)

    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
