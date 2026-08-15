# themephile — everything is bun; `make` alone does the whole golden path.

SUPABASE_PROJECT_ID ?= qyzdrsyabtnbpaszucsu
TYPES := lib/supabase/database.types.ts

.DEFAULT_GOAL := all
.PHONY: all install env dev build start check lint types update migrate clean

## make — install, check the environment, and start the dev server.
all: install env
	bun run dev

## Dependencies. bun only; there is no other lockfile in this repo.
install:
	bun install

## The gallery is optional. Say so plainly rather than failing at runtime.
env:
	@if [ ! -f .env.local ]; then \
		printf '\033[33m.env.local is missing.\033[0m The editor and tmux studio work without it;\n'; \
		printf 'the theme gallery will render a "not configured" notice.\n'; \
		printf 'To enable it: cp .env.example .env.local, then fill in the two values.\n\n'; \
	fi

dev: install
	bun run dev

build: install
	bun run build

start: build
	bun run start

lint:
	bunx eslint .

## Everything CI would check, in the order that fails fastest.
check: install
	bunx tsc --noEmit
	bunx eslint .
	bun run build

## Regenerate the database types from the live schema.
## Needs a Supabase access token: https://supabase.com/dashboard/account/tokens
types:
	@if [ -z "$$SUPABASE_ACCESS_TOKEN" ]; then \
		printf '\033[31mSUPABASE_ACCESS_TOKEN is not set.\033[0m\n'; \
		printf 'Create one at https://supabase.com/dashboard/account/tokens, then:\n'; \
		printf '  SUPABASE_ACCESS_TOKEN=sbp_... make types\n'; \
		exit 1; \
	fi
	bunx supabase gen types typescript --project-id $(SUPABASE_PROJECT_ID) > $(TYPES)
	@printf '\033[32mWrote %s\033[0m\n' '$(TYPES)'

## Show which migrations the remote database has applied.
migrate:
	@if [ -z "$$SUPABASE_ACCESS_TOKEN" ]; then \
		printf 'Set SUPABASE_ACCESS_TOKEN first (see `make types`).\n'; exit 1; \
	fi
	bunx supabase migration list --project-ref $(SUPABASE_PROJECT_ID)

## Full refresh: newest dependencies, regenerated types, clean rebuild.
update:
	bun update
	@$(MAKE) types || printf '\033[33mSkipped type generation (no access token).\033[0m\n'
	@$(MAKE) clean
	bun run build

clean:
	rm -rf .next tsconfig.tsbuildinfo
