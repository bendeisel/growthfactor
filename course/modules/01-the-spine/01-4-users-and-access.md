# 01.4 Users and staff access

**Module:** 01 The Spine
**Video:** ~5 min
**Needs first:** nothing
**You finish with:** your coaches able to do their job and unable to break
anything

## Why this matters

Your coaches need to reply to members from their phones. They do not need the
ability to delete a workflow or export your entire contact list.

There is also a practical reason beyond permissions: if everyone shares one
login, every message says it came from the same person, and you cannot see who
did what when something goes wrong.

## Roles

| Role | Can | Give it to |
|------|-----|-----------|
| Admin | Everything, including settings, workflows and deleting things | You. One or two people, maximum |
| User | Conversations, contacts, calendars, opportunities. Not settings | Coaches and front desk staff |

## Steps

1. Open **Settings > My Staff**.

   [SHOT 01.4-01]

2. Click **Add Employee**.

3. Fill in first name, last name, email, phone. Use their real email, they get
   an invite there.

4. Set the **role** to `User` for coaches. Admin only for you and one backup.

   [SHOT 01.4-02]

5. Under permissions, this is where you decide what a coach actually sees.
   Sensible defaults for a gym coach:

   | Permission | Setting | Why |
   |-----------|---------|-----|
   | Conversations | On | The whole point |
   | Contacts | On | They need to look people up |
   | Opportunities | On | So they can move a card after a trial |
   | Calendars | On | Their own bookings |
   | Payments | Off, unless they take money at the desk | |
   | Marketing, Automation, Sites | Off | Nothing good happens here by accident |
   | Settings | Off | |
   | Bulk requests | Off | This is the one that lets somebody text your whole list |
   | Contact export | Off | This is the one that lets somebody take your database when they leave |

   [SHOT 01.4-03]

6. Save. They get an email invite.

## Two settings worth being deliberate about

**Contact export, off.** Coaches leave, and sometimes they open their own gym
down the road. Your member list is the most valuable thing you own.

**Bulk requests, off.** This is the permission that allows sending to many
contacts at once. One well-meaning coach with this switched on can text your
entire database, and there is no undo on a sent text.

## Calendar assignment

If a coach takes their own bookings, they need to be added as a team member on
that calendar, which is a separate step in module 03. Adding them as a user
here does not put them on a calendar. See 03.1.

## Test it

1. Log in as the new user, in a private window, using their invite.
2. Confirm they can see Conversations and reply.
3. Confirm Settings is not visible to them.
4. Try to export contacts. It should not be possible.

Do the private window part. Checking permissions from your own admin login
tells you nothing.

## Checklist

- [ ] Every coach who talks to members has their own login
- [ ] Nobody shares a login
- [ ] Only one or two admins
- [ ] Contact export off for everyone except you
- [ ] Bulk requests off for everyone except you
- [ ] Tested one user login in a private window

## When it goes wrong

**A coach cannot see a conversation.** Usually conversation assignment rather
than permissions. Check whether the conversation is assigned to someone else
and whether they can see unassigned threads.

**A coach's replies show as coming from you.** They are on your login. Give
them their own.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 01.4-01 | Settings > My Staff | The staff list | Add Employee button | Staff names and emails |
| 01.4-02 | Add employee form | Role selector | The User option | Personal details |
| 01.4-03 | Permissions panel | The permission toggles | Contact export and bulk requests, both off | Nothing |

## Video script

**Hook.** Two switches on this screen decide whether a coach who leaves can
take your member list with them.

**Beats.**
1. On screen: My Staff. Add an employee, quickly.
2. On screen: role selector. Admin versus User in fifteen seconds.
3. On screen: permissions. Slow down. Point at contact export, point at bulk
   requests. Say why for each. This is the lesson.
4. On screen: private window, logged in as the coach. Show that Settings is
   gone.

**Go do.** Add every coach who talks to members, with export and bulk off.
Then stop sharing your login.

## Verify on screen

- Exact label for the staff menu, since it has been My Staff and Team.
- The full permission list in the current release and the exact wording of
  the export and bulk permissions.
