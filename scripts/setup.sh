#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════
#  Manifesto Tracker — one-run setup (macOS, Linux, WSL, Git Bash)
#
#  1. writes .env.local from your Supabase (and optional Stripe) keys
#  2. installs dependencies and checks the production build
#  3. loads the database schema + seed into Supabase
#  4. creates a private GitHub repo and pushes the code
#  5. links a Vercel project, sets environment variables, connects the
#     GitHub repo for automatic deploys, and deploys to production
#
#  Run from the project folder:   bash scripts/setup.sh
# ════════════════════════════════════════════════════════════════════
set -euo pipefail
cd "$(dirname "$0")/.."

bold() { printf "\n\033[1m%s\033[0m\n" "$*"; }
info() { printf "  %s\n" "$*"; }
die()  { printf "\n\033[31m✗ %s\033[0m\n" "$*"; exit 1; }
ask()  { local prompt="$1" default="${2:-}" reply; read -r -p "  $prompt${default:+ [$default]}: " reply; echo "${reply:-$default}"; }
asks() { local prompt="$1" reply; read -r -s -p "  $prompt: " reply; echo >&2; echo "$reply"; }
VERCEL="npx --yes vercel@latest"

# ── 0. Prerequisites ────────────────────────────────────────────────
bold "Checking tools"
command -v node >/dev/null || die "Node.js 20+ is required: https://nodejs.org"
NODE_MAJOR=$(node -p 'process.versions.node.split(".")[0]')
[ "$NODE_MAJOR" -ge 20 ] || die "Node.js 20+ is required (found $(node -v))"
command -v git >/dev/null || die "git is required: https://git-scm.com"
command -v gh  >/dev/null || die "GitHub CLI is required: https://cli.github.com (then run: gh auth login)"
info "node $(node -v), git, gh — OK (Vercel CLI runs through npx)"

# ── 1. Keys ─────────────────────────────────────────────────────────
bold "1/5  Your keys"
info "Supabase → your project → Project Settings → API Keys"
SUPABASE_URL=$(ask "Supabase project URL (https://xxxx.supabase.co)")
[[ "$SUPABASE_URL" == https://*.supabase.co ]] || die "That doesn't look like a Supabase URL"
SUPABASE_PUBLISHABLE=$(ask "Publishable key (sb_publishable_...)")
SUPABASE_SECRET=$(asks "Secret key (sb_secret_..., hidden)")
[ -n "$SUPABASE_PUBLISHABLE" ] && [ -n "$SUPABASE_SECRET" ] || die "Both Supabase keys are needed"

info ""
info "Stripe is optional for now. Leave blank to use DEMO_MODE (upgrade without payment)."
STRIPE_SECRET=$(asks "Stripe secret key (sk_test_..., hidden, optional)")
STRIPE_PRICE=""; STRIPE_WEBHOOK=""; DEMO="true"
if [ -n "$STRIPE_SECRET" ]; then
  STRIPE_PRICE=$(ask "Stripe Price ID of the monthly plan (price_...)")
  STRIPE_WEBHOOK=$(asks "Stripe webhook signing secret (whsec_..., hidden — blank if not created yet)")
  DEMO="false"
fi

REPO=$(ask "GitHub repository name" "manifesto-tracker")

cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$SUPABASE_PUBLISHABLE
SUPABASE_SECRET_KEY=$SUPABASE_SECRET
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=$STRIPE_SECRET
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK
STRIPE_PRICE_ID=$STRIPE_PRICE
DEMO_MODE=$DEMO
EOF
info "Wrote .env.local (git-ignored)"

# ── 2. Install + build check ────────────────────────────────────────
bold "2/5  Installing and checking the build"
npm install --no-audit --no-fund
npm run db:bundle >/dev/null
npm run build

# ── 3. Database ─────────────────────────────────────────────────────
bold "3/5  Database"
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's#https://([^.]+)\.supabase\.co.*#\1#')
info "Option A (automatic): paste the database connection string (needs psql installed)."
info "  Supabase → Connect → 'Session pooler' URI, with your database password filled in."
info "Option B (manual): leave blank, then paste supabase/setup.sql into the SQL Editor."
DB_URL=$(asks "Connection string (hidden, blank for manual)")
if [ -n "$DB_URL" ] && command -v psql >/dev/null; then
  psql "$DB_URL" -v ON_ERROR_STOP=1 -q -f supabase/setup.sql && info "Schema and seed loaded ✓"
else
  info "Open: https://supabase.com/dashboard/project/$PROJECT_REF/sql/new"
  info "Paste the whole of supabase/setup.sql and press Run."
  read -r -p "  Press Enter once it has run successfully… " _
fi

# ── 4. GitHub ───────────────────────────────────────────────────────
bold "4/5  GitHub"
gh auth status >/dev/null 2>&1 || gh auth login
if [ -z "$(git config user.email || true)" ]; then
  git config --global user.name "$(ask "Your name for git commits")"
  git config --global user.email "$(ask "Your email for git commits")"
fi
if [ ! -d .git ]; then git init -q -b main; fi
git add -A
git commit -q -m "Manifesto Tracker prototype" || info "Nothing new to commit"
if git remote get-url origin >/dev/null 2>&1; then
  git push -u origin main
else
  gh repo create "$REPO" --private --source=. --remote=origin --push
fi
REPO_URL=$(gh repo view --json url -q .url)
info "Pushed to $REPO_URL"

# ── 5. Vercel ───────────────────────────────────────────────────────
bold "5/5  Vercel"
$VERCEL whoami >/dev/null 2>&1 || $VERCEL login
$VERCEL link --yes --project "$REPO"

setenv() { # name value envs [--sensitive]
  [ -n "$2" ] || return 0
  $VERCEL env add "$1" --environment "$3" --value "$2" --force --yes ${4:-} >/dev/null && info "env $1 ✓"
}
setenv NEXT_PUBLIC_SUPABASE_URL "$SUPABASE_URL" production,preview,development
setenv NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "$SUPABASE_PUBLISHABLE" production,preview,development
setenv SUPABASE_SECRET_KEY "$SUPABASE_SECRET" production,preview --sensitive
setenv STRIPE_SECRET_KEY "$STRIPE_SECRET" production,preview --sensitive
setenv STRIPE_WEBHOOK_SECRET "$STRIPE_WEBHOOK" production,preview --sensitive
setenv STRIPE_PRICE_ID "$STRIPE_PRICE" production,preview
setenv DEMO_MODE "$DEMO" production,preview,development

$VERCEL git connect "$REPO_URL" --yes >/dev/null 2>&1 && info "GitHub connected: every push to main deploys" \
  || info "Connect GitHub later in Vercel → Project → Settings → Git"
DEPLOY_URL=$($VERCEL deploy --prod --yes | tail -1)
PROD_URL="https://$REPO.vercel.app"

bold "Done 🎉"
info "Deployment:  $DEPLOY_URL"
info "Production:  $PROD_URL  (check the exact domain in Vercel → Project → Domains)"
cat <<EOF

  Finish in the dashboards (2 minutes):
  • Supabase → Authentication → URL Configuration
      Site URL:       $PROD_URL
      Redirect URLs:  $PROD_URL/auth/callback   and   http://localhost:3000/auth/callback
  • Make yourself admin: sign up in the app, then run supabase/make-admin.sql
    (with your email) in the Supabase SQL Editor.
EOF
if [ -n "$STRIPE_SECRET" ]; then cat <<EOF
  • Stripe → Developers → Webhooks → Add endpoint
      URL:    $PROD_URL/api/stripe/webhook
      Events: checkout.session.completed, customer.subscription.created,
              customer.subscription.updated, customer.subscription.deleted
    Then:  $VERCEL env add STRIPE_WEBHOOK_SECRET --environment production,preview --force --sensitive
           and redeploy (git push, or $VERCEL deploy --prod).
EOF
fi
echo
