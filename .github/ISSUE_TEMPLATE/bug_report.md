---
name: Bug Report
about: Create a report to help us improve
title: 'Bug: "Select Files" button does not open file picker'
labels: 'bug'
assignees: ''
---

## Bug Description

The "Select Files" button in the empty state does not trigger the file input dialog, while the "Load Images" button in the header works correctly. Both buttons should perform the same action (opening the file picker).

## Steps to Reproduce

1. Navigate to the app (with no images loaded)
2. Click the "Select Files" button in the empty state area
3. Observe that the file picker dialog does not open
4. Click the "Load Images" button in the header
5. Observe that the file picker dialog opens correctly

## Expected Behavior

Both buttons should open the file picker dialog and allow users to select image files.

## Actual Behavior

- "Load Images" button (header) ✅ Works correctly
- "Select Files" button (empty state) ❌ Does not open file picker

## Code Location

The issue is in `src/pages/Index.tsx`:
- **Working button** (lines 109-123): Header "Load Images" button
- **Broken button** (lines 158-169): Empty state "Select Files" button

## Technical Details

Both buttons use the same `handleFileChange` handler and are wrapped in `<label>` elements with hidden file inputs. The difference appears to be in how the Button component is rendered:
- "Load Images" uses `asChild` prop with a `<span>` wrapper
- "Select Files" is a direct Button component

## Environment

- OS: Windows 10
- Browser: [e.g., Chrome, Firefox, Edge]
- Node version: [if applicable]

## Additional Context

This is a UI/UX issue that affects the primary call-to-action when the app is first loaded, potentially confusing users who expect the "Select Files" button to work.
