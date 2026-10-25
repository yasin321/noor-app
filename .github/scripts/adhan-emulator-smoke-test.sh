#!/usr/bin/env bash
set -euo pipefail

PACKAGE="com.noor.app"
RECEIVER="com.noor.app/.AdhanSmokeTestReceiver"
ACTION="com.noor.app.action.CI_TEST_PLAY_ADHAN"
LOG_FILE="/tmp/noor-logcat.txt"
: > "$LOG_FILE"

test_source() {
  local adhan_id="$1"
  local audio_url="$2"
  local source_log="/tmp/adhan-${adhan_id}.log"

  echo "===== Testing adhan source: ${adhan_id} ====="
  adb logcat -c
  adb shell am broadcast -n "$RECEIVER" -a "$ACTION" --es id "$adhan_id" --es title NoorTest --es audioUrl "$audio_url"
  sleep 18
  adb logcat -d > "$source_log"
  cat "$source_log" >> "$LOG_FILE"

  if ! grep -q 'ADHAN_PLAYBACK_STARTED' "$source_log"; then
    echo "ERROR: no ADHAN_PLAYBACK_STARTED confirmation for source: ${adhan_id}"
    grep -E 'ADHAN_PLAYBACK_FAILED|AUDIO_ASSET_MISSING_OR_INVALID_URL|FATAL EXCEPTION|MediaPlayer|NoorAlarm|AndroidRuntime' "$source_log" || true
    exit 1
  fi

  if grep -q 'ADHAN_PLAYBACK_FAILED\|AUDIO_ASSET_MISSING_OR_INVALID_URL' "$source_log"; then
    echo "ERROR: playback failure for source: ${adhan_id}"
    grep -E 'ADHAN_PLAYBACK_FAILED|AUDIO_ASSET_MISSING_OR_INVALID_URL' "$source_log"
    exit 1
  fi

  echo "PASS: playback-start confirmed for ${adhan_id}"
  adb shell am force-stop "$PACKAGE"
  adb shell monkey -p "$PACKAGE" 1 >/dev/null
  sleep 3
}

test_source "mahur_saeed" "https://upload.wikimedia.org/wikipedia/commons/a/ae/AzaanMaahur.ogg"
test_source "default" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Adhan.ogg"
test_source "makkah" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Beautiful_adhan.ogg"
test_source "madinah" "https://commons.wikimedia.org/wiki/Special:Redirect/file/33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg"
test_source "shia_traditional" "https://commons.wikimedia.org/wiki/Special:Redirect/file/Azan.ogg"

if grep -E 'supabaseUrl is required|FATAL EXCEPTION.*com\.noor\.app|Process: com\.noor\.app.*died' "$LOG_FILE"; then
  echo "ERROR: app startup/runtime error detected in emulator logs"
  exit 1
fi

echo "PASS: all 5 adhan sources reported playback start"
