create table if not exists installs (
  merchant_id text primary key,
  access_token text not null,
  access_token_expires_at timestamptz not null,
  refresh_token text,
  scopes text[] not null default '{}',
  installed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists used_session_tokens (
  jti text primary key,
  expires_at timestamptz not null
);

create index if not exists used_session_tokens_expires_at_idx
  on used_session_tokens (expires_at);

alter table installs enable row level security;
alter table used_session_tokens enable row level security;
