# Cost guardrails

Your Despia backend ships with spend ceilings switched on. You do not configure anything to get
them, and you can lift any of them the moment you mean to. They exist for one reason: on
usage-billed platforms like Cloudflare there is no built-in "stop at this amount", so a single
bad loop, an AI-generated retry storm, or a model API called once per render can turn into a
five-figure bill overnight. Despia is built for people shipping AI-written backends, so the
framework is the brake.

## What you get without writing anything

Every deployed backend carries a guarded profile of per-day ceilings, counted in units the
runtime can enforce exactly, never in currency:

| Ceiling | Default (per day) |
|---|---|
| Requests served | 250,000 |
| Calls to each declared egress host | 25,000 |
| Messages pushed per queue | 50,000 (10,000 outstanding at once) |
| Database row writes | 500,000 |
| Database row reads | 2,500,000 |

A real small app never meets these numbers. A runaway loop meets them in minutes, gets refused,
and your bill stops moving.

The most important row is the egress one. Every outbound host your backend can call is already
declared in your `<server>` document (that is the security allowlist), so each one gets its own
call ceiling for free. The most expensive real-world runaway is not the hosting bill at all: it
is a paid model API such as OpenAI or Anthropic called inside a loop. With a 25,000-call daily
ceiling, that loop is refused while the damage is still lunch money.

## Raising, lowering, and opting out

Ceilings are your policy. Tune any of them with a `<budget>` row in the head of your `<server>`
document:

```dsx
<budget of="requests" per="day" max="1000000"/>
<budget of="egress:api.openai.com" per="hour" max="2000"/>
<budget of="queue:billing" max="unbounded" depth="500"/>
```

- `of` names the metered seam: `requests`, `data:reads`, `data:writes`, `egress:<host>`, or
  `queue:<name>`. Anything else fails the build, because a typo must not read as a guard.
- `per` is `hour`, `day`, or `month`. The default is `day`.
- `max="unbounded"` removes a ceiling. It is a word, not an absence, on purpose: the build
  prints every unbounded seam, the deployed configuration records it, and the dashboard shows
  the deployment as unguarded there. If your business genuinely runs at a scale where a
  five-figure invoice is Tuesday, you can have that, and everyone can see you chose it.
- `depth` on a queue budget caps how many messages can be waiting at once. A push past it is
  refused with the retryable `saturated`, which is backpressure, not failure.

You can see the whole plane where you build: in the Studio (`despia edit`), the server
screen has a **Spend** view listing every ceiling, the ones you declared and the defaults you
never had to write, with the lifted ones called out. Tapping a row shows the exact `<budget>`
head line that enforces it; a declared row also names the file and line it lives on, so the
meter and the declaration that pins it are never more than one click apart. The same rows ship in `despia build`'s generated
barrel as `spendBudgets`, which is how a standalone worker hands its ceilings to the runtime.

## What happens when a ceiling is met

At 80% of any ceiling, a `spend.warning` event lands on your deployment's event feed, once per
window, so the dashboard can warn you before anything is refused.

Past the ceiling, the deployment answers `429 spend_capped`. The refusal names the budget in the
`x-dsx-spend-budget` header and carries the real reset time in `Retry-After`. It is decided
before the request body is read and before any database or network work; the only things a
blocked request still pays for are the platform's own invocation charge and its token check, so
a capped deployment serves refusals at close to the platform's floor cost. Inside an
action body, a capped call answers an ordinary failed call (`{ ok: false, error: "spend_capped" }`),
and a capped `fetch` returns the refused shape (`status: -2`) without the request ever leaving
the process.

When the window rolls over, the ceiling reopens on its own and a `spend.recovered` event lands
on the feed. There is deliberately no admin override that resets a counter mid-window: a ceiling
you can wave away under pressure is not a ceiling. Raising the budget and redeploying is the
sanctioned override, and it leaves a record.

## Loops are attacked directly, not just billed less

Beyond the ceilings, the build refuses the classic loop shapes outright:

- An `<egress>` host that admits your deployment's own hostname fails the build, because a
  backend that fetches its own routes is the textbook recursion bill. If you really mean it,
  acknowledge it on the row: `<egress host="api.example.com" self="allow"/>`.
- A queue consumer that re-enqueues into its own queue is bounded three ways: the queue's
  window ceiling, its depth ceiling, and the idempotency key, which makes a same-key re-push a
  no-op.

## Your data stays on your infrastructure

The meters, the trip history, and the analytics live in your own deployment, under the reserved
`dsx_` tables the framework already provisions. The dashboard shows them as the **Spend Guard**
card: every ceiling as a bar with its state (Guarded, Near limit, Capped, or No limit for the
ones you lifted), and the card wearing its worst row, so one glance answers "is anything
burning money". Spend Guard reads directly from your browser through
`GET /dsx-internal/spend`, authenticated by a read-only token that can see meters and nothing
else. The numbers never transit Despia's servers, which is also why hosting on your own
Cloudflare account stays free: Despia is not in your data path.

The only thing that ever reaches Despia is a doorbell: when a ceiling trips or recovers, and
only if you have notifications configured, your deployment sends one signed message saying
which budget changed state. No payloads, no user data, and losing one loses nothing, because
the truth is already on your plane.

## One honest note about the free tier

If you deploy on a Cloudflare account with no paid Workers plan, you already have the strongest
guardrail there is: the platform stops serving at its free daily allowance and no bill is
possible, because no payment method is attached to usage. The spend plane still meters and
warns there. The moment you upgrade to a paid plan is the moment the platform's own brake comes
off, and these ceilings become the only thing between a bug and an invoice. That is exactly
when the guarded defaults matter.

## What this cannot do

Honesty is part of the guardrail. A ceiling is enforced to a stated bound, not to the exact
unit: your backend runs as many isolated instances as traffic demands, each counts locally and
synchronizes every few seconds, so a ceiling of 2,000 means 2,000 plus at most a few seconds
of traffic before every instance agrees it is spent, and an instance that crashes can lose the
last few seconds of its count. Both bounds are pinned by tests in the framework. Closing them
entirely would mean a database round trip on every single call, which would make the meter
cost more than most of what it meters. Ceilings are safety margins against five-figure
runaways, not billing-grade invoices. Traffic that reaches a tripped deployment still costs
the platform's per-request floor (fractions of a cent per thousand). The requests ceiling meters
your API surface; your site's pages and assets are covered differently, because static asset
requests are free on Workers and the deployed CPU ceiling bounds what a rendered page can
burn. Hand-written TypeScript handlers and imported npm packages are host-tier code, so they
are covered at the route level rather than per call. And ceilings on your own account are enforceable exactly until you, the
account owner, decide otherwise, which is the correct sovereignty. The guardrails are default
locks with visible keys, not a cage.
