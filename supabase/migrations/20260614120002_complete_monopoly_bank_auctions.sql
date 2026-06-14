create or replace function public.monopoly_auction(p_room_id uuid, p_bid integer default null)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; auct jsonb; bidders jsonb; current jsonb; active_count integer; next_i integer; p jsonb; sid integer; winner text; amount integer; next_players jsonb; queue jsonb; next_sid integer;
begin
 select * into r from monopoly_rooms where id=p_room_id for update; auct:=r.auction;
 if auct is null then raise exception 'No auction'; end if;
 bidders:=auct->'bidders'; current:=bidders->((auct->>'bidderIndex')::integer);
 if current->>'id'<>auth.uid()::text then raise exception 'Not your auction turn'; end if;
 if p_bid is null then current:=jsonb_set(current,'{active}','false'::jsonb);
 elsif p_bid<=coalesce((auct->>'bid')::integer,0) then raise exception 'Bid must exceed current bid';
 else
   select q into p from jsonb_array_elements(r.players) q where q->>'id'=auth.uid()::text;
   if (p->>'money')::integer<p_bid then raise exception 'Cannot afford bid'; end if;
   auct:=auct||jsonb_build_object('bid',p_bid,'highBidderId',auth.uid());
 end if;
 bidders:=jsonb_set(bidders,array[(auct->>'bidderIndex')],current); auct:=jsonb_set(auct,'{bidders}',bidders);
 select count(*) into active_count from jsonb_array_elements(bidders) b where (b->>'active')::boolean;
 winner:=auct->>'highBidderId'; amount:=coalesce((auct->>'bid')::integer,0); sid:=(auct->>'spaceId')::integer; queue:=coalesce(auct->'queue','[]');
 if active_count<=1 then
   if winner is not null then
     select jsonb_agg(case when q->>'id'=winner then jsonb_set(q,'{money}',to_jsonb((q->>'money')::integer-amount)) else q end) into next_players from jsonb_array_elements(r.players) q;
     r.players:=next_players;
     r.ownership:=jsonb_set(r.ownership,array[sid::text],(r.ownership->(sid::text))||jsonb_build_object('ownerId',winner));
   end if;
   if jsonb_array_length(queue)>0 then
     next_sid:=(queue->>0)::integer;
     select jsonb_agg(jsonb_build_object('id',q->>'id','active',true)) into bidders from jsonb_array_elements(r.players) q where (q->>'active')::boolean;
     auct:=jsonb_build_object('spaceId',next_sid,'bidders',bidders,'bid',0,'highBidderId',null,'bidderIndex',0,'queue',queue-0);
     update monopoly_rooms set players=r.players,ownership=r.ownership,auction=auct,pending_action=jsonb_build_object('type','auction','spaceId',next_sid) where id=r.id returning * into r;
   else
     update monopoly_rooms set players=r.players,ownership=r.ownership,auction=null,pending_action=jsonb_build_object('type',case when winner is null then 'declined' else 'auction_won' end,'spaceId',sid,'amount',amount) where id=r.id returning * into r;
   end if;
   return r;
 end if;
 next_i:=((auct->>'bidderIndex')::integer+1)%jsonb_array_length(bidders);
 while not (bidders->next_i->>'active')::boolean loop next_i:=(next_i+1)%jsonb_array_length(bidders); end loop;
 auct:=jsonb_set(auct,'{bidderIndex}',to_jsonb(next_i));
 update monopoly_rooms set auction=auct where id=r.id returning * into r; return r;
end $$;

create or replace function public.monopoly_bankrupt(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; p jsonb; creditor text; sid text; d jsonb; bank_ids jsonb:='[]'::jsonb; bidders jsonb; first_sid integer;
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
 if creditor is null and (r.rules->>'auctions')::boolean and jsonb_array_length(bank_ids)>0 then
   first_sid:=(bank_ids->>0)::integer;
   select jsonb_agg(jsonb_build_object('id',q->>'id','active',true)) into bidders from jsonb_array_elements(r.players) q where (q->>'active')::boolean;
   r.auction:=jsonb_build_object('spaceId',first_sid,'bidders',bidders,'bid',0,'highBidderId',null,'bidderIndex',0,'queue',bank_ids-0);
 end if;
 update monopoly_rooms set players=r.players,ownership=r.ownership,auction=r.auction,
   pending_action=jsonb_build_object('type',case when r.auction is null then 'bankrupt' else 'auction' end,'spaceId',case when r.auction is null then null else first_sid end)
 where id=r.id returning * into r; return r;
end $$;

create or replace function public.monopoly_forfeit(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; sid text; d jsonb; remaining integer; next_players jsonb; next_host text; was_current boolean; bank_ids jsonb:='[]'::jsonb; bidders jsonb; first_sid integer; next_index integer;
begin
 select * into r from monopoly_rooms where id=p_room_id for update;
 if not monopoly_room_member(r.players,auth.uid()) then raise exception 'Not a room member'; end if;
 was_current:=r.status='playing' and r.players->r.current_player_index->>'id'=auth.uid()::text;
 if r.status in ('waiting','setup') then
   select coalesce(jsonb_agg(q),'[]') into next_players from jsonb_array_elements(r.players) q where q->>'id'<>auth.uid()::text;
   r.players:=next_players;
 else
   select jsonb_agg(case when q->>'id'=auth.uid()::text then q||jsonb_build_object('money',0,'active',false,'bankrupt',true) else q end) into next_players from jsonb_array_elements(r.players) q;
   r.players:=next_players;
   for sid,d in select key,value from jsonb_each(r.ownership) loop
     if d->>'ownerId'=auth.uid()::text then
       bank_ids:=bank_ids||to_jsonb(sid::integer);
       r.ownership:=jsonb_set(r.ownership,array[sid],d||jsonb_build_object('ownerId',null,'mortgaged',false,'buildings',0));
     end if;
   end loop;
 end if;
 select count(*) into remaining from jsonb_array_elements(r.players) q where coalesce((q->>'active')::boolean,true);
 if r.host_id=auth.uid()::text then select q->>'id' into next_host from jsonb_array_elements(r.players) q where q->>'id'<>auth.uid()::text and coalesce((q->>'active')::boolean,true) limit 1; r.host_id:=coalesce(next_host,''); end if;
 if was_current and remaining>0 then
   next_index:=(r.current_player_index+1)%jsonb_array_length(r.players);
   while not (r.players->next_index->>'active')::boolean loop next_index:=(next_index+1)%jsonb_array_length(r.players); end loop;
   r.current_player_index:=next_index; r.turn_phase:='awaiting_roll'; r.pending_action:=null; r.consecutive_doubles:=0;
 end if;
 if r.status='playing' and (r.rules->>'auctions')::boolean and jsonb_array_length(bank_ids)>0 and remaining>0 then
   first_sid:=(bank_ids->>0)::integer;
   select jsonb_agg(jsonb_build_object('id',q->>'id','active',true)) into bidders from jsonb_array_elements(r.players) q where (q->>'active')::boolean;
   r.auction:=jsonb_build_object('spaceId',first_sid,'bidders',bidders,'bid',0,'highBidderId',null,'bidderIndex',0,'queue',bank_ids-0);
   r.pending_action:=jsonb_build_object('type','auction','spaceId',first_sid);
 end if;
 update monopoly_rooms set players=r.players,ownership=r.ownership,host_id=r.host_id,current_player_index=r.current_player_index,
   turn_phase=r.turn_phase,pending_action=r.pending_action,consecutive_doubles=r.consecutive_doubles,auction=r.auction,
   status=case when remaining=0 then 'aborted' else r.status end where id=r.id returning * into r; return r;
end $$;
