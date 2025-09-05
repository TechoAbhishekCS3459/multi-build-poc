#!/bin/sh
set -e

echo "🔄 Injecting runtime NEXT_PUBLIC_* variables..."

replace_var() {
  VAR_NAME=$1
  PLACEHOLDER="__${VAR_NAME}__"
  VALUE=$(printenv $VAR_NAME)

  if [ -n "$VALUE" ]; then
    echo "   ↳ Replacing $PLACEHOLDER with $VALUE"
    find .next -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec sed -i "s|$PLACEHOLDER|$VALUE|g" {} +
  else
    echo "   ⚠️ Warning: $VAR_NAME not set"
  fi
}

# Replace all NEXT_PUBLIC_* vars
replace_var NEXT_PUBLIC_REDIRECT_URL
replace_var NEXT_PUBLIC_CW_LOGIN_URL
replace_var NEXT_PUBLIC_CW_APP_URL
replace_var NEXT_PUBLIC_CW_DOMAIN

echo "✅ Runtime env injection complete"

exec "$@"
