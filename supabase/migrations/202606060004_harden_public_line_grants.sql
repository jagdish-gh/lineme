revoke all on public.lines from anon;
revoke all on public.line_questions from anon;

grant select, insert, update, delete on public.lines to authenticated;
grant select, insert, update, delete on public.line_questions to authenticated;
