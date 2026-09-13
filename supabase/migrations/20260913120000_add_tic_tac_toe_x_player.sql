alter table public.tic_tac_toe_rooms
  add column if not exists x_player integer not null default 1 check (x_player in (1, 2));
