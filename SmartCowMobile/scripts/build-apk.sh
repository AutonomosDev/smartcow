#!/usr/bin/env bash
# build-apk.sh — genera APK debug de SmartCow Mobile para instalar en Android físico
# Requiere: Android SDK con build-tools instalado, JAVA_HOME apuntando a JDK 17+
#
# Uso:
#   chmod +x scripts/build-apk.sh
#   ./scripts/build-apk.sh
#
# El APK queda en: android/app/build/outputs/apk/debug/app-debug.apk

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
ANDROID_DIR="$ROOT/android"

echo "==> Verificando entorno..."

if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  echo "ERROR: ANDROID_HOME no está definido."
  echo "  Instala Android Studio o el CLI SDK y exporta:"
  echo "  export ANDROID_HOME=\$HOME/Library/Android/sdk"
  echo "  export PATH=\$PATH:\$ANDROID_HOME/emulator:\$ANDROID_HOME/tools:\$ANDROID_HOME/platform-tools"
  exit 1
fi

SDK="${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
echo "  SDK: $SDK"

# Crear local.properties si no existe
if [ ! -f "$ANDROID_DIR/local.properties" ]; then
  echo "sdk.dir=$SDK" > "$ANDROID_DIR/local.properties"
  echo "  Creado android/local.properties"
fi

echo "==> Instalando dependencias JS..."
cd "$ROOT"
npm install --legacy-peer-deps

echo "==> Bundling JS..."
cd "$ANDROID_DIR"
./gradlew assembleDebug --no-daemon 2>&1

APK="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
  SIZE=$(du -sh "$APK" | cut -f1)
  echo ""
  echo "=== APK generado exitosamente ==="
  echo "  Path: $APK"
  echo "  Size: $SIZE"
  echo ""
  echo "Para instalar en dispositivo Android conectado:"
  echo "  adb install -r $APK"
else
  echo "ERROR: APK no encontrado en $APK"
  exit 1
fi
