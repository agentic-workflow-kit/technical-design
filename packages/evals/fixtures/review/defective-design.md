---
methodology: ddd
methodology_version: "1"
design_status: draft
ddd_depth: ports-and-adapters
round: 1
---

# Technical Design - Defective Payment Authorization

## Planner Handoff Summary

This design is ready for planning. Use the sections below for details.

## Context Map

| Context | Owns | Reads | Does Not Own |
|---|---|---|---|
| Payment Authorization | payment state | order total |  |

## Invariant and State Matrix

| Invariant / Predicate | Source operands | Enforced by | Failure token |
|---|---|---|---|
| approved amount matches order | approvedAmount | PaymentService | payment-amount-invalid |

## Ports, Adapters, and Public API

PaymentGatewayPort is public.

## Testing and Enforcement

```json
{
  "layers": [
    { "name": "domain", "path": "src/domain" },
    { "name": "infrastructure", "path": "src/infrastructure" }
  ],
  "forbidden": [
    {
      "from": "domain",
      "to": "infrastructure",
      "reason": "Domain cannot import infrastructure."
    }
  ]
}
```
