# ════════════════════════════════════════════════════════════════════
#  Manifesto Tracker — one-run setup for Windows (PowerShell 5.1+ / 7)
#
#  Same steps as scripts/setup.sh:
#   1. writes .env.local   2. installs + checks the build
#   3. loads the database  4. creates a private GitHub repo and pushes
#   5. links Vercel, sets env vars, connects GitHub, deploys to production
#
#  Run from the project folder:
#     powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
# ════════════════════════════════════════════════════════════════════
# Native tools report failure through $LASTEXITCODE, checked after each step.
$ErrorActionPreference = "Continue"
Set-Location (Join-Path $PSScriptRoot "..")

function Bold($t) { Write-Host "`n$t" -ForegroundColor White }
function Info($t) { Write-Host "  $t" }
function Die($t)  { Write-Host "`nX $t" -ForegroundColor Red; exit 1 }
function Ask($prompt, $default = "") {
  $suffix = if ($default) { " [$default]" } else { "" }
  $r = Read-Host "  $prompt$suffix"
  if ([string]::IsNullOrWhiteSpace($r)) { $default } else { $r.Trim() }
}
function AskSecret($prompt) {
  $s = Read-Host "  $prompt" -AsSecureString
  [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
}
function Vercel { npx --yes vercel@latest @args; if ($LASTEXITCODE -ne 0) { throw "vercel $args failed" } }

# ── 0. Prerequisites ────────────────────────────────────────────────
Bold "Checking tools"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { Die "Node.js 20+ is required: https://nodejs.org" }
$major = [int](node -p "process.versions.node.split('.')[0]")
if ($major -lt 20) { Die "Node.js 20+ is required (found $(node -v))" }
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Die "git is required: https://git-scm.com" }
if (-not (Get-Command gh -ErrorAction SilentlyContinue))  { Die "GitHub CLI is required: https://cli.github.com  (winget install GitHub.cli)" }
Info "node $(node -v), git, gh - OK (Vercel CLI runs through npx)"

# ── 1. Keys ─────────────────────────────────────────────────────────
Bold "1/5  Your keys"
Info "Supabase -> your project -> Project Settings -> API Keys"
$SupabaseUrl = Ask "Supabase project URL (https://xxxx.supabase.co)"
if ($SupabaseUrl -notmatch '^https://[^.]+\.supabase\.co') { Die "That doesn't look like a Supabase URL" }
$Publishable = Ask "Publishable key (sb_publishable_...)"
$Secret = AskSecret "Secret key (sb_secret_..., hidden)"
if (-not $Publishable -or -not $Secret) { Die "Both Supabase keys are needed" }

Info ""
Info "Stripe is optional for now. Leave blank to use DEMO_MODE (upgrade without payment)."
$StripeSecret = AskSecret "Stripe secret key (sk_test_..., hidden, optional)"
$StripePrice = ""; $StripeWebhook = ""; $Demo = "true"
if ($StripeSecret) {
  $StripePrice = Ask "Stripe Price ID of the monthly plan (price_...)"
  $StripeWebhook = AskSecret "Stripe webhook signing secret (whsec_..., blank if not created yet)"
  $Demo = "false"
}
$Repo = Ask "GitHub repository name" "manifesto-tracker"

@"
NEXT_PUBLIC_SUPABASE_URL=$SupabaseUrl
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$Publishable
SUPABASE_SECRET_KEY=$Secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=$StripeSecret
STRIPE_WEBHOOK_SECRET=$StripeWebhook
STRIPE_PRICE_ID=$StripePrice
DEMO_MODE=$Demo
"@ | Set-Content -Path .env.local -Encoding ascii
Info "Wrote .env.local (git-ignored)"

# ── 2. Install + build check ────────────────────────────────────────
Bold "2/5  Installing and checking the build"
npm install --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { Die "npm install failed" }
npm run db:bundle | Out-Null
npm run build; if ($LASTEXITCODE -ne 0) { Die "Build failed - see the error above" }

# ── 3. Database ─────────────────────────────────────────────────────
Bold "3/5  Database"
$Ref = ([regex]::Match($SupabaseUrl, '^https://([^.]+)\.supabase\.co')).Groups[1].Value
Info "Open: https://supabase.com/dashboard/project/$Ref/sql/new"
Info "Paste the whole of supabase\setup.sql and press Run."
Set-Clipboard -Value (Get-Content supabase\setup.sql -Raw) -ErrorAction SilentlyContinue
Info "(setup.sql has been copied to your clipboard)"
Start-Process "https://supabase.com/dashboard/project/$Ref/sql/new" -ErrorAction SilentlyContinue
Read-Host "  Press Enter once it has run successfully" | Out-Null

# ── 4. GitHub ───────────────────────────────────────────────────────
Bold "4/5  GitHub"
gh auth status 2>$null | Out-Null; if ($LASTEXITCODE -ne 0) { gh auth login }
if (-not (git config user.email)) {
  git config --global user.name (Ask "Your name for git commits")
  git config --global user.email (Ask "Your email for git commits")
}
if (-not (Test-Path .git)) { git init -q -b main }
git add -A
git commit -q -m "Manifesto Tracker prototype" 2>$null; if ($LASTEXITCODE -ne 0) { Info "Nothing new to commit" }
git remote get-url origin 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { git push -u origin main } else { gh repo create $Repo --private --source=. --remote=origin --push }
$RepoUrl = gh repo view --json url -q .url
Info "Pushed to $RepoUrl"

# ── 5. Vercel ───────────────────────────────────────────────────────
Bold "5/5  Vercel"
npx --yes vercel@latest whoami 2>$null | Out-Null; if ($LASTEXITCODE -ne 0) { Vercel login }
Vercel link --yes --project $Repo

function SetEnv($name, $value, $envs, $sensitive = $false) {
  if (-not $value) { return }
  $extra = if ($sensitive) { @("--sensitive") } else { @() }
  Vercel env add $name --environment $envs --value $value --force --yes @extra | Out-Null
  Info "env $name OK"
}
SetEnv NEXT_PUBLIC_SUPABASE_URL $SupabaseUrl "production,preview,development"
SetEnv NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY $Publishable "production,preview,development"
SetEnv SUPABASE_SECRET_KEY $Secret "production,preview" $true
SetEnv STRIPE_SECRET_KEY $StripeSecret "production,preview" $true
SetEnv STRIPE_WEBHOOK_SECRET $StripeWebhook "production,preview" $true
SetEnv STRIPE_PRICE_ID $StripePrice "production,preview"
SetEnv DEMO_MODE $Demo "production,preview,development"

try { Vercel git connect $RepoUrl --yes | Out-Null; Info "GitHub connected: every push to main deploys" }
catch { Info "Connect GitHub later in Vercel -> Project -> Settings -> Git" }
$DeployUrl = (npx --yes vercel@latest deploy --prod --yes | Select-Object -Last 1)
$ProdUrl = "https://$Repo.vercel.app"

Bold "Done!"
Info "Deployment:  $DeployUrl"
Info "Production:  $ProdUrl  (check the exact domain in Vercel -> Project -> Domains)"
Write-Host @"

  Finish in the dashboards (2 minutes):
  - Supabase -> Authentication -> URL Configuration
      Site URL:       $ProdUrl
      Redirect URLs:  $ProdUrl/auth/callback   and   http://localhost:3000/auth/callback
  - Make yourself admin: sign up in the app, then run supabase\make-admin.sql
    (with your email) in the Supabase SQL Editor.
"@
if ($StripeSecret) { Write-Host @"
  - Stripe -> Developers -> Webhooks -> Add endpoint
      URL:    $ProdUrl/api/stripe/webhook
      Events: checkout.session.completed, customer.subscription.created,
              customer.subscription.updated, customer.subscription.deleted
    Then add the signing secret:
      npx vercel env add STRIPE_WEBHOOK_SECRET --environment production,preview --force --sensitive
    and redeploy (git push, or npx vercel deploy --prod).
"@ }
