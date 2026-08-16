# Yarn auth email templates

HTML for Supabase Auth → Email Templates on project `wvgulynvhgyzuecysocx`
(HolidayPlanr).

| File | Dashboard tab | Subject |
|------|---------------|---------|
| `confirmation.html` | Confirm sign up | Confirm your email for Yarn |
| `magic_link.html` | Magic Link | Your Yarn sign-in link |
| `recovery.html` | Reset Password | Reset your Yarn password |
| `invite.html` | Invite user | You’re invited to Yarn |
| `email_change.html` | Change Email Address | Confirm your new email for Yarn |

Regenerate (and optionally apply) with:

```bash
node scripts/yarn-auth-email-templates.mjs
SUPABASE_ACCESS_TOKEN=… node scripts/yarn-auth-email-templates.mjs --apply
```

Do not hand-edit these HTML files — change the generator script instead.
