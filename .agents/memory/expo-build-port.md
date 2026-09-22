---
name: Expo build port isolation
description: Environment-specific port separation between the mockup preview and Expo production bundle generation.
---

The workspace's mockup preview commonly occupies port 8081. The ActionLayer Expo build script therefore uses a separate configurable Metro port, defaulting to 8082, and builds its bundle, manifest, and asset URLs against that same port.

**Why:** Running the repository build while the managed mockup workflow was active caused Expo to ask for an alternate port interactively and time out in non-interactive builds.

**How to apply:** Keep `EXPO_BUILD_PORT` available for unusual environments, and update every Metro health, bundle, manifest, and asset URL in the build script together if the default changes.