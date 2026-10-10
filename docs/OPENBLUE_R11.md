# OpenBlue R11: governed logical equipment and connectivity

## Scope
The R11 device graph is an **unverified, human-authored proposal**, not a network scanner, switch configurator or installer certificate.

- Add conceptual 1U switches to valid unoccupied slots in existing R10 racks. Allow 8/16/24/48 nominal switch ports.
- An operator selects a *hypothetical* media/interface at each port: RJ45 1G, RJ45 2.5G, or SFP+ 10G. No actual device capabilities have been checked.
- Propose one logical link per switch port. Link targets may be another unused switch port or one unclaimed patch-panel port in the R10 inventory.
- Reject identical endpoint reuse, switch self-port loops, nonexistent switches, nominal RJ45 panel termination directly from an SFP+ interface, incompatible switch-to-switch port types, duplicate IDs and record overflows.
- Treat patch-panel mapping as a speculative patch cord. Never imply that nominal port type establishes a compatible device, a validated cable, or an installed connection.
- Cross-check R10 rack anchoring and occupied 1U panel slots at runtime. Existing logical switches are marked stale on rack deletion, hub movement or an R10 panel later consuming the same U slot. Linked targets are flagged when a patch panel disappears or its R10 port has not been assigned to any schematic drop.
- R10/R9 data is read only. Per-link review distinguishes `proposed-uplink`, `proposed-patch`, `panel-port-unallocated`, `pathway-review` and stale/missing infrastructure. No automatic reassignment or edit to R10 allocations.

## Sidecar and bounds
- New schema `openblue.logical-topology/1`; browser storage `openblue/logical-topology-v1`.
- Maximum 16 switches, 200 proposed links, 48 ports per switch; independent JSON input cap 500KB, bounded IDs and names; explicit supported port types.
- Unlike canonical blueprint JSON, logical topology does not belong in `openblueprint.project/1`. Keep `openblueprint.evie-proposal/1`, R7 room, R9 paths and R10 racks unchanged.
- Export topology as a separate JSON artifact. Import is validated, checked against live rack and panel references, and needs explicit human confirmation before replacing local data.
- Import, clear, restore sample or EVIE approval resets this active sidecar. CAD undo/redo does not restore separate logical-topology transactions; export backups first.
- No network access, credentials, active discovery, SNMP, LLDP, port provisioning or external API calls.

## Non-goals and verifiability
Conceptual ports are *not* verified hardware ports, patch cord connections, PoE capacity, transceiver compatibility, VLANs, L2/L3 links, routing protocols, topology discovery, cable qualification, regulatory compliance, or installation sign-off. The nominal patch panel is modeled as copper RJ45 only; actual connector/media compatibility requires independent survey.

## Acceptance
1. Create a switch only in a free R10 rack 1U position. Reject overlaps with other switches or existing patch panels; flag if a subsequent R10 edit creates a collision.
2. Map a switch port to an R10 patch-panel port and observe its R10 drop assignment (if present); free and allocated totals update without editing R10 data.
3. Attempt duplicate switch-port or patch-port allocation and mismatched RJ45/SFP interface: refuse without an untracked network change.
4. Create two switches with matched nominal port kinds and connect a switch-to-switch uplink; delete one and verify dangling edges are cascaded away.
5. Move rack hub, delete panel, empty R10 panel port or remove rack: fail closed with warnings, not silent remapping.
6. Import/export bounded JSON, reject malformed/duplicate data; reload localStorage; verify separate project/EVIE schema invariants and reset on replacement.
7. GitHub CI `npm ci`, `npm test`, `npm run build`; manual browser smoke for port-grid click, interface selector, proposal creation/deletion and sidecar persistence.
