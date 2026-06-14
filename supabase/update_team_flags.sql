-- One-time cleanup: resolve World Cup team flags after switching to football-data.
--
-- Run in Supabase SQL Editor. This only updates team display metadata:
-- - canonical team names for common provider aliases
-- - short_name when a known FIFA/TLA code is available
-- - flag emoji
--
-- It does not touch fixtures, predictions, scores, or scoring logic.

begin;

with team_display(name_key, canonical_name, short_name, flag) as (
  values
    ('algeria', 'Algeria', 'ALG', '🇩🇿'),
    ('argentina', 'Argentina', 'ARG', '🇦🇷'),
    ('australia', 'Australia', 'AUS', '🇦🇺'),
    ('austria', 'Austria', 'AUT', '🇦🇹'),
    ('belgium', 'Belgium', 'BEL', '🇧🇪'),
    ('bosniaandherzegovina', 'Bosnia and Herzegovina', 'BIH', '🇧🇦'),
    ('bosniaherzegovina', 'Bosnia and Herzegovina', 'BIH', '🇧🇦'),
    ('brazil', 'Brazil', 'BRA', '🇧🇷'),
    ('canada', 'Canada', 'CAN', '🇨🇦'),
    ('capeverde', 'Cape Verde', 'CPV', '🇨🇻'),
    ('capeverdeislands', 'Cape Verde', 'CPV', '🇨🇻'),
    ('colombia', 'Colombia', 'COL', '🇨🇴'),
    ('congodr', 'Congo DR', 'COD', '🇨🇩'),
    ('democraticrepublicofcongo', 'Congo DR', 'COD', '🇨🇩'),
    ('drcongo', 'Congo DR', 'COD', '🇨🇩'),
    ('croatia', 'Croatia', 'CRO', '🇭🇷'),
    ('curacao', 'Curacao', 'CUW', '🇨🇼'),
    ('curaçao', 'Curacao', 'CUW', '🇨🇼'),
    ('czechia', 'Czechia', 'CZE', '🇨🇿'),
    ('czechrepublic', 'Czechia', 'CZE', '🇨🇿'),
    ('ecuador', 'Ecuador', 'ECU', '🇪🇨'),
    ('egypt', 'Egypt', 'EGY', '🇪🇬'),
    ('england', 'England', 'ENG', '🏴'),
    ('france', 'France', 'FRA', '🇫🇷'),
    ('germany', 'Germany', 'GER', '🇩🇪'),
    ('ghana', 'Ghana', 'GHA', '🇬🇭'),
    ('haiti', 'Haiti', 'HAI', '🇭🇹'),
    ('iran', 'Iran', 'IRN', '🇮🇷'),
    ('iriran', 'Iran', 'IRN', '🇮🇷'),
    ('iranislamicrepublicof', 'Iran', 'IRN', '🇮🇷'),
    ('iraq', 'Iraq', 'IRQ', '🇮🇶'),
    ('ivorycoast', 'Ivory Coast', 'CIV', '🇨🇮'),
    ('cotedivoire', 'Ivory Coast', 'CIV', '🇨🇮'),
    ('côtedivoire', 'Ivory Coast', 'CIV', '🇨🇮'),
    ('japan', 'Japan', 'JPN', '🇯🇵'),
    ('jordan', 'Jordan', 'JOR', '🇯🇴'),
    ('mexico', 'Mexico', 'MEX', '🇲🇽'),
    ('morocco', 'Morocco', 'MAR', '🇲🇦'),
    ('netherlands', 'Netherlands', 'NED', '🇳🇱'),
    ('newzealand', 'New Zealand', 'NZL', '🇳🇿'),
    ('norway', 'Norway', 'NOR', '🇳🇴'),
    ('panama', 'Panama', 'PAN', '🇵🇦'),
    ('paraguay', 'Paraguay', 'PAR', '🇵🇾'),
    ('portugal', 'Portugal', 'POR', '🇵🇹'),
    ('qatar', 'Qatar', 'QAT', '🇶🇦'),
    ('saudiarabia', 'Saudi Arabia', 'KSA', '🇸🇦'),
    ('scotland', 'Scotland', 'SCO', '🏴'),
    ('senegal', 'Senegal', 'SEN', '🇸🇳'),
    ('southafrica', 'South Africa', 'RSA', '🇿🇦'),
    ('southkorea', 'South Korea', 'KOR', '🇰🇷'),
    ('korearepublic', 'South Korea', 'KOR', '🇰🇷'),
    ('republicofkorea', 'South Korea', 'KOR', '🇰🇷'),
    ('spain', 'Spain', 'ESP', '🇪🇸'),
    ('sweden', 'Sweden', 'SWE', '🇸🇪'),
    ('switzerland', 'Switzerland', 'SUI', '🇨🇭'),
    ('tunisia', 'Tunisia', 'TUN', '🇹🇳'),
    ('turkey', 'Turkey', 'TUR', '🇹🇷'),
    ('turkiye', 'Turkey', 'TUR', '🇹🇷'),
    ('türkiye', 'Turkey', 'TUR', '🇹🇷'),
    ('usa', 'USA', 'USA', '🇺🇸'),
    ('unitedstates', 'USA', 'USA', '🇺🇸'),
    ('unitedstatesofamerica', 'USA', 'USA', '🇺🇸'),
    ('uruguay', 'Uruguay', 'URU', '🇺🇾'),
    ('uzbekistan', 'Uzbekistan', 'UZB', '🇺🇿')
),
normalized_teams as (
  select
    t.id,
    regexp_replace(
      lower(
        translate(
          coalesce(t.name, ''),
          'ÁÀÂÄÃÅáàâäãåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÖÕØóòôöõøÚÙÛÜúùûüÇçÑñÝýÿ',
          'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOOooooooUUUUuuuuCcNnYyy'
        )
      ),
      '[^a-z0-9]+',
      '',
      'g'
    ) as name_key
  from public.teams t
),
updated as (
  update public.teams t
  set
    name = case
      when t.name = d.canonical_name then t.name
      when exists (
        select 1
        from public.teams existing
        where existing.name = d.canonical_name
          and existing.id <> t.id
      ) then t.name
      else d.canonical_name
    end,
    short_name = d.short_name,
    flag = d.flag,
    updated_at = now()
  from normalized_teams n
  join team_display d
    on d.name_key = n.name_key
  where t.id = n.id
    and (
      t.name is distinct from case
        when t.name = d.canonical_name then t.name
        when exists (
          select 1
          from public.teams existing
          where existing.name = d.canonical_name
            and existing.id <> t.id
        ) then t.name
        else d.canonical_name
      end
      or t.short_name is distinct from d.short_name
      or t.flag is distinct from d.flag
    )
  returning t.id, t.name, t.short_name, t.flag
)
select count(*) as teams_updated
from updated;

commit;

-- Missing-flag report after the update. Expected: zero rows for World Cup teams.
with known_codes(code) as (
  values
    ('ALG'), ('ARG'), ('AUS'), ('AUT'), ('BEL'), ('BIH'), ('BRA'), ('CAN'),
    ('CPV'), ('COL'), ('COD'), ('CRO'), ('CUW'), ('CZE'), ('ECU'), ('EGY'),
    ('ENG'), ('FRA'), ('GER'), ('GHA'), ('HAI'), ('IRN'), ('IRQ'), ('CIV'),
    ('JPN'), ('JOR'), ('MEX'), ('MAR'), ('NED'), ('NZL'), ('NOR'), ('PAN'),
    ('PAR'), ('POR'), ('QAT'), ('KSA'), ('SCO'), ('SEN'), ('RSA'), ('KOR'),
    ('ESP'), ('SWE'), ('SUI'), ('TUN'), ('TUR'), ('USA'), ('URU'), ('UZB')
)
select id, name, short_name, api_provider, api_team_id
from public.teams
where nullif(flag, '') is null
  and (
    short_name in (select code from known_codes)
    or api_provider = 'football-data'
  )
order by name;
