-- Driving School App - Cascade student deletes to linked records
-- Keeps permanent student deletion from being blocked by saved lessons, histories, reminders, or map records.

alter table public.lessons
drop constraint if exists lessons_student_id_fkey;

alter table public.lessons
add constraint lessons_student_id_fkey
foreign key (student_id)
references public.students(id)
on delete cascade;

alter table public.assessments
drop constraint if exists assessments_student_id_fkey;

alter table public.assessments
add constraint assessments_student_id_fkey
foreign key (student_id)
references public.students(id)
on delete cascade;

alter table public.student_sessions
drop constraint if exists student_sessions_student_id_fkey;

alter table public.student_sessions
add constraint student_sessions_student_id_fkey
foreign key (student_id)
references public.students(id)
on delete cascade;

alter table public.student_reminders
drop constraint if exists student_reminders_student_id_fkey;

alter table public.student_reminders
add constraint student_reminders_student_id_fkey
foreign key (student_id)
references public.students(id)
on delete cascade;

alter table public.map_pins
drop constraint if exists map_pins_student_id_fkey;

alter table public.map_pins
add constraint map_pins_student_id_fkey
foreign key (student_id)
references public.students(id)
on delete cascade;

alter table public.map_annotations
drop constraint if exists map_annotations_student_id_fkey;

alter table public.map_annotations
add constraint map_annotations_student_id_fkey
foreign key (student_id)
references public.students(id)
on delete cascade;
