#!/usr/bin/env bash
set -euo pipefail

#############################################################################
# EDAC Installer
# Installs the Developer profile from the local repo to ~/.config/opencode.
#
# Usage:
#   ./install.sh                  Install Developer profile
#   ./install.sh --dry-run        Show what would be installed
#   ./install.sh --overwrite      Overwrite existing files (default: skip)
#   EDAC_INSTALL_DIR=/tmp/edac ./install.sh   Custom install directory
#############################################################################

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
# Mirror directory — must stay in sync with MIRROR_DIR ('src') in scripts/registry/dependency-resolution.ts
SRC_ROOT="$REPO_ROOT/src"
INSTALL_DIR="${EDAC_INSTALL_DIR:-$HOME/.config/opencode}"
DRY_RUN=false
OVERWRITE=false
REGISTRY="$REPO_ROOT/registry.json"

# ── CLI ──────────────────────────────────────────────────────────────────────

usage() {
  cat <<EOF
Usage: ./install.sh [OPTIONS]

Installs the EDAC Developer profile from the local repository.

Options:
  --dry-run        Show what would be installed (replaces resolve-dev-profile.py)
  --overwrite      Overwrite existing files instead of skipping
  --install-dir DIR  Install directory (default: ~/.config/opencode)
  -h, --help       Show this help

Environment:
  EDAC_INSTALL_DIR  Same as --install-dir
EOF
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)    DRY_RUN=true; shift ;;
    --overwrite)  OVERWRITE=true; shift ;;
    --install-dir) INSTALL_DIR="$2"; shift 2 ;;
    -h|--help)    usage ;;
    *)            echo "Unknown option: $1"; usage ;;
  esac
done

[[ -f "$REGISTRY" ]] || { echo "ERROR: registry.json not found at $REGISTRY"; exit 1; }

# ── Colors ───────────────────────────────────────────────────────────────────

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

ok()    { echo -e "${GREEN}✓${NC} $1"; }
err()   { echo -e "${RED}✗${NC} $1"; }
warn()  { echo -e "${YELLOW}⚠${NC} $1"; }
info()  { echo -e "${BLUE}ℹ${NC} $1"; }

command -v jq >/dev/null 2>&1 || { err "jq is required but not installed"; exit 1; }

jq_exec() { jq -r "$@" | tr -d '\r'; }

# ── Registry Helpers ─────────────────────────────────────────────────────────

get_registry_key() {
  case "$1" in
    config)           echo "config" ;;
    agents|contexts|skills|commands|tools|plugins) echo "$1" ;;  # already plural in registry
    agent)            echo "agents" ;;
    context)          echo "contexts" ;;
    skill)            echo "skills" ;;
    command)          echo "commands" ;;
    tool)             echo "tools" ;;
    plugin)           echo "plugins" ;;
    subagent)         echo "subagents" ;;
    *s)               echo "$1" ;;   # assume plural
    *)                echo "${1}s" ;; # default: add 's'
  esac
}

get_install_path() {
  # Defensive no-op: registry paths are already stripped of '.opencode/' prefix,
  # so this expansion is a safety net that never actually matches.
  local rel="${1#.opencode/}"
  echo "${INSTALL_DIR}/${rel}"
}

resolve_component_path() {
  local type="$1" id="$2"
  local key; key=$(get_registry_key "$type")

  if [[ "$type" == "context" && "$id" == */* ]]; then
    # Try .md extension first, then bare path
    local result
    result=$(jq_exec "first(.components.contexts[]? | select(.path == \"context/${id}.md\") | .path)" "$REGISTRY")
    [[ -z "$result" || "$result" == "null" ]] && \
      result=$(jq_exec "first(.components.contexts[]? | select(.path == \"context/${id}\") | .path)" "$REGISTRY")
    echo "$result"
    return
  fi
  jq_exec ".components.${key}[]? | select(.id == \"${id}\" or (.aliases // [] | index(\"${id}\"))) | .path" "$REGISTRY"
}

expand_context_wildcard() {
  local pattern prefix
  pattern="$1"
  prefix="${pattern%%\**}"
  prefix="${prefix%/}"
  [[ -n "$prefix" ]] && prefix="${prefix}/"
  jq_exec ".components.contexts[]? | select(.path | startswith(\"context/${prefix}\")) | .path | sub(\"^context/\"; \"\") | sub(\"\\\\.md$\"; \"\")" "$REGISTRY"
}

# ── Dependency Resolution ────────────────────────────────────────────────────

SELECTED=()
RESOLVED_ORDER=()

resolve_dependencies() {
  local comp="$1"
  local type="${comp%%:*}"
  local id="${comp##*:}"

  # Already resolved?
  for existing in "${RESOLVED_ORDER[@]}"; do
    [[ "$existing" == "$comp" ]] && return
  done

  # Wildcard expansion (only for context types)
  if [[ "$id" == *"*"* ]]; then
    if [[ "$type" != "context" ]]; then
      warn "Wildcard only supported for context: $comp"
      return
    fi
    while IFS= read -r match; do
      [[ -z "$match" ]] && continue
      local exp="context:${match}"
      for existing in "${RESOLVED_ORDER[@]}"; do
        [[ "$existing" == "$exp" ]] && continue 2
      done
      RESOLVED_ORDER+=("$exp")
      resolve_dependencies "$exp"
    done < <(expand_context_wildcard "$id")
    return
  fi

  # Look up component
  local key; key=$(get_registry_key "$type")
  local deps
  deps=$(jq_exec ".components.${key}[]? | select(.id == \"${id}\" or (.aliases // [] | index(\"${id}\"))) | .dependencies[]?" "$REGISTRY" 2>/dev/null || echo "")

  RESOLVED_ORDER+=("$comp")

  # Recurse into dependencies
  if [[ -n "$deps" ]]; then
    for dep in $deps; do
      resolve_dependencies "$dep"
    done
  fi
}

# ── Dry Run ──────────────────────────────────────────────────────────────────

dry_run() {
  local seed; seed=$(jq_exec '.profiles.developer.components | length' "$REGISTRY")
  echo "Seed components: $seed"
  echo "Resolving..."
  echo ""

  for comp in "${SELECTED[@]}"; do
    resolve_dependencies "$comp"
  done

  echo -e "Resolved components: ${#RESOLVED_ORDER[@]}"
  printf '%.0s=' $(seq 1 80); echo ""

  # Group by type: sort by type prefix, then display with headers
  local total=0 with_path=0 missing=()
  local prev_type="" count=0

  # Sort RESOLVED_ORDER by type
  local sorted=()
  while IFS= read -r line; do
    [[ -n "$line" ]] && sorted+=("$line")
  done < <(for c in "${RESOLVED_ORDER[@]}"; do echo "$c"; done | sort -t: -k1,1)

  for comp in "${sorted[@]}"; do
    local ctype="${comp%%:*}" cid="${comp##*:}"
    local path; path=$(resolve_component_path "$ctype" "$cid")

    # Print header on type change
    if [[ "$ctype" != "$prev_type" ]]; then
      [[ "$prev_type" != "" ]] && echo ""
      echo -e "--- ${BOLD}${ctype^^}${NC} ---"
      prev_type="$ctype"
    fi

    total=$((total + 1))
    if [[ -n "$path" && "$path" != "null" ]]; then
      local full="$SRC_ROOT/$path"
      with_path=$((with_path + 1))
      if [[ -f "$full" || -d "$full" ]]; then
        echo -e "  ${ctype}:${cid}    ${GREEN}✓${NC}"
      else
        echo -e "  ${ctype}:${cid}    ${RED}✗ MISSING: $path${NC}"
        missing+=("${ctype}:${cid}  $path")
      fi
    else
      echo -e "  ${ctype}:${cid}    ${YELLOW}? (no path in registry)${NC}"
    fi
  done

  echo ""
  printf '%.0s=' $(seq 1 80); echo ""
  echo -e "Total: $total components ($with_path with paths, $((total - with_path)) without)"

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo ""
    echo -e "${RED}⚠ MISSING FILES (${#missing[@]}):${NC}"
    for m in "${missing[@]}"; do
      echo "  $m"
    done
    err "Dry-run found ${#missing[@]} missing component(s) — install would write nothing. Fix MIRROR_DIR/SRC_ROOT or restore sources."
  fi

  echo ""
  echo -e "Install dir: ${CYAN}${INSTALL_DIR}${NC}"
}

# ── Install ──────────────────────────────────────────────────────────────────

install_components() {
  for comp in "${SELECTED[@]}"; do
    resolve_dependencies "$comp"
  done

  echo ""
  info "Installing to ${CYAN}${INSTALL_DIR}${NC} ..."
  echo ""

  local installed=0 skipped=0 failed=0

  for comp in "${RESOLVED_ORDER[@]}"; do
    local type="${comp%%:*}" id="${comp##*:}"
    local path; path=$(resolve_component_path "$type" "$id")

    if [[ -z "$path" || "$path" == "null" ]]; then
      warn "No path: $comp"
      failed=$((failed + 1))
      continue
    fi

    local dest; dest=$(get_install_path "$path")
    local src="$SRC_ROOT/$path"
    local file_existed=false
    [[ -f "$dest" ]] && file_existed=true

    if [[ "$file_existed" == true && "$OVERWRITE" == false ]]; then
      info "Skipped: ${type}:${id}"
      skipped=$((skipped + 1))
      continue
    fi

    mkdir -p "$(dirname "$dest")"

    if cp "$src" "$dest"; then
      # Path transform: replace local context refs with absolute paths for global install
      # Skip if installing to a local .opencode (e.g., --install-dir .opencode)
      if [[ "$INSTALL_DIR" != ".opencode" && "$INSTALL_DIR" != *"/.opencode" ]]; then
        local expanded="${INSTALL_DIR/#\~/$HOME}"
        # Escape & and \ in the replacement to prevent sed reinterpretation
        local escaped="${expanded//[&\\/]/\\&}"
        # Use # as delimiter to avoid conflicts with path separators; escape it if present
        local delim="#"
        [[ "$escaped" == *"$delim"* ]] && delim="@"
        sed -i.bak -e "s${delim}@\\.opencode/context/${delim}@${escaped}/context/${delim}g" \
                   -e "s${delim}\\.opencode/context${delim}${escaped}/context${delim}g" "$dest"
        rm -f "${dest}.bak"
      fi

      if [[ "$file_existed" == true ]]; then
        ok "Updated: ${type}:${id}"
      else
        ok "Installed: ${type}:${id}"
      fi
      installed=$((installed + 1))
    else
      err "Failed: ${type}:${id} ($path)"
      failed=$((failed + 1))
    fi
  done

  echo ""
  echo -e "  Installed: ${GREEN}${installed}${NC}"
  [[ $skipped -gt 0 ]] && echo -e "  Skipped: ${CYAN}${skipped}${NC}"
  [[ $failed -gt 0 ]] && echo -e "  Failed: ${RED}${failed}${NC}"
  echo ""

  if [[ $failed -gt 0 ]]; then
    err "Installation incomplete: $failed component(s) failed."
    exit 1
  fi
  if [[ $installed -eq 0 && $skipped -eq 0 ]]; then
    err "Nothing installed: 0 of ${#RESOLVED_ORDER[@]} components were written (all missing or unresolved)."
    exit 1
  fi
}

# ── Error Handling ───────────────────────────────────────────────────────────

handle_error() {
  err "Installation failed. Changes may be incomplete."
  exit 1
}
trap handle_error ERR
# Exclude DRY_RUN from error trapping (it's diagnostic, not side-effecting)
[[ "$DRY_RUN" == "true" ]] && trap - ERR

# ── Main ─────────────────────────────────────────────────────────────────────

# Load Developer profile seed components
SELECTED=()
while IFS= read -r comp; do
  [[ -n "$comp" ]] && SELECTED+=("$comp")
done < <(jq_exec '.profiles.developer.components[]' "$REGISTRY")

if [[ ${#SELECTED[@]} -eq 0 ]]; then
  err "Developer profile not found in registry.json"
  exit 1
fi

if [[ "$DRY_RUN" == "true" ]]; then
  dry_run
else
  install_components
  ok "Done. Components installed to ${CYAN}${INSTALL_DIR}${NC}"
fi
