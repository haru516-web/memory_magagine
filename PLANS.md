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
