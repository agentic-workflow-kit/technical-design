# Apache Fineract Loan Lifecycle Brief

## Goal

Design one narrow Apache Fineract loan-account lifecycle slice. The design should be DDD-heavy
enough to protect loan-account state transitions, charge rules, repayment transactions, accounting,
and business events without modeling all of Fineract.

## Source Facts

| ID        | Fact                                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SRC-001` | A loan product is a template used when creating a loan; many template values can be overridden during loan creation.                              |
| `SRC-002` | Loan applications progress through commands such as submit, approve, reject, withdraw, undo approval, and disburse.                              |
| `SRC-003` | Loan repayment is recorded through a loan transaction command with `transactionDate` and `transactionAmount`.                                    |
| `SRC-004` | Write-off and foreclosure are loan transaction commands that change closed or terminal loan state.                                                |
| `SRC-005` | Loan charge products can be associated with loan products or individual loan accounts to automate fees and penalties through the loan lifecycle.   |
| `SRC-006` | Loan charge APIs distinguish charge product management (`/v1/charges`) from loan charge management (`/v1/loans/{loanId}/charges`).               |
| `SRC-007` | Loan charge operations include adding charges to loans and command operations such as waive and pay.                                             |
| `SRC-008` | Charge validation includes currency matching, due dates within the loan term, percentage ranges, penalty requirements, and disbursement-charge timing. |
| `SRC-009` | Loan lifecycle and transaction processing can trigger business events and accounting activity such as balance-changed events, accrual processing, and journal entries. |
| `SRC-010` | This fixture excludes underwriting, credit scoring, client onboarding, full product configuration, and all Fineract modules outside the narrow loan lifecycle slice. |

## Constraints

- Prefer `architecture_mode: tactical-ddd`.
- Use tactical DDD where justified: aggregate ownership, commands, state transitions, charge
  invariants, transaction dates, business events, and accounting seams.
- Do not collapse loan product template ownership into loan account lifecycle ownership.
- Treat charge mutation after approval/disbursement as constrained by lifecycle and validation
  rules, not a free-form edit surface.
