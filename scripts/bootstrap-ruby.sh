#!/usr/bin/env bash
# Source this file to put the pinned Ruby on PATH. No asdf/ruby-build release
# catalogue is required; the archive and checksum come from ruby-lang.org.

k365_ruby_valid() {
  "$1" -ropenssl -rpsych -e 'abort "Expected Ruby 4.0.8" unless RUBY_VERSION == "4.0.8"' >/dev/null 2>&1
}

k365_bootstrap_ruby() {
  local k365_root k365_cache k365_prefix k365_archive k365_sha k365_actual k365_current k365_build_dir
  k365_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" || return 1
  k365_cache="${K365_RUBY_CACHE_DIR:-$k365_root/node_modules/.cache/ruby-runtime}"
  k365_prefix="$k365_cache/ruby-4.0.8-$(uname -s)-$(uname -m)"
  k365_archive="$k365_cache/ruby-4.0.8.tar.gz"
  k365_sha='0968e2ac4cbd6f1fd85d3092aed66cd3c2d8ba4a5e2493d6e6c6cb0c431897d2'

  # An already installed, fully functional 4.0.8 is sufficient for local work.
  k365_current="$(command -v ruby || true)"
  if [[ -n "$k365_current" ]] && k365_ruby_valid "$k365_current"; then
    k365_current="$("$k365_current" -rrbconfig -e 'puts RbConfig.ruby')" || return 1
    export PATH="$(dirname "$k365_current"):$PATH"
    hash -r
    printf 'Using Ruby 4.0.8: %s\n' "$k365_current"
    return 0
  fi

  if ! k365_ruby_valid "$k365_prefix/bin/ruby"; then
    mkdir -p "$k365_cache" || return 1
    if [[ ! -f "$k365_archive" ]]; then
      curl --fail --location --retry 3 --connect-timeout 20 \
        'https://cache.ruby-lang.org/pub/ruby/4.0/ruby-4.0.8.tar.gz' \
        --output "$k365_archive.part" || return 1
      mv "$k365_archive.part" "$k365_archive" || return 1
    fi
    if command -v sha256sum >/dev/null 2>&1; then
      k365_actual="$(sha256sum "$k365_archive")" || return 1
    elif command -v shasum >/dev/null 2>&1; then
      k365_actual="$(shasum -a 256 "$k365_archive")" || return 1
    else
      printf 'Ruby bootstrap requires sha256sum or shasum.\n' >&2
      return 1
    fi
    if [[ "${k365_actual%% *}" != "$k365_sha" ]]; then
      printf 'Ruby source SHA-256 mismatch; refusing to compile %s\n' "$k365_archive" >&2
      return 1
    fi
    k365_build_dir="$(mktemp -d "$k365_cache/build.XXXXXX")" || return 1
    printf 'Building verified Ruby 4.0.8 source into %s\n' "$k365_prefix"
    (
      set -e
      trap 'rm -rf "$k365_build_dir"' EXIT
      tar -xzf "$k365_archive" -C "$k365_build_dir"
      cd "$k365_build_dir/ruby-4.0.8"
      ./configure --prefix="$k365_prefix" --disable-install-doc
      make -j2
      make install
    ) || return 1
  fi

  if ! k365_ruby_valid "$k365_prefix/bin/ruby"; then
    printf 'Ruby 4.0.8 must load openssl and psych. Check OpenSSL and libyaml development headers.\n' >&2
    return 1
  fi
  export PATH="$k365_prefix/bin:$PATH"
  hash -r
  printf 'Using cached Ruby 4.0.8: %s\n' "$k365_prefix/bin/ruby"
}

k365_bootstrap_ruby
k365_bootstrap_status=$?
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  exit "$k365_bootstrap_status"
fi
return "$k365_bootstrap_status"
