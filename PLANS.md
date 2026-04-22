Goal
- Add a new fixed post template that matches the attached reference layout: one large image box and four text boxes.
- Add a second fixed post template that matches the newer attached reference layout: one large image box and six text boxes.

Current Constraints
- Reuse the existing fixed-template architecture.
- Keep current routing, editor flow, and persistence format intact.
- Preserve only spatial relationships from the reference image, not the gray/pink colors.

Target Files
- docs/js/templates/index.js
- docs/js/templates/page9.js
- docs/js/templates/page10.js
- docs/css/compose.css

Implementation Steps
- Add a new template definition to the compose template registry.
- Implement the export/render layout for the new template with one image slot and four text fields.
- Implement the second export/render layout for the new template with one image slot and six text fields.
- Add compose-sheet CSS positions and thumbnail preview styling for the new template.

Validation Steps
- Build the app.
- Verify the template appears in the picker and matches the reference composition.

Open Questions
- None for MVP; use existing text fields `headline`, `subhead`, `body`, `date` and hide unused text fields.
## Opening Burn Variant

- Goal: Replace the opening screen with a new burn variant using the supplied background and logo assets.
- Constraints:
  - Keep existing route flow and opening sequence timing.
  - Use `docs/image/background/okinawa.png` for the background.
  - Use `docs/image/logo/b439a9c7-433e-4123-91c2-7d9eb952c1b4.png` for the logo.
  - Match the composition of `docs/references/images/opening_burn.png`.
  - Keep the central ripple effect and add a whole-screen shake/fade transition into the main page.
- Target files:
  - `docs/js/pages/opening.js`
  - `docs/css/opening.css`
  - `docs/js/app.js`
- Steps:
  - Add opening DOM layers for background, logo, subtitle, and effect canvas.
  - Rework opening sequence logic to animate the image-based logo and subtitle using the existing timing phases.
  - Add ripple, screen wobble, and fade-out transition.
  - Build and verify generated assets.

## Compose Flow Polish

- Goal: Restyle the `Post` flow so template selection, editing, and tag selection feel like one restrained full-screen editorial experience closer to the supplied mobile reference.
- Constraints:
  - Keep current routing, stage flow, and persistence intact.
  - Reuse existing compose renderer and CSS structure.
  - Do not redesign unrelated screens.
- Target files:
  - `docs/js/pages/compose.js`
  - `docs/css/compose.css`
  - `docs/css/layout.css`
- Steps:
  - Flatten the compose shell so the stages use the full mobile canvas instead of nested panel cards.
  - Rework the template selection stage into a larger preview + bottom selection rail.
  - Refine the edit stage to keep the page dominant and controls secondary.
  - Simplify the tags stage into a cleaner scrollable list with fixed submit action.
  - Build and verify on mobile-sized layout.
