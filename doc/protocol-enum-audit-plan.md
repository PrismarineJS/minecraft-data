# PC protocol enum audit and repair plan

## Objective

Correct the enum mappings introduced by PR #1295 so that every `protocol.yml`
and generated `protocol.json` describes the packet and Minecraft version it
actually represents. In particular, do not reuse an enum from one packet for a
different packet, and do not apply a later version's enum to older versions.

## Complete implementation scope

The PR touches four enum-bearing protocol concepts and one related feature
definition. All must be reviewed together:

| Scope item | Packet/schema field | Required treatment |
| --- | --- | --- |
| Client command | `packet_client_command.actionId` | Map the packet's own client-status enum; account for 1.8.9's third value, the 24w14potato exception, and the 26w14a addition. |
| Player/entity action | `packet_entity_action.actionId` | Use the version-specific player-command enum and numeric indexes; never use the client-command enum here. |
| Game event | `packet_game_state_change.reason` | Add only reasons defined by that Minecraft version, including the 1.20.2/1.20.3 boundaries and special 24w14potato value 15. |
| Clientbound difficulty | `packet_difficulty.difficulty` | Stable values 0–3: peaceful, easy, normal, hard. |
| Serverbound difficulty | `packet_set_difficulty.newDifficulty` | The same stable values 0–3, independently verified for versions where this packet exists. |
| Feature metadata | `entityActionUsesStringMapper` | Remove the old 1.21.6/latest-only flag once every affected schema exposes a string mapper. |

The generated `protocol.json` changes are outputs of these YAML changes, not
additional independent enum sources.

## Confirmed problems in PR #1295

## Historical enum walk

The audit starts at the earliest extracted release ref, `client1.8.9`, and
then compares each later release ref available in the repository. The class
names changed during the 1.8.9 → 1.13.2 protocol rename, so the old and new
paths are shown explicitly below.

### Client command

Earliest source:

```text
client1.8.9:
client/net/minecraft/network/play/client/C16PacketClientStatus.java
```

```text
0 PERFORM_RESPAWN
1 REQUEST_STATS
2 OPEN_INVENTORY_ACHIEVEMENT
```

The extracted `client1.13.2` source uses `CPacketClientStatus.java` and has
only `PERFORM_RESPAWN` and `REQUEST_STATS`. The renamed modern class is
`ServerboundClientCommandPacket.java`; it retains those two values through
1.21.11 and 25w46a. The special April Fools `client24w14potato` branch inserts
`SPROUT_RESPAWN` at index 1. The regular three-value form first appears in
`client26w14a` and remains in `clientlatest`.

Therefore the mapper must be scoped as follows:

| Versions | `packet_client_command` values |
| --- | --- |
| 1.7 through 16w35a / 1.11 | `perform_respawn`, `request_stats`, `open_inventory_achievement` |
| 17w15a / 1.12 through 25w46a / 1.21.11 | `perform_respawn`, `request_stats` |
| 24w14potato | `perform_respawn`, `sprout_respawn`, `request_stats` |
| 26w14a and later | the preceding two plus `request_gamerule_values` |

The protocol history records removal of `open_inventory_achievement` in
17w13b (protocol 319). The repository's next represented snapshot is 17w15a,
so 1.11 and 16w35a retain value 2 while 17w15a and 1.12-pre4 do not.

### Player/entity action

Earliest source:

```text
client1.8.9:
client/net/minecraft/network/play/client/C0BPacketEntityAction.java
```

Its enum order is:

```text
0 START_SNEAKING
1 STOP_SNEAKING
2 STOP_SLEEPING
3 START_SPRINTING
4 STOP_SPRINTING
5 RIDING_JUMP
6 OPEN_INVENTORY
```

By `client1.13.2`, the renamed `CPacketEntityAction.java` has:

```text
0 START_SNEAKING
1 STOP_SNEAKING
2 STOP_SLEEPING
3 START_SPRINTING
4 STOP_SPRINTING
5 START_RIDING_JUMP
6 STOP_RIDING_JUMP
7 OPEN_INVENTORY
8 START_FALL_FLYING
```

The modern `ServerboundPlayerCommandPacket.java` keeps nine entries through
1.21.5. The first two vanilla names change to `PRESS_SHIFT_KEY` and
`RELEASE_SHIFT_KEY` in the 1.15 line, without changing their indexes. The
1.15.2 mapped class confirms those names, while the extracted 1.14.4 class
still uses `START_SNEAKING` and `STOP_SNEAKING`. This Java identifier change
does not create new protocol values, so minecraft-data retains the stable
`start_sneaking` and `stop_sneaking` names. In 1.21.6 the two entries are
removed, shifting `STOP_SLEEPING` to index 0 and leaving a seven-entry enum.

The exact introduction point for `START_RIDING_JUMP`, `STOP_RIDING_JUMP`, and
`START_FALL_FLYING` must be derived from protocol history because the extracted
repository jumps directly from 1.8.9 to 1.13.2.

### Game event and difficulty

At `client1.8.9`, the source is `S2BPacketChangeGameState.java` and its event
field is a raw unsigned byte rather than a Java enum. The stable documented
values 0–8 can therefore be added as data mappings, but later values must be
version-scoped. Difficulty is likewise decoded through `EnumDifficulty` from
an unsigned byte and uses the stable values 0–3.

### 1. `packet_client_command` is confused with `packet_entity_action`

`packet_client_command` is `ServerboundClientCommandPacket`. Its vanilla
`Action` enum is:

```text
0 perform_respawn
1 request_stats
2 request_gamerule_values   # only in newer 26.x sources
```

The PR instead installs the player-action list (`press_shift_key`,
`start_sprinting`, etc.) on this packet, notably in 1.21.4. This is a wire
compatibility bug, not merely a naming issue: enum mappers serialize by list
index.

The extracted-client refs confirm two values through `client1.21.11` and
`client25w46a`; the third value is present by `client26.1-snapshot-5` and in
`clientlatest`.

### 2. `packet_entity_action` is not one enum for all versions

This packet is `ServerboundPlayerCommandPacket`.

The resulting stable minecraft-data mappings have these relevant ranges:

| Versions | Stable enum order |
| --- | --- |
| 1.9 through 1.21.5 | `start_sneaking`, `stop_sneaking`, `stop_sleeping`, `start_sprinting`, `stop_sprinting`, `start_riding_jump`, `stop_riding_jump`, `open_inventory`, `start_fall_flying` |
| 1.21.6 and later | `stop_sleeping`, `start_sprinting`, `stop_sprinting`, `start_riding_jump`, `stop_riding_jump`, `open_inventory`, `start_fall_flying` |

Vanilla's Java names for the first two entries changed in 1.15, but their
protocol meaning and positions remained stable until removal in 1.21.6.
Changing minecraft-data's names at that point would needlessly break the
cross-version enum API. All mapper names therefore use stable, vanilla-derived
action names instead of the PR's aliases such as `leave_bed`,
`start_horse_jump`, and `open_vehicle_inventory`.
The old `entityActionUsesStringMapper` feature recorded that only
1.21.6/latest exposed strings. It becomes obsolete once the earlier schemas
also use mappers, independently of the seven-entry enum boundary.

The older 1.7 and 1.8 schemas require their own historical mapping. In 1.7
`stop_sleeping` is 3 and `start_riding_jump` is 6; in 1.8 `open_inventory` is
6 and there is no `stop_riding_jump` entry.

### 3. Game-event reasons need version scoping

The common reasons 0–8 are stable. Later reasons must not be advertised in
schemas predating their introduction. The extracted sources establish these
boundaries:

| Reason | Name | First available source ref found |
| --- | --- | --- |
| 9 | `puffer_fish_sting` | 1.13.2; applied beginning with the 1.13 schemas |
| 10 | `guardian_elder_effect` | 1.8.9; applied beginning with 1.8 |
| 11 | `immediate_respawn` | absent in 1.14.4 and present in 1.16.4; applied beginning with 1.15 |
| 12 | `limited_crafting` | 1.20.2 |
| 13 | `level_chunks_load_start` | 1.20.3 |

The complete walk also found the intentional April Fools `client24w14potato`
event value 15. It must not be copied into normal 1.20/1.21 schemas.

The resulting historical ranges are: values 0–8 in 1.7; values 0–8 plus 10
from 1.8 through 1.12 (including represented snapshots before 1.13); values
0–10 in 1.13 and 1.14; value 11 added in 1.15; value 12 added in 1.20.2; and
value 13 added in 1.20.3.

### 4. Difficulty

The difficulty values 0–3 are stable and the PR's mapping is correct for the
versions where the difficulty fields exist. This change can be retained,
subject to the normal generated-file consistency check.

## Evidence and reproducible source checks

The upstream extracted-client repository provides refs for the important
boundaries, including:

```text
client1.13.2, client1.14.4
client1.20.2 through client1.20.6
client1.21.3 through client1.21.11
client25w45a, client25w46a
client26.1-snapshot-5 through client26.1
clientlatest
```

For each candidate transition, inspect the relevant vanilla class and use
`git log`, `git blame`, and a ref-to-ref diff. The packet class names to check
are:

```text
client/net/minecraft/network/protocol/game/ServerboundClientCommandPacket.java
client/net/minecraft/network/protocol/game/ServerboundPlayerCommandPacket.java
client/net/minecraft/network/protocol/game/ClientboundGameEventPacket.java
```

When a class is absent from an old extracted ref, use the corresponding
historical protocol documentation or mappings and record that source in the
change description rather than extrapolating from a modern enum.

## Implementation sequence

1. Complete the source audit and record exact version boundaries for game-event
   reasons and the 1.7/1.8 player-command enums.
2. Edit only the YAML source files. Define packet-specific, version-specific
   mappers for `packet_client_command`, `packet_entity_action`, game-event
   reasons, and difficulty.
3. Preserve unknown numeric values where the protocol can legally receive
   forward-compatible values; do not add names that vanilla does not define
   for that version.
4. Regenerate all affected `protocol.json` files using the repository's normal
   protocol compiler. Do not hand-edit generated JSON.
5. Add focused regression checks that assert both the mapper names and their
   numeric indexes for representative versions: 1.7, 1.8, 1.14.4, 1.20.2,
   1.21.5, 1.21.6, and latest/26.1.
6. Run the protocol generation/validation test suite and inspect the final diff
   for accidental changes to unrelated packets.

## Acceptance criteria

- No `packet_client_command` schema contains player movement actions.
- No `packet_entity_action` schema contains client-command actions.
- 1.7 and 1.8 use their historical numeric positions.
- 1.21.6+ uses the seven-entry player-command enum, while 1.21.5 and earlier
  use the nine-entry enum where supported.
- Game-event reason names are present only in versions where vanilla defines
  them.
- YAML and generated JSON agree for every affected version.
- Representative encode/decode tests prove that names serialize to the
  expected numeric values.

## Implementation status

The YAML corrections and regenerated JSON are now implemented. Focused
regression coverage is in `tools/js/test/protocolEnumMappings.js` and covers
packet separation, the client-command removal boundary, 1.7/1.8 player-action
indexes, release and snapshot game-event boundaries, and the 1.21.6
seven-entry transition.

The protocol build completed successfully. The focused enum tests pass (7
passing). The complete suite's substantive tests also passed; its only
reported failure was the existing global speed guard, which measured about
44.1 seconds against a 40-second limit in this environment.
