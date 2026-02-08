$profiles = Get-ChildItem -Directory "$env:APPDATA/Code/User/profiles"
foreach ($profile in $profiles) {
    $dest = Join-Path $profile.FullName 'prompts'
    if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force }
    Copy-Item "agents/github-copilot/*.agent.md" $dest -Force
}