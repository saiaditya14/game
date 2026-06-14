create extension if not exists pgcrypto;

alter table public.monopoly_rooms
  add column if not exists rules jsonb not null default '{"startingCash":1500,"auctions":true,"doubleUndevelopedRent":true,"freeParkJackpot":true,"targetCashEnabled":false,"targetCash":5000}'::jsonb,
  add column if not exists turn_phase text not null default 'lobby',
  add column if not exists pending_action jsonb,
  add column if not exists consecutive_doubles integer not null default 0,
  add column if not exists round_number integer not null default 1,
  add column if not exists turns_completed integer not null default 0,
  add column if not exists ownership jsonb not null default '{}'::jsonb,
  add column if not exists auction jsonb,
  add column if not exists trades jsonb not null default '[]'::jsonb,
  add column if not exists tax_ledger jsonb not null default '[]'::jsonb,
  add column if not exists winner_id uuid,
  add column if not exists end_reason text;

alter table public.monopoly_rooms drop constraint if exists monopoly_rooms_status_check;
alter table public.monopoly_rooms
  add constraint monopoly_rooms_status_check check (status in ('waiting', 'setup', 'playing', 'finished', 'aborted'));

create or replace function public.monopoly_asset(p_space integer)
returns jsonb
language sql immutable
set search_path = public
as $$
  select case p_space
    when 1 then '{"name":"Snarl Swamp","type":"property","price":60,"mortgage":30,"buildingCost":50,"group":[1,3],"rents":[2,10,30,90,160,250]}'::jsonb
    when 3 then '{"name":"Rotroot Fen","type":"property","price":70,"mortgage":35,"buildingCost":50,"group":[1,3],"rents":[3,15,45,135,240,350]}'::jsonb
    when 5 then '{"name":"Ember Peak","type":"property","price":90,"mortgage":45,"buildingCost":50,"group":[5,6,8],"rents":[5,25,75,225,350,500]}'::jsonb
    when 6 then '{"name":"Dragon Valley","type":"property","price":90,"mortgage":45,"buildingCost":50,"group":[5,6,8],"rents":[5,25,75,225,350,500]}'::jsonb
    when 7 then '{"name":"Fire Portal","type":"portal","price":200,"mortgage":100}'::jsonb
    when 8 then '{"name":"Lava Roost","type":"property","price":100,"mortgage":50,"buildingCost":50,"group":[5,6,8],"rents":[6,30,90,270,400,550]}'::jsonb
    when 10 then '{"name":"Scrapy Hollow","type":"property","price":120,"mortgage":60,"buildingCost":50,"group":[10,11,13],"rents":[8,40,100,300,450,600]}'::jsonb
    when 11 then '{"name":"Goblin Camp","type":"property","price":120,"mortgage":60,"buildingCost":50,"group":[10,11,13],"rents":[8,40,100,300,450,600]}'::jsonb
    when 12 then '{"name":"Ruby","type":"crystal","price":200,"mortgage":100}'::jsonb
    when 13 then '{"name":"Grim Burrows","type":"property","price":130,"mortgage":65,"buildingCost":50,"group":[10,11,13],"rents":[9,45,125,375,500,700]}'::jsonb
    when 15 then '{"name":"Moon Shine","type":"property","price":150,"mortgage":75,"buildingCost":100,"group":[15,16,18],"rents":[11,55,160,475,650,800]}'::jsonb
    when 16 then '{"name":"Starlit Bay","type":"property","price":150,"mortgage":75,"buildingCost":100,"group":[15,16,18],"rents":[11,55,160,475,650,800]}'::jsonb
    when 17 then '{"name":"Mana Wells","type":"utility","price":150,"mortgage":75}'::jsonb
    when 18 then '{"name":"Dew Hollow","type":"property","price":160,"mortgage":80,"buildingCost":100,"group":[15,16,18],"rents":[12,60,180,500,700,900]}'::jsonb
    when 19 then '{"name":"Iron Mine","type":"property","price":180,"mortgage":90,"buildingCost":100,"group":[19,20,22],"rents":[14,70,200,550,750,950]}'::jsonb
    when 20 then '{"name":"Stone Hold","type":"property","price":180,"mortgage":90,"buildingCost":100,"group":[19,20,22],"rents":[14,70,200,550,750,950]}'::jsonb
    when 21 then '{"name":"Water Portal","type":"portal","price":200,"mortgage":100}'::jsonb
    when 22 then '{"name":"Mithril Pass","type":"property","price":190,"mortgage":95,"buildingCost":100,"group":[19,20,22],"rents":[15,75,210,575,775,975]}'::jsonb
    when 24 then '{"name":"Dark Forest","type":"property","price":210,"mortgage":105,"buildingCost":150,"group":[24,25,27],"rents":[17,85,240,650,840,1025]}'::jsonb
    when 25 then '{"name":"Thorny Grove","type":"property","price":210,"mortgage":105,"buildingCost":150,"group":[24,25,27],"rents":[17,85,240,650,840,1025]}'::jsonb
    when 26 then '{"name":"Emerald","type":"crystal","price":200,"mortgage":100}'::jsonb
    when 27 then '{"name":"Misty Woods","type":"property","price":220,"mortgage":110,"buildingCost":150,"group":[24,25,27],"rents":[18,90,250,700,875,1050]}'::jsonb
    when 29 then '{"name":"Sandy Camp","type":"property","price":240,"mortgage":120,"buildingCost":150,"group":[29,31,32],"rents":[20,100,300,750,925,1100]}'::jsonb
    when 31 then '{"name":"Sunfire Dunes","type":"property","price":240,"mortgage":120,"buildingCost":150,"group":[29,31,32],"rents":[20,100,300,750,925,1100]}'::jsonb
    when 32 then '{"name":"White Mirage","type":"property","price":250,"mortgage":125,"buildingCost":150,"group":[29,31,32],"rents":[21,105,315,775,950,1125]}'::jsonb
    when 33 then '{"name":"Ancient Runes","type":"utility","price":150,"mortgage":75}'::jsonb
    when 34 then '{"name":"Winter Ridge","type":"property","price":270,"mortgage":135,"buildingCost":150,"group":[34,36,37],"rents":[23,115,345,825,1000,1175]}'::jsonb
    when 35 then '{"name":"Air Portal","type":"portal","price":200,"mortgage":100}'::jsonb
    when 36 then '{"name":"Glacier Castle","type":"property","price":270,"mortgage":135,"buildingCost":150,"group":[34,36,37],"rents":[23,115,345,825,1000,1175]}'::jsonb
    when 37 then '{"name":"Icevein Peak","type":"property","price":280,"mortgage":140,"buildingCost":150,"group":[34,36,37],"rents":[24,120,360,850,1025,1200]}'::jsonb
    when 38 then '{"name":"Faerie Haven","type":"property","price":300,"mortgage":150,"buildingCost":200,"group":[38,40,41],"rents":[26,130,390,900,1100,1275]}'::jsonb
    when 39 then '{"name":"Topaz","type":"crystal","price":200,"mortgage":100}'::jsonb
    when 40 then '{"name":"Elven Court","type":"property","price":300,"mortgage":150,"buildingCost":200,"group":[38,40,41],"rents":[26,130,390,900,1100,1275]}'::jsonb
    when 41 then '{"name":"Hidden Vale","type":"property","price":310,"mortgage":155,"buildingCost":200,"group":[38,40,41],"rents":[27,140,420,950,1150,1350]}'::jsonb
    when 43 then '{"name":"Dusk Gate","type":"property","price":330,"mortgage":165,"buildingCost":200,"group":[43,44,46],"rents":[29,160,480,1050,1250,1450]}'::jsonb
    when 44 then '{"name":"Shadow Reach","type":"property","price":330,"mortgage":165,"buildingCost":200,"group":[43,44,46],"rents":[29,160,480,1050,1250,1450]}'::jsonb
    when 45 then '{"name":"Arcane Nexus","type":"utility","price":150,"mortgage":75}'::jsonb
    when 46 then '{"name":"Black Hollow","type":"property","price":340,"mortgage":170,"buildingCost":200,"group":[43,44,46],"rents":[31,165,495,1075,1275,1475]}'::jsonb
    when 48 then '{"name":"Ashy Coast","type":"property","price":360,"mortgage":180,"buildingCost":200,"group":[48,50,51],"rents":[38,180,520,1150,1350,1550]}'::jsonb
    when 49 then '{"name":"Earth Portal","type":"portal","price":200,"mortgage":100}'::jsonb
    when 50 then '{"name":"Ember Isle","type":"property","price":360,"mortgage":180,"buildingCost":200,"group":[48,50,51],"rents":[38,180,520,1150,1350,1550]}'::jsonb
    when 51 then '{"name":"Sunlit Bay","type":"property","price":370,"mortgage":185,"buildingCost":200,"group":[48,50,51],"rents":[42,190,550,1200,1450,1650]}'::jsonb
    when 53 then '{"name":"Heavens Keep","type":"property","price":390,"mortgage":195,"buildingCost":200,"group":[53,55],"rents":[45,195,580,1300,1550,1800]}'::jsonb
    when 55 then '{"name":"Sky Palace","type":"property","price":400,"mortgage":200,"buildingCost":200,"group":[53,55],"rents":[50,200,600,1400,1700,2000]}'::jsonb
    else null end
$$;

create or replace function public.monopoly_empty_ownership()
returns jsonb language sql immutable as $$
  select coalesce(jsonb_object_agg(id::text, '{"ownerId":null,"mortgaged":false,"buildings":0}'::jsonb), '{}'::jsonb)
  from unnest(array[1,3,5,6,7,8,10,11,12,13,15,16,17,18,19,20,21,22,24,25,26,27,29,31,32,33,34,35,36,37,38,39,40,41,43,44,45,46,48,49,50,51,53,55]) id
$$;

create or replace function public.monopoly_room_member(p_players jsonb, p_user uuid)
returns boolean language sql stable as $$
  select exists(select 1 from jsonb_array_elements(coalesce(p_players, '[]')) p where p->>'id' = p_user::text)
$$;

drop policy if exists "Monopoly rooms can be read by clients" on public.monopoly_rooms;
drop policy if exists "Monopoly rooms can be created by clients" on public.monopoly_rooms;
drop policy if exists "Monopoly rooms can be updated by clients" on public.monopoly_rooms;
drop policy if exists "Authenticated Monopoly members can read rooms" on public.monopoly_rooms;
create policy "Authenticated Monopoly members can read rooms"
on public.monopoly_rooms for select to authenticated
using (public.monopoly_room_member(players, auth.uid()));

revoke insert, update, delete on public.monopoly_rooms from anon, authenticated;
grant select on public.monopoly_rooms to authenticated;

create or replace function public.monopoly_append_event(p_events jsonb, p_player text, p_action text, p_kind text)
returns jsonb language sql volatile as $$
  select (jsonb_build_array(jsonb_build_object(
    'id', gen_random_uuid(), 'player', p_player, 'action', p_action, 'kind', p_kind, 'at', now()
  )) || coalesce(p_events, '[]'::jsonb)) - 24
$$;

create or replace function public.monopoly_create_room(p_code text)
returns public.monopoly_rooms
language plpgsql security definer
set search_path = public
as $$
declare r public.monopoly_rooms; uid uuid := auth.uid(); player jsonb;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  if p_code !~ '^[A-Z0-9]{4,6}$' then raise exception 'Invalid room code'; end if;
  player := jsonb_build_object('id', uid, 'name', 'Player 1', 'money', 1500, 'position', 0,
    'color', '#f9a8d4', 'icon', 'heart', 'active', true, 'bankrupt', false,
    'inTimeOut', false, 'timeOutAttempts', 0, 'joinedAt', now());
  insert into monopoly_rooms(code, host_id, players, ownership, turn_phase, event_log)
  values(p_code, uid::text, jsonb_build_array(player), monopoly_empty_ownership(), 'lobby',
    monopoly_append_event('[]', 'Player 1', 'created the room', 'card'))
  returning * into r;
  return r;
end $$;

create or replace function public.monopoly_join_room(p_code text)
returns public.monopoly_rooms
language plpgsql security definer
set search_path = public
as $$
declare r public.monopoly_rooms; uid uuid := auth.uid(); n integer; colors text[] := array['#f9a8d4','#a7e8b2','#aee9ff','#d8c4ff','#ffe66d','#ffc48f','#b9b6ff','#ffb48f'];
  icons text[] := array['heart','crown','sparkles','wand','gem','user','gift','heart']; player jsonb;
begin
  if uid is null then raise exception 'Authentication required'; end if;
  select * into r from monopoly_rooms where code = upper(trim(p_code)) for update;
  if not found then raise exception 'Room not found'; end if;
  if monopoly_room_member(r.players, uid) then return r; end if;
  if r.status <> 'waiting' then raise exception 'Quest already started'; end if;
  n := jsonb_array_length(r.players);
  if n >= 8 then raise exception 'Room is full'; end if;
  player := jsonb_build_object('id', uid, 'name', 'Player ' || (n + 1), 'money', 1500, 'position', 0,
    'color', colors[n + 1], 'icon', icons[n + 1], 'active', true, 'bankrupt', false,
    'inTimeOut', false, 'timeOutAttempts', 0, 'joinedAt', now());
  update monopoly_rooms set players = r.players || jsonb_build_array(player),
    event_log = monopoly_append_event(r.event_log, player->>'name', 'joined the room', 'card')
  where id = r.id returning * into r;
  return r;
end $$;

create or replace function public.monopoly_start_setup(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path = public as $$
declare r public.monopoly_rooms;
begin
  select * into r from monopoly_rooms where id=p_room_id for update;
  if r.host_id <> auth.uid()::text or r.status <> 'waiting' then raise exception 'Only the host can start setup'; end if;
  update monopoly_rooms set status='setup', turn_phase='setup' where id=r.id returning * into r; return r;
end $$;

create or replace function public.monopoly_configure(p_room_id uuid, p_rules jsonb)
returns public.monopoly_rooms language plpgsql security definer set search_path = public as $$
declare r public.monopoly_rooms; cash integer; target integer;
begin
  select * into r from monopoly_rooms where id=p_room_id for update;
  if r.host_id <> auth.uid()::text or r.status <> 'setup' then raise exception 'Only the host can configure setup'; end if;
  cash := coalesce((p_rules->>'startingCash')::integer, 1500);
  target := coalesce((p_rules->>'targetCash')::integer, 5000);
  if cash <= 0 or target <= 0 then raise exception 'Cash settings must be positive'; end if;
  update monopoly_rooms set rules=jsonb_build_object(
    'startingCash',cash,'auctions',coalesce((p_rules->>'auctions')::boolean,true),
    'doubleUndevelopedRent',coalesce((p_rules->>'doubleUndevelopedRent')::boolean,true),
    'freeParkJackpot',coalesce((p_rules->>'freeParkJackpot')::boolean,true),
    'targetCashEnabled',coalesce((p_rules->>'targetCashEnabled')::boolean,false),'targetCash',target)
  where id=r.id returning * into r; return r;
end $$;

create or replace function public.monopoly_begin(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path = public as $$
declare r public.monopoly_rooms; next_players jsonb;
begin
  select * into r from monopoly_rooms where id=p_room_id for update;
  if r.host_id <> auth.uid()::text or r.status <> 'setup' then raise exception 'Only the host can begin'; end if;
  select jsonb_agg(p || jsonb_build_object('money',(r.rules->>'startingCash')::integer,'position',0,'active',true,
    'bankrupt',false,'inTimeOut',false,'timeOutAttempts',0,'debt',null)) into next_players from jsonb_array_elements(r.players) p;
  update monopoly_rooms set players=next_players,status='playing',turn_phase='awaiting_roll',
    current_player_index=0,started_at=now(),ownership=monopoly_empty_ownership(),
    event_log=monopoly_append_event(r.event_log,'Quest','began around GO','money')
  where id=r.id returning * into r; return r;
end $$;

create or replace function public.monopoly_rent(p_room public.monopoly_rooms, p_space integer, p_roll integer)
returns integer language plpgsql stable set search_path = public as $$
declare a jsonb := monopoly_asset(p_space); d jsonb := p_room.ownership->(p_space::text); owner text := d->>'ownerId';
  count_owned integer; buildings integer := coalesce((d->>'buildings')::integer,0); base integer; complete boolean;
begin
  if a is null or owner is null or coalesce((d->>'mortgaged')::boolean,false) then return 0; end if;
  if a->>'type'='portal' then
    select count(*) into count_owned from jsonb_each(p_room.ownership) e where e.value->>'ownerId'=owner
      and not coalesce((e.value->>'mortgaged')::boolean,false) and monopoly_asset(e.key::integer)->>'type'='portal';
    return (array[0,25,50,100,200])[least(count_owned,4)+1];
  elsif a->>'type'='utility' then
    select count(*) into count_owned from jsonb_each(p_room.ownership) e where e.value->>'ownerId'=owner
      and not coalesce((e.value->>'mortgaged')::boolean,false) and monopoly_asset(e.key::integer)->>'type'='utility';
    return p_roll * (array[0,4,10,15])[least(count_owned,3)+1];
  end if;
  base := (a->'rents'->buildings)::integer;
  select bool_and(p_room.ownership->(v.value #>> '{}')->>'ownerId'=owner) into complete from jsonb_array_elements(a->'group') v;
  if buildings=0 and complete and (p_room.rules->>'doubleUndevelopedRent')::boolean then base := base*2; end if;
  select count(*) into count_owned from jsonb_each(p_room.ownership) e where e.value->>'ownerId'=owner
    and not coalesce((e.value->>'mortgaged')::boolean,false) and monopoly_asset(e.key::integer)->>'type'='crystal';
  return base + (array[0,10,25,65])[least(count_owned,3)+1];
end $$;

create or replace function public.monopoly_roll(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path = public as $$
declare r public.monopoly_rooms; p jsonb; idx integer; d1 integer; d2 integer; total integer; old_pos integer; pos integer;
  is_double boolean; doubles integer; a jsonb; deed jsonb; owner text; rent integer; tax integer; creditor text; pot integer; next_players jsonb;
begin
  select * into r from monopoly_rooms where id=p_room_id for update;
  if r.status<>'playing' or r.turn_phase<>'awaiting_roll' or r.auction is not null then raise exception 'Roll is not available'; end if;
  idx:=r.current_player_index; p:=r.players->idx;
  if p->>'id'<>auth.uid()::text then raise exception 'Not your turn'; end if;
  d1:=floor(random()*8+1); d2:=floor(random()*8+1); total:=d1+d2; is_double:=d1=d2;
  doubles:=case when is_double then r.consecutive_doubles+1 else 0 end;
  if (p->>'inTimeOut')::boolean then
    if not is_double and (p->>'timeOutAttempts')::integer < 2 then
      p:=jsonb_set(p,'{timeOutAttempts}',to_jsonb((p->>'timeOutAttempts')::integer+1));
      update monopoly_rooms set players=jsonb_set(r.players,array[idx::text],p),latest_roll=jsonb_build_object('id',gen_random_uuid(),'playerId',p->>'id','playerName',p->>'name','dice',jsonb_build_array(d1,d2),'total',total,'from',14,'to',14,'at',now()),
        turn_phase='awaiting_end_turn',pending_action=jsonb_build_object('type','time_out_failed','spaceId',14),consecutive_doubles=0 where id=r.id returning * into r; return r;
    end if;
    p:=p||jsonb_build_object('inTimeOut',false,'timeOutAttempts',0);
  end if;
  old_pos:=(p->>'position')::integer;
  if doubles>=3 then
    p:=p||jsonb_build_object('position',14,'inTimeOut',true,'timeOutAttempts',0);
    update monopoly_rooms set players=jsonb_set(r.players,array[idx::text],p),consecutive_doubles=0,
      latest_roll=jsonb_build_object('id',gen_random_uuid(),'playerId',p->>'id','playerName',p->>'name','dice',jsonb_build_array(d1,d2),'total',total,'from',old_pos,'to',14,'at',now()),
      pending_action=jsonb_build_object('type','time_out','spaceId',14),turn_phase='awaiting_end_turn',
      event_log=monopoly_append_event(r.event_log,p->>'name','rolled three doubles and went to Time Out','tax')
    where id=r.id returning * into r; return r;
  end if;
  pos:=(old_pos+total)%56;
  if old_pos+total>=56 then p:=jsonb_set(p,'{money}',to_jsonb((p->>'money')::integer+200)); end if;
  if pos=42 then pos:=14; p:=p||jsonb_build_object('inTimeOut',true,'timeOutAttempts',0); doubles:=0; end if;
  p:=jsonb_set(p,'{position}',to_jsonb(pos)); a:=monopoly_asset(pos); deed:=r.ownership->pos::text; owner:=deed->>'ownerId';
  r.players:=jsonb_set(r.players,array[idx::text],p);
  r.latest_roll:=jsonb_build_object('id',gen_random_uuid(),'playerId',p->>'id','playerName',p->>'name','dice',jsonb_build_array(d1,d2),'total',total,'from',old_pos,'to',pos,'at',now(),'isDouble',is_double);
  r.pending_action:=jsonb_build_object('type','landed','spaceId',pos,'rollTotal',total);
  r.turn_phase:='awaiting_end_turn';
  if a is not null and owner is null then r.pending_action:=jsonb_build_object('type','purchase','spaceId',pos,'rollTotal',total);
  elsif a is not null and owner<>p->>'id' then
    rent:=monopoly_rent(r,pos,total);
    if rent>0 then
      creditor:=owner; p:=r.players->idx;
      p:=jsonb_set(p,'{money}',to_jsonb((p->>'money')::integer-rent));
      if (p->>'money')::integer<0 then p:=p||jsonb_build_object('debt',jsonb_build_object('amount',-(p->>'money')::integer,'creditorId',creditor,'reason','rent')); end if;
      r.players:=jsonb_set(r.players,array[idx::text],p);
      select jsonb_agg(case when q->>'id'=creditor then jsonb_set(q,'{money}',to_jsonb((q->>'money')::integer+rent)) else q end) into next_players from jsonb_array_elements(r.players) q;
      r.players:=next_players;
      r.pending_action:=jsonb_build_object('type','rent','spaceId',pos,'amount',rent,'creditorId',creditor);
    end if;
  elsif pos in (4,52) then
    p:=r.players->idx; tax:=case when pos=4 then least(200,floor((p->>'money')::integer*.1)) else 100 end;
    p:=jsonb_set(p,'{money}',to_jsonb((p->>'money')::integer-tax));
    if (p->>'money')::integer<0 then p:=p||jsonb_build_object('debt',jsonb_build_object('amount',-(p->>'money')::integer,'creditorId',null,'reason','tax')); end if;
    r.players:=jsonb_set(r.players,array[idx::text],p); r.tax_ledger:=r.tax_ledger||jsonb_build_array(jsonb_build_object('round',r.round_number,'amount',tax));
    r.pending_action:=jsonb_build_object('type','tax','spaceId',pos,'amount',tax);
  elsif pos=28 and (r.rules->>'freeParkJackpot')::boolean then
    select coalesce(sum((e->>'amount')::integer),0) into pot from jsonb_array_elements(r.tax_ledger) e where (e->>'round')::integer>r.round_number-5;
    p:=r.players->idx; p:=jsonb_set(p,'{money}',to_jsonb((p->>'money')::integer+pot)); r.players:=jsonb_set(r.players,array[idx::text],p);
    r.tax_ledger:='[]'; r.pending_action:=jsonb_build_object('type','free_park','spaceId',28,'amount',pot);
  end if;
  update monopoly_rooms set players=r.players,latest_roll=r.latest_roll,pending_action=r.pending_action,turn_phase=r.turn_phase,
    consecutive_doubles=doubles,tax_ledger=r.tax_ledger,event_log=monopoly_append_event(r.event_log,p->>'name','rolled '||total||' and landed on space '||(pos+1),'visit')
  where id=r.id returning * into r; return r;
end $$;

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

create or replace function public.monopoly_decline(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; p jsonb; sid integer; bidders jsonb;
begin
 select * into r from monopoly_rooms where id=p_room_id for update; p:=r.players->r.current_player_index;
 if p->>'id'<>auth.uid()::text or r.pending_action->>'type'<>'purchase' then raise exception 'Decline unavailable'; end if;
 sid:=(r.pending_action->>'spaceId')::integer;
 if (r.rules->>'auctions')::boolean then
   select jsonb_agg(jsonb_build_object('id',q->>'id','active',true)) into bidders from jsonb_array_elements(r.players) q where (q->>'active')::boolean;
   update monopoly_rooms set auction=jsonb_build_object('spaceId',sid,'bidders',bidders,'bid',0,'highBidderId',null,'bidderIndex',0),
     pending_action=jsonb_build_object('type','auction','spaceId',sid) where id=r.id returning * into r;
 else update monopoly_rooms set pending_action=jsonb_build_object('type','declined','spaceId',sid) where id=r.id returning * into r; end if;
 return r;
end $$;

create or replace function public.monopoly_auction(p_room_id uuid, p_bid integer default null)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; auct jsonb; bidders jsonb; current jsonb; active_count integer; next_i integer; p jsonb; sid integer; winner text; amount integer; next_players jsonb;
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
 winner:=auct->>'highBidderId'; amount:=coalesce((auct->>'bid')::integer,0); sid:=(auct->>'spaceId')::integer;
 if active_count<=1 and winner is not null then
   select jsonb_agg(case when q->>'id'=winner then jsonb_set(q,'{money}',to_jsonb((q->>'money')::integer-amount)) else q end) into next_players from jsonb_array_elements(r.players) q;
   r.players:=next_players;
   update monopoly_rooms set players=r.players,ownership=jsonb_set(r.ownership,array[sid::text],(r.ownership->(sid::text))||jsonb_build_object('ownerId',winner)),
     auction=null,pending_action=jsonb_build_object('type','auction_won','spaceId',sid,'amount',amount) where id=r.id returning * into r; return r;
 elsif active_count=0 then update monopoly_rooms set auction=null,pending_action=jsonb_build_object('type','declined','spaceId',sid) where id=r.id returning * into r; return r; end if;
 next_i:=((auct->>'bidderIndex')::integer+1)%jsonb_array_length(bidders);
 while not (bidders->next_i->>'active')::boolean loop next_i:=(next_i+1)%jsonb_array_length(bidders); end loop;
 auct:=jsonb_set(auct,'{bidderIndex}',to_jsonb(next_i));
 update monopoly_rooms set auction=auct where id=r.id returning * into r; return r;
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

create or replace function public.monopoly_time_out(p_room_id uuid, p_action text)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; idx integer; p jsonb;
begin
 select * into r from monopoly_rooms where id=p_room_id for update; idx:=r.current_player_index; p:=r.players->idx;
 if p->>'id'<>auth.uid()::text or not (p->>'inTimeOut')::boolean or r.turn_phase<>'awaiting_roll' then raise exception 'Time Out action unavailable'; end if;
 if p_action<>'pay' or (p->>'money')::integer<50 then raise exception 'Paying $50 is the available choice'; end if;
 p:=p||jsonb_build_object('money',(p->>'money')::integer-50,'inTimeOut',false,'timeOutAttempts',0);
 update monopoly_rooms set players=jsonb_set(r.players,array[idx::text],p),event_log=monopoly_append_event(r.event_log,p->>'name','paid $50 to leave Time Out','tax')
 where id=r.id returning * into r; return r;
end $$;

create or replace function public.monopoly_trade(p_room_id uuid, p_action text, p_trade jsonb)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; t jsonb; tid text; proposer text; recipient text; give_cash integer; take_cash integer; sid text; d jsonb; next_players jsonb; next_trades jsonb;
begin
 select * into r from monopoly_rooms where id=p_room_id for update;
 if not monopoly_room_member(r.players,auth.uid()) then raise exception 'Not a room member'; end if;
 if p_action='create' then
  proposer:=auth.uid()::text; recipient:=p_trade->>'recipientId';
  if recipient=proposer or not monopoly_room_member(r.players,recipient::uuid) then raise exception 'Invalid recipient'; end if;
  give_cash:=greatest(0,coalesce((p_trade->>'giveCash')::integer,0)); take_cash:=greatest(0,coalesce((p_trade->>'takeCash')::integer,0));
  for sid in select jsonb_array_elements_text(coalesce(p_trade->'giveProperties','[]')) loop
    d:=r.ownership->sid; if d->>'ownerId'<>proposer or coalesce((d->>'buildings')::integer,0)>0 then raise exception 'Invalid offered property'; end if;
  end loop;
  for sid in select jsonb_array_elements_text(coalesce(p_trade->'takeProperties','[]')) loop
    d:=r.ownership->sid; if d->>'ownerId'<>recipient or coalesce((d->>'buildings')::integer,0)>0 then raise exception 'Invalid requested property'; end if;
  end loop;
  t:=p_trade||jsonb_build_object('id',gen_random_uuid(),'proposerId',proposer,'status','pending','createdAt',now());
  update monopoly_rooms set trades=jsonb_build_array(t)||r.trades where id=r.id returning * into r; return r;
 end if;
 tid:=p_trade->>'id'; select x into t from jsonb_array_elements(r.trades) x where x->>'id'=tid;
 if t is null or t->>'status'<>'pending' then raise exception 'Trade unavailable'; end if;
 if p_action='reject' then
  if auth.uid()::text<>t->>'recipientId' then raise exception 'Only recipient may reject'; end if;
  select jsonb_agg(case when x->>'id'=tid then x||'{"status":"rejected"}' else x end) into next_trades from jsonb_array_elements(r.trades) x;
  r.trades:=next_trades;
 elsif p_action='accept' then
  proposer:=t->>'proposerId'; recipient:=t->>'recipientId'; if auth.uid()::text<>recipient then raise exception 'Only recipient may accept'; end if;
  give_cash:=greatest(0,coalesce((t->>'giveCash')::integer,0)); take_cash:=greatest(0,coalesce((t->>'takeCash')::integer,0));
  if not exists(select 1 from jsonb_array_elements(r.players) q where q->>'id'=proposer and (q->>'money')::integer>=give_cash)
    or not exists(select 1 from jsonb_array_elements(r.players) q where q->>'id'=recipient and (q->>'money')::integer>=take_cash) then raise exception 'Trade cash unavailable'; end if;
  select jsonb_agg(case when q->>'id'=proposer then jsonb_set(q,'{money}',to_jsonb((q->>'money')::integer-give_cash+take_cash))
    when q->>'id'=recipient then jsonb_set(q,'{money}',to_jsonb((q->>'money')::integer-take_cash+give_cash)) else q end) into next_players from jsonb_array_elements(r.players) q;
  r.players:=next_players;
  for sid in select jsonb_array_elements_text(coalesce(t->'giveProperties','[]')) loop d:=r.ownership->sid; if d->>'ownerId'<>proposer or coalesce((d->>'buildings')::integer,0)>0 then raise exception 'Offer changed'; end if; r.ownership:=jsonb_set(r.ownership,array[sid],d||jsonb_build_object('ownerId',recipient)); end loop;
  for sid in select jsonb_array_elements_text(coalesce(t->'takeProperties','[]')) loop d:=r.ownership->sid; if d->>'ownerId'<>recipient or coalesce((d->>'buildings')::integer,0)>0 then raise exception 'Request changed'; end if; r.ownership:=jsonb_set(r.ownership,array[sid],d||jsonb_build_object('ownerId',proposer)); end loop;
  select jsonb_agg(case when x->>'id'=tid then x||'{"status":"accepted"}' else x end) into next_trades from jsonb_array_elements(r.trades) x;
  r.trades:=next_trades;
 else raise exception 'Unknown trade action'; end if;
 update monopoly_rooms set players=r.players,ownership=r.ownership,trades=r.trades where id=r.id returning * into r; return r;
end $$;

create or replace function public.monopoly_bankrupt(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; p jsonb; creditor text; sid text; d jsonb;
begin
 select * into r from monopoly_rooms where id=p_room_id for update; p:=r.players->r.current_player_index;
 if p->>'id'<>auth.uid()::text or p->'debt' is null then raise exception 'Bankruptcy unavailable'; end if; creditor:=p->'debt'->>'creditorId';
 for sid,d in select key,value from jsonb_each(r.ownership) loop if d->>'ownerId'=auth.uid()::text then r.ownership:=jsonb_set(r.ownership,array[sid],d||jsonb_build_object('ownerId',creditor,'buildings',0)); end if; end loop;
 r.players := (select jsonb_agg(case when q->>'id'=auth.uid()::text then q||jsonb_build_object('money',0,'active',false,'bankrupt',true,'debt',null)
   when creditor is not null and q->>'id'=creditor then jsonb_set(q,'{money}',to_jsonb((q->>'money')::integer+greatest(0,(p->>'money')::integer))) else q end)
   from jsonb_array_elements(r.players) q);
 update monopoly_rooms set players=r.players,ownership=r.ownership,pending_action=jsonb_build_object('type','bankrupt') where id=r.id returning * into r; return r;
end $$;

create or replace function public.monopoly_end_turn(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; p jsonb; next_i integer; active_count integer; completed integer; next_round integer; winner text;
begin
 select * into r from monopoly_rooms where id=p_room_id for update; p:=r.players->r.current_player_index;
 if p->>'id'<>auth.uid()::text or r.turn_phase<>'awaiting_end_turn' or r.auction is not null then raise exception 'End Turn unavailable'; end if;
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

create or replace function public.monopoly_forfeit(p_room_id uuid)
returns public.monopoly_rooms language plpgsql security definer set search_path=public as $$
declare r public.monopoly_rooms; p jsonb; sid text; d jsonb; remaining integer; next_i integer; next_players jsonb; next_host text;
begin
 select * into r from monopoly_rooms where id=p_room_id for update;
 if not monopoly_room_member(r.players,auth.uid()) then raise exception 'Not a room member'; end if;
 if r.status='waiting' or r.status='setup' then
  select coalesce(jsonb_agg(q),'[]') into next_players from jsonb_array_elements(r.players) q where q->>'id'<>auth.uid()::text;
  r.players:=next_players;
 else
  select jsonb_agg(case when q->>'id'=auth.uid()::text then q||jsonb_build_object('money',0,'active',false,'bankrupt',true) else q end) into next_players from jsonb_array_elements(r.players) q;
  r.players:=next_players;
  for sid,d in select key,value from jsonb_each(r.ownership) loop if d->>'ownerId'=auth.uid()::text then r.ownership:=jsonb_set(r.ownership,array[sid],d||jsonb_build_object('ownerId',null,'mortgaged',false,'buildings',0)); end if; end loop;
 end if;
 select count(*) into remaining from jsonb_array_elements(r.players) q where coalesce((q->>'active')::boolean,true);
 if r.host_id=auth.uid()::text then select q->>'id' into next_host from jsonb_array_elements(r.players) q where q->>'id'<>auth.uid()::text limit 1; r.host_id:=coalesce(next_host,''); end if;
 update monopoly_rooms set players=r.players,ownership=r.ownership,host_id=coalesce(r.host_id,''),status=case when remaining=0 then 'aborted' else r.status end where id=r.id returning * into r; return r;
end $$;

grant execute on function public.monopoly_create_room(text) to authenticated;
grant execute on function public.monopoly_join_room(text) to authenticated;
grant execute on function public.monopoly_start_setup(uuid) to authenticated;
grant execute on function public.monopoly_configure(uuid,jsonb) to authenticated;
grant execute on function public.monopoly_begin(uuid) to authenticated;
grant execute on function public.monopoly_roll(uuid) to authenticated;
grant execute on function public.monopoly_buy(uuid) to authenticated;
grant execute on function public.monopoly_decline(uuid) to authenticated;
grant execute on function public.monopoly_auction(uuid,integer) to authenticated;
grant execute on function public.monopoly_property_action(uuid,text,integer) to authenticated;
grant execute on function public.monopoly_time_out(uuid,text) to authenticated;
grant execute on function public.monopoly_trade(uuid,text,jsonb) to authenticated;
grant execute on function public.monopoly_bankrupt(uuid) to authenticated;
grant execute on function public.monopoly_end_turn(uuid) to authenticated;
grant execute on function public.monopoly_forfeit(uuid) to authenticated;
