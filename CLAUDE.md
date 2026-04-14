# Kitchen Helper — Claude Guidelines

## Project Structure

This project uses git worktrees. Before editing any file, grep for duplicates across the worktree and main directory. Apply changes to **all copies** of the affected file, then verify with a final search that no stale copies remain.

- Main directory: `C:\Users\Nathan\Documents\App Ideas\kitchen-helper`
- Worktrees: `C:\Users\Nathan\Documents\App Ideas\kitchen-helper\.claude\worktrees\`

## UI Development Guidelines

- **Confirm scope before implementing** UI features (buttons, actions, etc.). Ask: does this apply to all items, user-owned items only, or a subset? Do not assume.
- **Propose options before coding** any icon or visual styling decision. Describe 2–3 choices (library, icon name, rationale) and wait for approval before writing code.
- **Batch related UI changes** into a single plan before editing. List affected files, scope assumptions, and visual choices that need confirmation. Wait for approval before proceeding.

## Workflow

- After any content removal, verify the section is gone by grepping for a unique string from the removed block.
- When scope or intent is unclear, ask rather than guess. A brief clarification upfront is cheaper than rework.
