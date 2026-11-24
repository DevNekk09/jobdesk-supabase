# Jobdesk V2.1.8 — Native Date Picker + Auto NEW Badge

- Restore native calendar date inputs for Date ordered and Due date, on desktop and mobile. The input value stays ISO YYYY-MM-DD as required by HTML date inputs and Supabase, while date text throughout the app continues to show DD/MM/YYYY. The browser chooses the native date-input display locale.
- Show subtle NEW badge next to names in Designer, All jobs, and Production lists only if the job's real created_at timestamp falls on the current Malaysia calendar day.
- Automatic badge expiration at midnight Malaysia (UTC+8), and synchronization on tab visibility/focus to handle suspended mobile browser timers.
- Do not reuse editable Date ordered for the NEW badge; editing a job cannot make it NEW again.
- Include regression on desktop and phone for native pickers, conditional badges, and midnight expiry.
- No changes to Supabase schema, jobs, roles, Admin PIN, or workflow state.
