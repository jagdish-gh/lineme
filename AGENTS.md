# Analytics Tracking - Mixpanel

This project uses Mixpanel as its product analytics system. Do not add another
analytics SDK or route the same events through a second pipeline unless the
user explicitly changes the architecture.

## Implementation

| Detail | Value |
|---|---|
| Platform | Next.js web application |
| SDK | `mixpanel-browser` `^2.80.0` |
| Tracking method | Direct client-side SDK |
| CDP | None |
| Consent gate | Not currently required; revisit before serving EU/EEA/UK/CH or California users |
| Project timezone | India Standard Time |
| Token location | `NEXT_PUBLIC_MIXPANEL_TOKEN` |
| Production gate | `NEXT_PUBLIC_DEPLOYMENT_ENV=production` |
| Local opt-in | `NEXT_PUBLIC_MIXPANEL_ENABLED=true` |

Mixpanel is initialized only through `lib/analytics/mixpanel.ts`. Interaction
autocapture is disabled. Automatic SPA page views and IP-based geolocation are
enabled. URL query strings are removed and public line codes in join paths are
redacted before events are sent. Events are enabled only when the deployment
environment is explicitly `production`, or when the override is explicitly
enabled. Localhost stays disabled unless overridden.

## Identity

- `components/analytics/mixpanel-identity.tsx` calls `identify()` with the
  stable Supabase user UUID on login and session restore.
- It sets `$email`, `platform`, and `locale` profile properties.
- The global Supabase auth listener calls `resetAnalytics()` on every
  `SIGNED_OUT` event, including cross-tab and expired-session sign-outs.
- Identifying a UUID different from Mixpanel's persisted `$user_id` resets the
  SDK first to prevent merging two authenticated users.
- Never identify with an email address and never create anonymous profiles.

## Tracking Plan

Use snake_case names and track only after the related API request succeeds.

| Event | Trigger | Properties |
|---|---|---|
| `$mp_web_page_view` | Initial load and SPA path changes | Mixpanel page-view properties with sanitized URL path and no query string |
| `sign_up_completed` | A newly created Supabase user returns from authentication | `email`, `sign_up_method`, `platform`, `locale` |
| `line_created` | A creator successfully creates a line | `line_id`, `line_type`, `question_count`, `has_capacity`, `has_service_estimate`, `auto_notify`, `allow_pause` |
| `line_joined` | A user successfully joins a line | `line_id`, `line_type`, `join_method` |
| `member_called` | A creator successfully calls a member | `line_id`, `call_method` |
| `member_served` | A creator marks a member served | `line_id` |
| `line_status_changed` | A creator pauses, resumes, or closes a line | `line_id`, `previous_status`, `new_status`, `pause_duration_minutes` when fixed |
| `line_left` | A user successfully leaves a line | `line_id` |
| `additional_info_requested` | A creator sends an information request | `line_id` |
| `additional_info_submitted` | A user submits requested information | `line_id` |

## Data Rules

- Email is allowed only as the identified profile `$email` field and on
  `sign_up_completed`. Do not send names, phone numbers, user-entered answers,
  locations, line names, public line codes, ticket tokens, or request text.
- Do not construct event or property names dynamically.
- Omit unavailable properties instead of sending `null` or empty strings.
- Check this tracking plan before adding an event; extend an existing event
  when it already represents the action.
- Update this file whenever the tracking plan changes.
- Verify new events and identity linkage in Mixpanel Live View before release.
