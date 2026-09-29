#!/usr/bin/env bash
# Recompile the GSettings schema after editing the .gschema.xml.
set -euo pipefail
cd "$(dirname "$0")"
glib-compile-schemas schemas
echo "schemas compiled"
