# Reference Design: Fineract Loan Lifecycle

This reference is a comparison anchor, not an exact-output target.

## Architecture Mode

Use `tactical-ddd` with tactical DDD depth. The source has lifecycle commands, state transitions,
charge invariants, transaction dates, accounting seams, and business events.

## Bounded Contexts

- Loan Product Configuration owns the product template, default charge associations, and configurable
  loan terms used when a loan account is created.
- Loan Account Lifecycle owns application submission, approval, rejection, withdrawal, undo approval,
  disbursement, repayment posting, write-off, foreclosure, loan status transitions, and transaction
  dates.
- Loan Charges owns loan-account charge attachment, charge validation, waive/pay commands, and the
  constraint that charge changes obey loan lifecycle timing such as disbursement-charge timing.
- Accounting Integration owns journal entry posting, accrual processing, and accounting effects
  derived from loan transactions.
- Business Events owns emitted loan lifecycle and balance-change notifications for downstream
  integrations.

Loan Account Lifecycle reads product-template terms but does not own product configuration.
Loan Product Configuration does not own account state transitions. Underwriting and credit scoring
remain outside this slice.

## Required Behavior

A loan account starts from a submitted application and moves through commands such as approve,
reject, withdraw, undo approval, and disburse. Repayment is a loan transaction with a
`transactionDate` and `transactionAmount`. Write-off and foreclosure are transaction commands that
move the account toward closed or terminal states.

Loan charge products may be associated with loan products or individual loan accounts. Charge
product APIs such as `/v1/charges` are separate from loan-account charge APIs such as
`/v1/loans/{loanId}/charges`. Loan charge commands include waive and pay. Charge changes are
validated: currency must match, due dates must be within the loan term, percentage ranges must be
valid, overdue charges require penalty treatment, and disbursement charges are constrained before
loan disbursement.

Accounting and business events are not UI-only state. Loan lifecycle and transaction processing can
drive balance-changed events, accrual processing, journal entries, and downstream integration
notifications.

Underwriting, credit scoring, client onboarding, full product configuration, and unrelated Fineract
modules remain out of scope.
