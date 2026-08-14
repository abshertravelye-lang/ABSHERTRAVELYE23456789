/**
 * Dynamic Expo config — allows EAS_PROJECT_ID to be supplied as a CI/EAS
 * environment variable so the Expo project UUID does NOT need to be
 * hard-coded in the repository as a non-secret but still user-specific value.
 *
 * How to use:
 *   1. Run `eas init` once in this directory to create an Expo project and
 *      obtain its UUID.
 *   2. Add that UUID as a GitHub Actions secret named EAS_PROJECT_ID.
 *   3. The workflow's "Push secrets to EAS project" step injects it into the
 *      EAS build environment so this config can read it at build time.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const base = require("./app.json");

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    extra: {
      ...(base.expo.extra ?? {}),
      eas: {
        // EAS_PROJECT_ID is a non-secret Expo project UUID.
        // Set it as a GitHub Actions secret and Expo EAS secret so this
        // config receives it both during local dev and cloud builds.
        projectId: process.env.EAS_PROJECT_ID ?? "",
      },
    },
  },
};
