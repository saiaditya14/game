create or replace function public.monopoly_end_turn(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; p jsonb; next_i integer; active_count integer; completed integer; next_round integer; winner text;
begin
 select * into r from monopoly_rooms where id=p_room_id for update; p:=r.players->r.current_player_index;
 if p->>'id'<>auth.uid()::text or r.turn_phase<>'awaiting_end_turn' or r.auction is not null then raise exception 'End Turn unavailable'; end if;
 if r.pending_action->>'type'='purchase' then raise exception 'Resolve the property purchase or decline it before ending the turn'; end if;
 if p->'debt' is not null and (p->>'money')::integer<0 then raise exception 'Resolve debt before ending turn'; end if;
 if r.consecutive_doubles>0 and not (p->>'inTimeOut')::boolean then
  update monopoly_rooms set turn_phase='awaiting_roll',pending_action=null where id=r.id returning * into r; return r;
 end if;
 select count(*) into active_count from jsonb_array_elements(r.players) q where (q->>'active')::boolean;
 if active_count<=1 then select q->>'id' into winner from jsonb_array_elements(r.players) q where (q->>'active')::boolean limit 1;
 elsif (r.rules->>'targetCashEnabled')::boolean and (p->>'money')::integer >= (r.rules->>'targetCash')::integer then winner:=p->>'id'; end if;
 if winner is not null then update monopoly_rooms set status='finished',winner_id=winner::uuid,end_reason=case when active_count<=1 then 'last_solvent' else 'target_cash' end,turn_phase='finished',pending_action=null where id=r.id returning * into r; return r; end if;
 next_i:=(r.current_player_index+1)%jsonb_array_length(r.players);
 while not (r.players->next_i->>'active')::boolean loop next_i:=(next_i+1)%jsonb_array_length(r.players); end loop;
 completed:=r.turns_completed+1; next_round:=r.round_number+case when completed%active_count=0 then 1 else 0 end;
 update monopoly_rooms set current_player_index=next_i,turn_phase='awaiting_roll',pending_action=null,consecutive_doubles=0,
  turns_completed=completed,round_number=next_round where id=r.id returning * into r; return r;
end $$;
