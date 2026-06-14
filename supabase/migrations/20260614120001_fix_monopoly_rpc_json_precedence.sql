create or replace function public.monopoly_buy(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; idx integer; p jsonb; sid integer; a jsonb;
begin
 select * into r from monopoly_rooms where id=p_room_id for update; idx:=r.current_player_index; p:=r.players->idx;
 if p->>'id'<>auth.uid()::text or r.pending_action->>'type'<>'purchase' then raise exception 'Purchase unavailable'; end if;
 sid:=(r.pending_action->>'spaceId')::integer; a:=monopoly_asset(sid);
 if r.ownership->(sid::text)->>'ownerId' is not null or (p->>'money')::integer<(a->>'price')::integer then raise exception 'Cannot afford or property owned'; end if;
 p:=jsonb_set(p,'{money}',to_jsonb((p->>'money')::integer-(a->>'price')::integer));
 update monopoly_rooms set players=jsonb_set(r.players,array[idx::text],p),
  ownership=jsonb_set(r.ownership,array[sid::text],(r.ownership->(sid::text))||jsonb_build_object('ownerId',p->>'id')),
  pending_action=jsonb_build_object('type','bought','spaceId',sid),event_log=monopoly_append_event(r.event_log,p->>'name','bought '||(a->>'name'),'buy')
 where id=r.id returning * into r; return r;
end $$;

create or replace function public.monopoly_property_action(p_room_id uuid, p_action text, p_space integer)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; p jsonb; idx integer; a jsonb; d jsonb; buildings integer; value integer; complete boolean;
begin
 select * into r from monopoly_rooms where id=p_room_id for update; idx:=r.current_player_index; p:=r.players->idx; a:=monopoly_asset(p_space); d:=r.ownership->(p_space::text);
 if p->>'id'<>auth.uid()::text then raise exception 'Only active player may manage property'; end if;
 if d->>'ownerId'<>auth.uid()::text then raise exception 'Not your property'; end if;
 buildings:=coalesce((d->>'buildings')::integer,0);
 if p_action='build' then
  if a->>'type'<>'property' or (d->>'mortgaged')::boolean or buildings>=5 then raise exception 'Cannot build'; end if;
  select bool_and(r.ownership->(v.value #>> '{}')->>'ownerId'=auth.uid()::text) into complete from jsonb_array_elements(a->'group') v;
  if not complete or (p->>'money')::integer<(a->>'buildingCost')::integer then raise exception 'Complete group and cash required'; end if;
  p:=jsonb_set(p,'{money}',to_jsonb((p->>'money')::integer-(a->>'buildingCost')::integer)); d:=jsonb_set(d,'{buildings}',to_jsonb(buildings+1));
 elsif p_action='sell' then
  if buildings<=0 then raise exception 'No building to sell'; end if; value:=(a->>'buildingCost')::integer/2;
  p:=jsonb_set(p,'{money}',to_jsonb((p->>'money')::integer+value)); d:=jsonb_set(d,'{buildings}',to_jsonb(buildings-1));
 elsif p_action='mortgage' then
  if (d->>'mortgaged')::boolean then raise exception 'Already mortgaged'; end if; value:=(a->>'mortgage')::integer+buildings*coalesce((a->>'buildingCost')::integer,0)/2;
  p:=jsonb_set(p,'{money}',to_jsonb((p->>'money')::integer+value)); d:=d||jsonb_build_object('mortgaged',true,'buildings',0);
 elsif p_action='unmortgage' then
  value:=ceil((a->>'mortgage')::integer*1.1); if not (d->>'mortgaged')::boolean or (p->>'money')::integer<value then raise exception 'Cannot unmortgage'; end if;
  p:=jsonb_set(p,'{money}',to_jsonb((p->>'money')::integer-value)); d:=jsonb_set(d,'{mortgaged}','false'::jsonb);
 else raise exception 'Unknown property action'; end if;
 if (p->>'money')::integer>=0 then p:=p-'debt'; end if;
 update monopoly_rooms set players=jsonb_set(r.players,array[idx::text],p),ownership=jsonb_set(r.ownership,array[p_space::text],d),
  event_log=monopoly_append_event(r.event_log,p->>'name',p_action||' on '||(a->>'name'),case when p_action='build' then 'build' else 'money' end)
 where id=r.id returning * into r; return r;
end $$;
