#!/bin/bash

# Copy agent files to VS Code profiles' prompts folders on POSIX systems

profiles_dir="$HOME/.config/Code/User/profiles"

if [ -d "$profiles_dir" ]; then
    for profile in "$profiles_dir"/*/; do
        if [ -d "$profile" ]; then
            dest="$profile/prompts"
            mkdir -p "$dest"
            cp agents/github-copilot/*.agent.md "$dest/"
        fi
    done
    echo "Agent files copied to all profile prompts folders."
else
    echo "Profiles directory not found at $profiles_dir"
fi