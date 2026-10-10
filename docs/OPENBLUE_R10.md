# OpenBlue R10: Proposed rack and patch-panel inventory

## Purpose
Add a **human-entered, local-only schematic inventory** on top of R8 network-drop locations and R9 user-drawn proposed pathways. No actual network installation or rack hardware is created or verified.

## Capabilities
- Up to **8** racks, each provisionally 6U / 12U / 24U / 42U / 48U. Each rack is associated with a unique existing `network` symbol, selected as the reference hub in R8.
- Up to **12** patch panels per rack, each nominal 12/24/48 ports, each *assumed* to consume one unique 1U slot.
- Each schematic network drop can be mapped to exactly one panel port throughout the plan. Each rack/panel/port position can hold only one proposed drop. No implicit panel rewiring or switch provisioning.
- Operators can explicitly allocate or release a port; deleting a rack or panel removes associated proposed assignments after confirmation.
- Derived totals of nominal ports, allocated, and free. Cross-check R9 pathway `clear/review/stale` state by rack reference hub and destination network symbol. `proposal-clear` remains unverified.
- When a rack symbol moves or disappears, its old SI location anchor no longer matches and its assignments show a review-needed state. Missing destinations are likewise flagged.

## Data and safeguards
- Independent schema `openblue.rack-plan/1`, browser storage `openblue/rack-plan-v1`.
- Strict JSON validator: 500 KB limit, 8 racks, 12 panels/rack, 300 allocations, bounded IDs/names, unique rack IDs, unique anchor IDs, 1U slot collision rejection, unique port and drop assignment, no self-hub allocation.
- Anchors are stored in meters at five decimal places, preserving assignment references across feet-to-meter conversion without changing project files.
- JSON backup/export is separate from the original `openblueprint.project/1` blueprint, R7 room annotation sidecar, R9 pathway sidecar, and EVIE proposal formats.
- Import explicitly confirms replacement, rejects stale/missing hub anchors and missing assigned network drops, and does not execute untrusted code.
- Replacing/clearing a blueprint or approving an EVIE proposal clears the active rack sidecar; CAD Undo does not roll back separate rack metadata. Export it before replacement.

## What this **cannot** verify
Physical installation, real switch ports, patch cord endpoints, manufacturer panel/rack capacity, power, cooling, rack-unit consumption for other gear, actual cabling, network reachability, PoE, VLANs, cable qualification, electrical/fire code compliance, occupancy, or construction suitability. Each `network` symbol is one *schematic endpoint*, not an empirically verified jack.

## Acceptance gate
1. Create racks and 12/24/48-port 1U panels in bounded 6U/12U/24U/42U/48U inventory.
2. Reject invalid/non-network endpoints, rack-self mapping, duplicate port assignments, duplicate drop allocation and full rack slots.
3. Validate cascading delete, port release, nominal port totals and zero CAD geometry mutation.
4. Confirm moved/missing rack anchor and missing drop states; ft↔m preserves SI identity.
5. Correlate an operator R9 pathway; missing remains untraced and clear remains only proposal-clear.
6. Reject malformed, duplicate, oversized and mismatched imported JSON. Browser local save, backup and restoration are separate.
7. CI `npm ci && npm test && npm run build`; manual browser smoke: select R8 hub, create rack/panel, assign/release port, reload, import/export and EVIE flow.
