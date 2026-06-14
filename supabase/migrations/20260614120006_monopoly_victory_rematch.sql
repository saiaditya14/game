create or replace function public.monopoly_bankrupt(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; p jsonb; creditor text; sid text; d jsonb; bank_ids jsonb:='[]'::jsonb; bidders jsonb; first_sid integer; active_count integer; total_players integer; winner text;
begin
 select * into r from monopoly_rooms where id=p_room_id for update; p:=r.players->r.current_player_index;
 if p->>'id'<>auth.uid()::text or p->'debt' is null then raise exception 'Bankruptcy unavailable'; end if; creditor:=p->'debt'->>'creditorId';
 for sid,d in select key,value from jsonb_each(r.ownership) loop
   if d->>'ownerId'=auth.uid()::text then
     if creditor is null then
       bank_ids:=bank_ids||to_jsonb(sid::integer);
       r.ownership:=jsonb_set(r.ownership,array[sid],d||jsonb_build_object('ownerId',null,'mortgaged',false,'buildings',0));
     else
       r.ownership:=jsonb_set(r.ownership,array[sid],d||jsonb_build_object('ownerId',creditor,'buildings',0));
     end if;
   end if;
 end loop;
 r.players := (select jsonb_agg(case when q->>'id'=auth.uid()::text then q||jsonb_build_object('money',0,'active',false,'bankrupt',true,'debt',null)
   when creditor is not null and q->>'id'=creditor then jsonb_set(q,'{money}',to_jsonb((q->>'money')::integer+greatest(0,(p->>'money')::integer))) else q end)
   from jsonb_array_elements(r.players) q);
 total_players:=jsonb_array_length(r.players);
 select count(*) into active_count from jsonb_array_elements(r.players) q where (q->>'active')::boolean;
 if total_players=1 and active_count=0 then
   update monopoly_rooms set players=r.players,ownership=r.ownership,auction=null,pending_action=null,
     status='finished',turn_phase='finished',winner_id=null,end_reason='solo_bankrupt',
     event_log=monopoly_append_event(r.event_log,p->>'name','went bankrupt and ended the solo quest','tax')
   where id=r.id returning * into r;
   return r;
 end if;
 if total_players>1 and active_count=1 then
   select q->>'id' into winner from jsonb_array_elements(r.players) q where (q->>'active')::boolean limit 1;
   update monopoly_rooms set players=r.players,ownership=r.ownership,auction=null,pending_action=null,
     status='finished',turn_phase='finished',winner_id=winner::uuid,end_reason='last_solvent',
     event_log=monopoly_append_event(r.event_log,(select q->>'name' from jsonb_array_elements(r.players) q where q->>'id'=winner),'won as the last solvent adventurer','money')
   where id=r.id returning * into r;
   return r;
 end if;
 if creditor is null and (r.rules->>'auctions')::boolean and jsonb_array_length(bank_ids)>0 then
   first_sid:=(bank_ids->>0)::integer;
   select jsonb_agg(jsonb_build_object('id',q->>'id','active',true)) into bidders from jsonb_array_elements(r.players) q where (q->>'active')::boolean;
   r.auction:=jsonb_build_object('spaceId',first_sid,'bidders',bidders,'bid',0,'highBidderId',null,'bidderIndex',0,'queue',bank_ids-0);
 end if;
 update monopoly_rooms set players=r.players,ownership=r.ownership,auction=r.auction,
   pending_action=jsonb_build_object('type',case when r.auction is null then 'bankrupt' else 'auction' end,'spaceId',case when r.auction is null then null else first_sid end)
 where id=r.id returning * into r; return r;
end $$;

create or replace function public.monopoly_play_again(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; reset_players jsonb;
begin
 select * into r from monopoly_rooms where id=p_room_id for update;
 if r.host_id<>auth.uid()::text then raise exception 'Only the host can start a rematch'; end if;
 if r.status<>'finished' then raise exception 'The current quest is not finished'; end if;
 select jsonb_agg(q||jsonb_build_object(
   'money',(r.rules->>'startingCash')::integer,'position',0,'active',true,'bankrupt',false,
   'inTimeOut',false,'timeOutAttempts',0,'debt',null
 )) into reset_players from jsonb_array_elements(r.players) q;
 update monopoly_rooms set players=reset_players,status='setup',turn_phase='setup',pending_action=null,
   current_player_index=0,consecutive_doubles=0,round_number=1,turns_completed=0,
   ownership=monopoly_empty_ownership(),auction=null,trades='[]',tax_ledger='[]',
   latest_roll=null,winner_id=null,end_reason=null,started_at=null,
   event_log=monopoly_append_event(r.event_log,'Quest','prepared a rematch','card')
 where id=r.id returning * into r;
 return r;
end $$;

grant execute on function public.monopoly_play_again(uuid) to authenticated;
