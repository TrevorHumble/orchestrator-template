import { defineConfig } from 'vitest/config';

// globals: true is load-bearing: none of the ported tests in tests/ import
// describe/it/expect from vitest, so without this every suite dies with
// "ReferenceError: describe is not defined".
//
// retry + testTimeout exist for the .ps1-spawning tests this template ships
// (tests/check-freshness.test.js, tests/classify-dep-pr.test.js,
// tests/apply-branch-protection.test.js, tests/visual-approval.test.js,
// tests/commit-msg.test.js): a cold PowerShell/pwsh launcher start can run
// past vitest's 5000ms default under parallel load, so both are widened.
//
// coverage.include and coverage.thresholds are deliberately unset -- this
// template ships no instrumentable src/ yet. FILL: once a project adds one,
// add both here.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    retry: 2,
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
