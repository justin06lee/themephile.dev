# themephile — everything is bun; `make` alone does the whole golden path.

TURSO   := $(HOME)/.turso/turso
DB_NAME ?= themephile
MIGRATIONS := $(sort $(wildcard db/migrations/*.sql))

.DEFAULT_GOAL := all
.PHONY: all install env dev build start check lint db-push db-shell db-url update clean

## make — install, check the environment, and start the dev server.
all: install env
	bun run dev

## Dependencies. bun only; there is no other lockfile in this repo.
install:
	bun install

## The gallery is optional, and it fails in two independent steps.
## Say which one you're in rather than letting it surprise you at runtime.
env:
	@if [ ! -f .env.local ]; then \
		printf '\033[33m.env.local is missing.\033[0m The editor and tmux studio work without it;\n'; \
		printf '/themes will say it is not configured.\n'; \
		printf 'To enable the gallery: cp .env.example .env.local, then fill it in.\n\n'; \
	elif ! grep -q '^TURSO_AUTH_TOKEN=.' .env.local 2>/dev/null; then \
		printf '\033[33mTURSO_AUTH_TOKEN is empty\033[0m — the gallery will render as unconfigured.\n'; \
		printf 'Run: make db-push\n\n'; \
	elif ! grep -q '^GITHUB_CLIENT_SECRET=.' .env.local 2>/dev/null; then \
		printf '\033[33mNo GitHub app configured\033[0m — the gallery is readable but sign-in is hidden.\n'; \
		printf 'See .env.example for the two-minute setup.\n\n'; \
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

## Create the database if it isn't there, then apply every migration.
## Migrations are written to be re-runnable, so this is safe to repeat.
db-push:
	@command -v $(TURSO) >/dev/null 2>&1 || { \
		printf '\033[31mTurso CLI not found.\033[0m Install it:\n'; \
		printf '  curl -sSfL https://get.tur.so/install.sh | bash\n'; exit 1; }
	@$(TURSO) auth whoami >/dev/null 2>&1 || { \
		printf '\033[31mNot logged in.\033[0m Run: $(TURSO) auth login\n'; exit 1; }
	@$(TURSO) db show $(DB_NAME) >/dev/null 2>&1 || $(TURSO) db create $(DB_NAME)
	@for file in $(MIGRATIONS); do \
		printf 'applying %s\n' "$$file"; \
		$(TURSO) db shell $(DB_NAME) < "$$file" || exit 1; \
	done
	@printf '\033[32mSchema is up to date.\033[0m\n'
	@printf 'URL:   %s\n' "$$($(TURSO) db show $(DB_NAME) --url)"
	@printf 'Token: run `$(TURSO) db tokens create $(DB_NAME)`\n'

## An interactive SQL shell against the live database.
db-shell:
	@$(TURSO) db shell $(DB_NAME)

db-url:
	@$(TURSO) db show $(DB_NAME) --url

## Full refresh: newest dependencies, clean rebuild.
update:
	bun update
	@$(MAKE) clean
	bun run build

clean:
	rm -rf .next tsconfig.tsbuildinfo
