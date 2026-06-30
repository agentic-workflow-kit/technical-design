# Methodologies

Methodology profiles hold the design method used by the stable five-skill shell. The v1 default is
`ddd`.

See `../docs/methodology-profile-contract.md` for the required profile interface.

## Active default

- `ddd/` - DDD-first, ceremony-right-sized technical design.

## Future profiles

Future profiles may add another architecture methodology or a DDD subprofile such as event-sourced
DDD. They must implement the same profile contract and add eval fixtures before becoming selectable.
