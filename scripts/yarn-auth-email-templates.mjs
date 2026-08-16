#!/usr/bin/env node
/**
 * Yarn-branded Supabase Auth email templates.
 *
 * Generates HTML under supabase/templates/ and can PATCH them onto the
 * hosted HolidayPlanr project via the Management API when
 * SUPABASE_ACCESS_TOKEN is set.
 *
 * Usage:
 *   node scripts/yarn-auth-email-templates.mjs            # write HTML files
 *   node scripts/yarn-auth-email-templates.mjs --apply    # write + PATCH live
 *
 * Token: https://supabase.com/dashboard/account/tokens
 * Dashboard fallback: Auth → Email Templates
 *   https://supabase.com/dashboard/project/wvgulynvhgyzuecysocx/auth/templates
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'supabase', 'templates');
const PROJECT_REF = 'wvgulynvhgyzuecysocx';
const LOGO_URL = 'https://holiday-planner-ruby.vercel.app/brand/yarn-email-icon.png';

const BRAND = {
  name: 'Yarn',
  cream: '#F7F1E6',
  creamCard: '#FDFBF5',
  ink: '#1A1A1A',
  muted: '#6B6458',
  gold: '#c59837',
  goldDark: '#a67d2a',
  border: 'rgba(26,26,26,0.12)',
};

function shell({ title, lead, ctaLabel, ctaHref, footnote }) {
  // Table + inline CSS for broad email-client support. Web fonts are best-effort.
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BRAND.cream};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(lead)}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BRAND.cream};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;background-color:${BRAND.creamCard};border:1px solid ${BRAND.border};border-radius:16px;">
          <tr>
            <td style="padding:28px 28px 8px 28px;text-align:center;">
              <img src="${LOGO_URL}" width="56" height="52" alt="Yarn" style="display:inline-block;border:0;outline:none;text-decoration:none;width:56px;height:auto;" />
              <div style="margin-top:10px;font-family:'Varela Round',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:700;letter-spacing:0.02em;color:${BRAND.ink};">
                ${BRAND.name}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 0 28px;text-align:center;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;font-weight:700;color:${BRAND.ink};">
                ${escapeHtml(title)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 28px 0 28px;text-align:center;">
              <p style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.55;color:${BRAND.muted};">
                ${escapeHtml(lead)}
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 28px 8px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" bgcolor="${BRAND.gold}" style="border-radius:999px;background-color:${BRAND.gold};">
                    <a href="${ctaHref}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:600;line-height:1;color:#FDFBF5;text-decoration:none;border-radius:999px;">
                      ${escapeHtml(ctaLabel)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 8px 28px;text-align:center;">
              <p style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};">
                ${escapeHtml(footnote)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 28px 28px;text-align:center;">
              <p style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;line-height:1.5;color:${BRAND.muted};word-break:break-all;">
                Or paste this link into your browser:<br />
                <a href="${ctaHref}" style="color:${BRAND.goldDark};text-decoration:underline;">${ctaHref}</a>
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;">
          <tr>
            <td style="padding:20px 12px 0 12px;text-align:center;">
              <p style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.5;color:${BRAND.muted};">
                You’re receiving this because you signed up for Yarn.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Supabase Go templates — leave ConfirmationURL unescaped for Go to expand. */
const CONFIRMATION_URL = '{{ .ConfirmationURL }}';

export const TEMPLATES = {
  confirmation: {
    file: 'confirmation.html',
    subject: 'Confirm your email for Yarn',
    apiSubjectKey: 'mailer_subjects_confirmation',
    apiContentKey: 'mailer_templates_confirmation_content',
    html: shell({
      title: 'Confirm your email',
      lead: 'Tap the button below to confirm this address and finish joining Yarn.',
      ctaLabel: 'Confirm email address',
      ctaHref: CONFIRMATION_URL,
      footnote: 'This link expires shortly and can only be used once.',
    }),
  },
  magic_link: {
    file: 'magic_link.html',
    subject: 'Your Yarn sign-in link',
    apiSubjectKey: 'mailer_subjects_magic_link',
    apiContentKey: 'mailer_templates_magic_link_content',
    html: shell({
      title: 'Sign in to Yarn',
      lead: 'Use this one-time link to open your trips. It expires shortly.',
      ctaLabel: 'Sign in to Yarn',
      ctaHref: CONFIRMATION_URL,
      footnote: 'If you didn’t ask for this, you can ignore the email.',
    }),
  },
  recovery: {
    file: 'recovery.html',
    subject: 'Reset your Yarn password',
    apiSubjectKey: 'mailer_subjects_recovery',
    apiContentKey: 'mailer_templates_recovery_content',
    html: shell({
      title: 'Reset your password',
      lead: 'We got a request to reset the password for your Yarn account.',
      ctaLabel: 'Choose a new password',
      ctaHref: CONFIRMATION_URL,
      footnote: 'If you didn’t ask for this, you can safely ignore the email.',
    }),
  },
  invite: {
    file: 'invite.html',
    subject: 'You’re invited to Yarn',
    apiSubjectKey: 'mailer_subjects_invite',
    apiContentKey: 'mailer_templates_invite_content',
    html: shell({
      title: 'You’re invited',
      lead: 'Someone invited you to Yarn. Accept below to create your account.',
      ctaLabel: 'Accept invitation',
      ctaHref: CONFIRMATION_URL,
      footnote: 'This invite link expires shortly.',
    }),
  },
  email_change: {
    file: 'email_change.html',
    subject: 'Confirm your new email for Yarn',
    apiSubjectKey: 'mailer_subjects_email_change',
    apiContentKey: 'mailer_templates_email_change_content',
    html: shell({
      title: 'Confirm your new email',
      lead: 'Confirm {{ .NewEmail }} as the new address for your Yarn account.',
      ctaLabel: 'Confirm new email',
      ctaHref: CONFIRMATION_URL,
      footnote: 'If you didn’t request this change, you can ignore the email.',
    }),
  },
};

function writeTemplates() {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const template of Object.values(TEMPLATES)) {
    const path = join(OUT_DIR, template.file);
    writeFileSync(path, template.html, 'utf8');
    console.log(`wrote ${path}`);
  }
}

function buildPayload() {
  const payload = {};
  for (const template of Object.values(TEMPLATES)) {
    payload[template.apiSubjectKey] = template.subject;
    payload[template.apiContentKey] = template.html;
  }
  return payload;
}

async function applyTemplates() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      'SUPABASE_ACCESS_TOKEN is not set. Create one at https://supabase.com/dashboard/account/tokens'
    );
  }

  const payload = buildPayload();
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${text.slice(0, 800)}`);
  }
  console.log(`Applied Yarn auth email templates to ${PROJECT_REF}`);
}

const apply = process.argv.includes('--apply');
writeTemplates();
if (apply) {
  applyTemplates().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
} else {
  console.log('Tip: re-run with --apply and SUPABASE_ACCESS_TOKEN to push live.');
}
