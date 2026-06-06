alter policy "Creators can view their lines"
on public.lines
using (owner_id = (select auth.uid()));

alter policy "Creators can create their lines"
on public.lines
with check (owner_id = (select auth.uid()));

alter policy "Creators can update their lines"
on public.lines
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

alter policy "Creators can delete their lines"
on public.lines
using (owner_id = (select auth.uid()));

alter policy "Creators can view their line questions"
on public.line_questions
using (
  exists (
    select 1
    from public.lines
    where lines.id = line_questions.line_id
      and lines.owner_id = (select auth.uid())
  )
);

alter policy "Creators can create their line questions"
on public.line_questions
with check (
  exists (
    select 1
    from public.lines
    where lines.id = line_questions.line_id
      and lines.owner_id = (select auth.uid())
  )
);

alter policy "Creators can update their line questions"
on public.line_questions
using (
  exists (
    select 1
    from public.lines
    where lines.id = line_questions.line_id
      and lines.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.lines
    where lines.id = line_questions.line_id
      and lines.owner_id = (select auth.uid())
  )
);

alter policy "Creators can delete their line questions"
on public.line_questions
using (
  exists (
    select 1
    from public.lines
    where lines.id = line_questions.line_id
      and lines.owner_id = (select auth.uid())
  )
);
