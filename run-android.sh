#!/bin/bash
set -e

ANDROID_SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
EMULATOR="$ANDROID_SDK/emulator/emulator"
ADB="$ANDROID_SDK/platform-tools/adb"
AVD="${1:-Pixel_8a}"

echo "▶ Starting Android dev environment (AVD: $AVD)"

# Start emulator if not already running
if ! "$ADB" devices | grep -q "emulator"; then
  echo "  Launching emulator..."
  "$EMULATOR" -avd "$AVD" -no-snapshot-load &
  EMULATOR_PID=$!

  echo "  Waiting for device to boot..."
  "$ADB" wait-for-device
  until "$ADB" shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; do
    sleep 2
  done
  echo "  Device ready."
else
  echo "  Emulator already running."
fi

# Start Metro in a new Terminal window
echo "  Starting Metro bundler..."
osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)' && yarn start\""

# Give Metro a moment to start
sleep 3

# Build and install the app
echo "  Building and installing app..."
yarn android

echo "✓ Done"
