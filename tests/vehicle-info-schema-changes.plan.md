# HR App Vehicle Info Schema Changes - Test Plan

## Application Overview

This plan covers three schema-change test scenarios for the HR app (React @ http://localhost:5173, Express @ http://localhost:3001):
(A) Personnel create drawer — new `vehicleEntry` radio ("כניסה עם רכב", כן/לא) in the מידע צבאי tab, alongside the pre-existing `vehicleNumber` text field ("מספר רכב") in the מידע אישי tab.
(B) Reserve Days Management list — new order-type filter combobox (default text "כל הסוגים"; options: צו 8 פתוח / צו 8 חד יומי / יממ שיגרה פתוח / יממ שיגרה חד יומי).
(C) Reserve Days Management create drawer — new READ-ONLY `vehicleStatus` display field ("סטטוס רכב") intended to live-render the selected employee's vehicleEntry/vehicleNumber via `ControlledDisplayField.tsx` as soon as an employee is picked from the `שם העובד` enhancedSelect combobox.

All three scenarios were manually walked through with Playwright browser tools against the live app to record ground-truth selectors and DOM structure. A genuine frontend defect was discovered in scenario C: the live lookup never updates (stays at the "—" placeholder indefinitely), even though the backend API returns correct data. This is documented in detail below and should be captured as a failing/expected-fail assertion (or fixed before writing a "value renders" test).

General navigation: home page (http://localhost:5173) shows sidebar "Main Menu" with group cards; clicking "משאבי אנוש" card navigates to `/personnel/6a53a6e2b7e50bd00231d0fc` (the personnel list); clicking "צווי מילואים" card navigates to `/reserve_days_management/6a53a6e2b7e50bd00231d105` (the reserve days list). Both list pages have a page-header button matching the group's Hebrew name (e.g. `getByRole('button', { name: 'משאבי אנוש' })` / `'צווי מילואים'`) that opens the create drawer at `.../new`.

Known environment gotchas (see project memory `reserve-day-e2e-create-flow.md`):
- The `reserve_days_management` form has a `noOverlap` business rule keyed on employee + date range; picking a random employee/date range for a new order can collide with dense seed data and cause a 409. When writing a real create-flow test for Scenario C, prefer freshly-created personnel with no existing reservations, or pick a distinctive/far-future date range.
- Chakra v3 radio inputs are visually hidden and click-intercepted; click the **visible label text/span**, not the `radio` role element directly, OR click the radio role element (works when scoped precisely — see below; in this session `radio.click()` via ref worked when the ref pointed at the label text node, effectively the same fix).
- Radio inputs DO have real `name`/`id` attributes reflecting the field key (e.g. `name="vehicleEntry"`), so `page.locator('input[name="vehicleEntry"][value="true"]')` is also a valid, robust locator alternative to text-based clicking.
- Untouched select/radio fields with schema `defaultValue` are NOT persisted on create (see apps/frontend/CLAUDE.md) — always select values explicitly.


## Test Scenarios

### 1. Personnel - vehicle info fields (Test A)

**Seed:** `tests/seed.spec.ts`

#### 1.1. Create personnel with vehicleNumber (personal info tab) and vehicleEntry=כן (military info tab)

**File:** `tests/personnel/create-with-vehicle-info.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 and wait for the sidebar 'Main Menu' to render (text 'משאבי אנוש' visible).
  2. Click the group card with text 'משאבי אנוש' / 'Employee Management' (role=group, filter hasText 'משאבי אנוש'). This navigates to /personnel/6a53a6e2b7e50bd00231d0fc.
  3. Click the page-header add button: getByRole('button', { name: 'משאבי אנוש' }) (the button located next to the 'משאבי אנוש' heading in the page header, distinct from the sidebar group card). This navigates to /personnel/6a53a6e2b7e50bd00231d0fc/new and opens a dialog (role=dialog) with heading 'personnel' and a 'NEW' badge.
  4. Confirm the drawer tablist has 4 tabs in this order: 'מידע מקצועי' (selected by default), 'מידע צבאי', 'מידע אישי', 'היסטוריית נוכחות'.
  5. Click tab role=tab name='מידע אישי' to switch to the Personal Information tab.
  6. Fill required fields by CSS name attribute selector (robust, confirmed present on all text inputs): input[name="firstName"].fill(<unique first name>), input[name="lastName"].fill(<unique last name>), input[name="personalNumber"].fill(<unique numeric string, e.g. Date.now() suffix>), input[name="phone"].fill('0501234567'), input[name="email"].fill(<unique email>).
  7. In the same tab, fill the vehicleNumber field: input[name="vehicleNumber"].fill('12-345-67'). This field's Field.Root group has label text 'מספר רכב' (label ref sits just above the textbox inside the same `group` container) — it is the 9th group/field in the מידע אישי tab, right before the 'כללי' (general notes) field and the 'סטטוס' radio group.
  8. Click tab role=tab name='מידע צבאי' to switch to the Military Information tab.
  9. Locate the vehicleEntry radio group using ONE of these two equally-reliable, mutually exclusive scoping strategies (see 'DOM/selector findings' below for why this is safe): (a) role/accessible-name based: page.getByRole('group', { name: 'כניסה עם רכב' }) — Playwright resolves the accessible name from the <legend> text inside the fieldset, so this ONLY matches the vehicleEntry fieldset, never the 'האם ניתן לזמן למילואים' (canBeRecited) fieldset which has a different legend text. (b) DOM attribute based: page.locator('input[name="vehicleEntry"][value="true"]') — the radio's real name attribute is 'vehicleEntry' (the other radio group's inputs have name='canBeRecited'), so this is unambiguous without any scoping container needed at all.
  10. Within the scoped vehicleEntry group/locator, click the 'כן' option: e.g. page.getByRole('group', { name: 'כניסה עם רכב' }).getByText('כן', { exact: true }).click() (clicking the visible label span avoids the Chakra hidden-input click-interception issue), OR page.locator('input[name="vehicleEntry"][value="true"]').click({force: true}) if using the attribute locator (Chakra radio inputs are visually hidden so force-click or label-click is required).
  11. Assert the radio is now checked: expect(page.locator('input[name="vehicleEntry"][value="true"]')).toBeChecked().
  12. Assert the sibling/other radio group ('האם ניתן לזמן למילואים') is unaffected: expect(page.locator('input[name="canBeRecited"][value="true"]')).not.toBeChecked() and expect(page.locator('input[name="canBeRecited"][value="false"]')).not.toBeChecked() (Untouched radios stay unchecked; this proves the two radio groups are correctly isolated in the DOM.)
  13. Click the 'Create' button: page.getByRole('button', { name: '✨ Create' }) (note the button label includes a leading sparkle emoji '✨ Create' — match by regex /Create/ or exact '✨ Create' string). The button is disabled until all required fields are valid; it becomes enabled once firstName/lastName/personalNumber/phone/email are filled.
  14. Wait for the success toast: page.getByText('Form submitted successfully') or the notification region status='Success'.
  15. Confirm the drawer closed and the personnel list page 'Total Personnel' metric paragraph incremented by 1 versus the value recorded before creation.

**Expected Results:**
  - The drawer opens at /personnel/<formId>/new with 4 tabs; the מידע אישי tab contains a 'מספר רכב' text input (name="vehicleNumber") and the מידע צבאי tab contains a 'כניסה עם רכב' radio fieldset (input name="vehicleEntry") that is a SEPARATE fieldset from the 'האם ניתן לזמן למילואים' radio fieldset (input name="canBeRecited") — both render כן/לא options but are trivially distinguishable via legend accessible-name or the radio's name attribute.
  - Selecting 'כן' checks input[name="vehicleEntry"][value="true"] only; the canBeRecited radios remain unchecked, proving no cross-contamination between the two כן/לא radio groups.
  - Submitting shows a 'Success' / 'Form submitted successfully' toast, the drawer closes, and the new record is persisted with formData.vehicleEntry === true and formData.vehicleNumber === '12-345-67' (verifiable via GET http://localhost:3001/api/formsubmission?formId=6a53a6e2b7e50bd00231d0fc&filters={"personalNumber":"<value>"}).

### 2. Reserve Days Management - order type filter (Test B)

**Seed:** `tests/seed.spec.ts`

#### 2.1. Filter reserve days list by order type via 'כל הסוגים' combobox, then clear filters

**File:** `tests/reserve-days/order-type-filter.spec.ts`

**Steps:**
  1. Navigate to http://localhost:5173 and click the sidebar group card with text 'צווי מילואים' / 'Reserve Days Management' (role=group). This navigates to /reserve_days_management/6a53a6e2b7e50bd00231d105.
  2. Record the current 'Showing 1 to N of TOTAL entries' pagination text (baseline total, e.g. 1064) and confirm the 'Clear Filters' button (role=button name='Clear Filters') is disabled initially.
  3. Locate the order-type filter combobox: page.getByRole('combobox').filter({ hasText: 'כל הסוגים' }) — this is the SECOND filter combobox in the toolbar (the first is the request-status filter defaulting to 'כל הבקשות'); they are siblings inside the same filter-bar container, each its own `generic` wrapper with a `combobox` child.
  4. Click the 'כל הסוגים' combobox to open its listbox.
  5. Assert the listbox (role=listbox, becomes [active] after opening) contains exactly 5 options in this order: 'כל הסוגים' (currently selected), 'צו 8 פתוח', 'צו 8 חד יומי', 'יממ שיגרה פתוח', 'יממ שיגרה חד יומי'.
  6. Click option role=option name='צו 8 פתוח'.
  7. Assert the combobox trigger text changed from 'כל הסוגים' to 'צו 8 פתוח' (the inner generic text node updates).
  8. Assert the table's every visible row's 'סוג צו' column cell shows 'צו 8 פתוח' (no other order-type value should appear).
  9. Assert the 'Showing 1 to 10 of X entries' total decreased from the baseline total (confirmed in this session: 1064 -> 537), and the 'Clear Filters' button is now enabled.
  10. Confirm a GET request fired to /api/formsubmission?...&filters=%7B%22orderType%22%3A%228open%22%7D (or equivalent URL-encoded filters param containing the orderType key) — use page.waitForResponse or the browser_network_requests equivalent in the real test to assert the filter param round-trips to the backend.
  11. Click the 'Clear Filters' button (role=button name='Clear Filters').
  12. Assert the order-type combobox trigger text reset to 'כל הסוגים', the 'Clear Filters' button is disabled again, and the total entries count reverted to the original baseline total (1064 in this session).

**Expected Results:**
  - The order-type filter combobox exists with default text 'כל הסוגים' and exposes exactly the 4 documented order-type options plus the 'כל הסוגים' reset option in its listbox.
  - Selecting an option filters the table (row count / total entries decreases, every row matches the selected סוג צו) and triggers a network request with an orderType filter param.
  - 'Clear Filters' fully resets both the order-type combobox display text and the table back to the unfiltered baseline, and its own disabled state toggles correctly (disabled when no filter active, enabled when any filter active).

### 3. Reserve Days Management - vehicle status live lookup (Test C)

**Seed:** `tests/seed.spec.ts`

#### 3.1. Selecting an employee with vehicleEntry=true should live-render vehicleStatus (כן + vehicle number) without saving

**File:** `tests/reserve-days/vehicle-status-lookup.spec.ts`

**Steps:**
  1. Precondition: ensure a personnel record exists with formData.vehicleEntry === true and a non-empty formData.vehicleNumber. Either run Test A first (creates personnel with vehicleEntry=true, vehicleNumber='12-345-67'), or seed directly via POST http://localhost:3001/api/formSubmission/create with body { formId: '6a53a6e2b7e50bd00231d0fc', formName: 'personnel', formData: { firstName, lastName, personalNumber: '<unique>', phone: '0501234567', email: '<unique>@example.com', vehicleEntry: true, vehicleNumber: '12-345-67' } } (confirmed 201 Created in this session; required fields for personnel are firstName/lastName/personalNumber/phone/email based on Create-button enablement observed in Test A — vehicleEntry/vehicleNumber are optional booleans/strings, isActive was NOT required to get a 201 in this session's direct personnel API test).
  2. Navigate to http://localhost:5173, click the 'צווי מילואים' sidebar group card, then click the page-header button page.getByRole('button', { name: 'צווי מילואים' }) to open the create drawer at /reserve_days_management/6a53a6e2b7e50bd00231d105/new (dialog, heading 'reserve_days_management', badge 'NEW').
  3. Locate the 'סטטוס רכב' display field BEFORE selecting an employee: it is the second-to-last field in the single tab 'פרטי ימי מילואים', rendered as a Field.Root (role=group) containing a <label> with text 'סטטוס רכב' and, when no employee is selected, a single <p> element with text '—' (em dash) as its only content — NOT a Flex of Text elements yet at this stage. Selector: page.getByRole('group').filter({ hasText: 'סטטוס רכב' }) scoped further with .locator('p') for the placeholder, or more precisely target the label id in a DOM query since Field.Label auto-generates an id like 'field:::rNN:::label' (not stable across renders — prefer the text-based group filter for real tests).
  4. Click the 'שם העובד' combobox: page.getByRole('combobox', { name: 'שם העובד' }) (placeholder text inside is 'חפש ובחר עובד'). This opens a listbox (role=listbox, name='שם העובד') containing a nested textbox with placeholder/name 'Search...' plus up to ~100 paginated personnel options, each option rendering firstName/lastName/personalNumber as 3 separate <p> children.
  5. Type the target personnel's personalNumber into the Search textbox: page.getByRole('textbox', { name: 'Search...' }).fill('<personalNumber>'). Confirm a helper text 'Found 1 results' (or similar) appears and the option list narrows to exactly one option matching '<firstName> <lastName> <personalNumber>'.
  6. Click that single filtered option: page.getByRole('option', { name: '<firstName>' }) (or a more specific compound name match).
  7. Confirm the combobox trigger now displays the selected employee's firstName/lastName/personalNumber (3 stacked <p> tags) in place of the placeholder text, and that a POST request fired to /api/formFields/get/options/6a53a6e2b7e50bd00231d105/employeeName/byIds (confirmed in this session — this call powers the combobox's OWN display value, it is a DIFFERENT request from the one the vehicleStatus field is supposed to make).
  8. KNOWN DEFECT TO ASSERT/DOCUMENT (see 'Investigation notes' below): wait up to ~2s (page.waitForTimeout or a network-idle wait) and then check whether the 'סטטוס רכב' field's content changed from the placeholder '—' <p> to a Flex of Text elements showing 'כן' and '12-345-67'. In this investigation session, as of 2026-07-16, IT DID NOT UPDATE — the field remained stuck at the single '—' paragraph indefinitely, and no POST to /api/formFields/get/options/6a53a6e2b7e50bd00231d105/vehicleStatus/byIds was ever observed in the network log, even though manually calling that exact endpoint with the correct personnel _id via fetch() returns the correct payload: {"options":[{"value":"<id>","label":"true 12-345-67","name":"vehicleStatus","metadata":{"vehicleEntry":true,"vehicleNumber":"12-345-67"}}]}. Until this frontend bug (likely in ControlledDisplayField.tsx's useWatch/sourceField wiring, or in how FormGenerator registers the 'vehicleStatus' field's sourceField='employeeName' watch) is fixed, write this as either (a) a documented xfail/skip with a comment linking to this investigation, or (b) a direct regression test asserting the CURRENT (broken) behavior — field stays at '—' — so any future fix is caught as a test change, whichever the team prefers.
  9. If/when the bug is fixed, the correct assertions to use once the field renders values are: within the vehicleStatus group locator, assert exactly two Text nodes appear inside a Flex container — page.getByRole('group').filter({ hasText: 'סטטוס רכב' }).locator('p', { hasText: 'כן' }) for the boolean-rendered-as-כן/לא value, and .locator('p', { hasText: '12-345-67' }) for the raw vehicleNumber string value. Both are plain <p class="chakra text"> (Chakra Text renders as <p> by default) inside a <div> Flex with gap='3', which is itself inside the same Field.Root (role=group) as the 'סטטוס רכב' <label> — scoping via that group filter safely avoids collision with any other 'כן' text elsewhere on the page (e.g. the 'סוג צו' radio options, or other pages' radios), since this scoping is local to the single vehicleStatus Field.Root container which has no nested radio/'כן' text anywhere else.

**Expected Results:**
  - BEFORE selecting an employee: the 'סטטוס רכב' Field.Root renders <label>סטטוס רכב</label> + a single <p>—</p> placeholder (confirmed exact DOM: `<div role="group" class="chakra-field__root ..."><label ...>סטטוס רכב</label><p class="css-l0zmib">—</p></div>`).
  - AFTER selecting an employee with vehicleEntry=true and vehicleNumber set: EXPECTED (per spec) behavior is the placeholder <p> is replaced by a Flex of Text elements showing 'כן' and the vehicle number, without needing to save the record first. ACTUAL (observed, deviation): as of this investigation, the field does NOT update — it remains showing '—' indefinitely (waited 1s+, and separately confirmed no relevant network request for vehicleStatus/byIds ever fires), despite the backend API (POST /api/formFields/get/options/6a53a6e2b7e50bd00231d105/vehicleStatus/byIds) correctly returning the expected metadata when called directly with the personnel _id. This is a frontend defect, not a backend/data defect, and should be raised to the developer before writing a 'renders correctly' regression test; in the interim, a test can assert the (broken) current behavior to prevent silent regressions elsewhere, or be marked as expected-to-fail pending a fix.
