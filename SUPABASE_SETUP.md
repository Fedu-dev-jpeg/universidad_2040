# Configuración de Supabase (Universidad 2040)

Esta app ahora soporta persistencia en Supabase para:

- sesiones de alumnos,
- respuestas de la cápsula,
- contactos interesados,
- usuarios OAuth (si usás ese flujo).

## 1) Variables de entorno

Configurá estas variables en tu entorno de ejecución:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Opcional (fallback a base actual):

- `DATABASE_URL`

## 2) SQL para crear tablas (Supabase SQL Editor)

```sql
create table if not exists public.users (
  id bigserial primary key,
  open_id text not null unique,
  name text,
  email text,
  login_method text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  last_signed_in timestamptz not null default timezone('utc', now())
);

create table if not exists public.capsule_sessions (
  id bigserial primary key,
  session_id text not null unique,
  student_name text,
  country text,
  country_code text,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.capsule_responses (
  id bigserial primary key,
  session_id text not null unique references public.capsule_sessions(session_id) on delete cascade,
  interaction1 jsonb,
  interaction2 jsonb,
  interaction3 text,
  interaction4_opinion text,
  interaction4_text text,
  interaction5 jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_interests (
  id bigserial primary key,
  session_id text not null references public.capsule_sessions(session_id) on delete cascade,
  student_name text,
  email text,
  phone text,
  message text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_capsule_sessions_created_at
  on public.capsule_sessions (created_at desc);

create index if not exists idx_contact_interests_created_at
  on public.contact_interests (created_at desc);
```

## 3) Reglas de acceso configuradas en la app

- Ingreso de alumnos: **Nombre y apellido + contraseña exacta `ORT`**
- Ingreso admin dashboard: **usuario `admin` + contraseña `Formate-1780`**

