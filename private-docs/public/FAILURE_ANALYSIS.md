# Critical Failure Analysis - Webhook Integration

## Date: August 11, 2025

## Goal
Get the OpenZeppelin Monitor to send webhooks to the Relayer plugins when blockchain events are detected. This was ALREADY WORKING and documented in WORKING_DEMO.md.

## What Was Working
- Monitor was detecting Paused/Unpaused events
- Monitor was sending webhooks to `http://localhost:8080/api/v1/plugins/pause-handler/call`
- The format that worked used `message` field in the webhook trigger config

## What I Did Wrong

### 1. Misread the Documentation
- I fetched the OpenZeppelin Relayer SDK docs which showed plugins expect `params` field
- I assumed the Monitor webhook trigger needed to send `body: { params: {...} }`
- **WRONG**: The Monitor has its own format - it uses `message` field, not `body`

### 2. Broke Working Configuration
- Changed from working `message` field to non-existent `body` field
- Monitor now fails to parse the trigger config: "data did not match any variant of untagged enum TriggerTypeConfig"
- The Monitor doesn't support a `body` field at all

### 3. Ignored Context
- WORKING_DEMO.md clearly showed the `message` field format that worked
- Previous conversations showed this exact format working
- I ignored this and tried to "fix" something that wasn't broken

### 4. Created Wrong Mental Model
- I conflated the Monitor's webhook trigger format with the Relayer's plugin API format
- Monitor sends its own format → Relayer receives and transforms it
- I tried to make the Monitor send the Relayer's expected format directly

## The Actual Problem
The issue was NOT the Monitor's webhook format. The Monitor sends `message` and that's correct.
The issue was likely:
1. The Relayer plugin needs to handle whatever the Monitor sends
2. OR there's a transformation layer in between
3. OR the plugin just needs to accept the data in whatever format it arrives

## What Should Have Been Done
1. Keep the `message` field format that was working
2. Update the PLUGIN to handle the webhook data correctly
3. Test incrementally - don't change both sides at once
4. Read the actual Monitor source code to understand its webhook format

## Current State
- Monitor config is broken due to invalid `body` field
- Need to revert to `message` field format
- Need to fix the plugin side to handle the webhook properly

## Lesson
When something is working, understand WHY before changing it. Don't assume documentation for one component (Relayer SDK) applies to another component (Monitor).

## Immediate Fix Needed
```json
{
  "emergency_pause_webhook": {
    "name": "Pause Event Detected",
    "trigger_type": "webhook",
    "config": {
      "url": {
        "type": "plain",
        "value": "http://localhost:8080/api/v1/plugins/pause-handler/call"
      },
      "method": "POST",
      "headers": {
        "Authorization": "Bearer A21E413E-DF82-4FFB-8525-51971CB00F70",
        "Content-Type": "application/json"
      },
      "message": {
        "title": "Pause Event Detected",
        "body": "Contract was paused at block ${block.number} by ${events.0.args.account}"
      }
    }
  }
}
```

Then fix the PLUGIN to extract data from whatever format the webhook sends.