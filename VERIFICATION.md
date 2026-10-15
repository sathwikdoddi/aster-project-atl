# Verification

Verified on October 15, 2026, with Node.js 22.14.0, Next.js 16.4.1, React 19.3.1, and TypeScript 5.9.3. Dependencies are installed and pinned in `package-lock.json`.

| Check               | Result                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`          | Passed: 6 tests covering mock schema, fictional sample labeling, partial dates, invalid dates, missing fields, duplicate identifiers, source references/URLs, and ordering. |
| `npm run typecheck` | Passed.                                                                                                                                                                     |
| `npm run build`     | Passed: optimized production build, TypeScript validation, and static page generation. Both JSON endpoints and the dynamic case route compiled successfully.                |
| `npm run test:e2e`  | Blocked before tests could execute: this sandbox denies opening `127.0.0.1:3100` (`listen EPERM`).                                                                          |

The browser suite is included for desktop and mobile. Run `npx playwright install chromium` and `npm run test:e2e` in a normal terminal. No browser preview, interaction assertions, or visual/device verification was completed in this sandbox. Responsive CSS and accessibility support have been implemented, but those require browser review.

The app has not been deployed and has no live datastore connection. The schema is a proposal pending discussion with 180 Consulting. All current records are fictional.
