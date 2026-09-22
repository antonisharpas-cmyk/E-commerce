# Running the shop

The admin panel is at **`/admin`**. It is not linked from anywhere on the
storefront on purpose — you type the address.

---

## 1. Getting in

You need an account whose role is `ADMIN` or `SUPER_ADMIN`.

The seed creates one:

| | |
|---|---|
| Address | `admin@example.com` |
| Password | `change-me-in-production` |

**Change that password before the site is on the internet.** Sign in at
`/en/sign-in`, then go to `/admin`.

To create your real owner account:

1. Register normally at `/en/register` with the email you actually use.
2. Promote it, once, from a terminal:

   ```powershell
   npm run db:studio
   ```

   Open the `users` table, find your row, change `role` from `CUSTOMER` to
   `SUPER_ADMIN`, save.

3. Sign out and in again, then delete or disable `admin@example.com`.

There is no "make someone an admin" button in the panel yet. That is
deliberate: the one action that can hand over the whole shop should not sit
one mis-click away, and adding it is a small job for later.

### Who can see what

| | Storefront | `/admin` |
|---|---|---|
| Not signed in | yes | sent to the sign-in page |
| Customer | yes | **404 — page not found** |
| Admin / Super admin | yes | yes |

A signed-in customer who guesses the address gets the ordinary 404 page, not
"access denied". Saying "denied" would confirm there is something there.

**You cannot see any customer's password.** Nobody can — passwords are stored
as bcrypt hashes and the original is not recoverable from them. If a customer
is locked out, the answer is a password reset, never you reading it back to
them.

---

## 2. The four screens

### Overview — `/admin`

What needs attention, first: how many sizes are sold out, how many are low,
how many units are on the shelf, and how many are **held in carts** right now.

*Held* is stock sitting in a live customer's bag. It is not a problem — it is
the reservation system stopping two people buying the last one — but it
explains why a size with 1 on the shelf can say **Sold out**: that one unit is
already promised to someone at checkout. Holds expire on their own (10 minutes
by default, see Settings) and the unit comes back.

**Needs restocking** lists every size at or below the low-stock number, worst
first. "Edit" takes you to the stock screen.

### Stock — `/admin/stock`

Every size of every product, grouped by product.

- Type the number **on the shelf** and press **Enter** (or click away). It saves
  that line on its own. There is no "save all" — a shop counting stock works
  one line at a time, and losing a screenful to a mis-click is unforgivable.
- **Escape** puts a line back to what it was.
- *Available* = *on the shelf* − *held in carts*. You set the left-hand number;
  the shop computes the rest.
- **Low & sold out** filters to just the sizes that need you.

**You cannot set a count below what carts are holding.** If 5 units are in
customer bags and you type 2, the save is refused and says so, and the box goes
back to the real number. Wait for the holds to expire, or type 5 or more.

### Products — `/admin/products`

Every product with its category, price, number of sizes, total available, and
whether it is live. Search by name or slug. "Edit" opens one product.

### One product — `/admin/products/<id>`

- **Price** and **Sale price** in euros. A sale price must be lower than the
  normal price. Empty sale price = no sale.
- An automatic promotion never stacks on top of a sale price — the customer
  pays whichever is cheaper.
- **Show in the shop** hides or reveals it. Unticking **deletes nothing**: the
  product leaves the storefront and search, and every past order that contains
  it stays intact.
- Below, the same per-size stock editor as the stock screen.

### Settings — `/admin/settings`

Saved here, used by the shop on the next page load. No deploy, no developer.

| Setting | What it does |
|---|---|
| Free delivery over | The total at which delivery becomes free. Drives the progress bar in the bag. |
| Hold stock in a cart for | How long an unchecked-out item stays reserved. 1–60 minutes. Longer is kinder on a slow checkout; shorter puts stock back sooner. |
| VAT rate | Prices are shown VAT-inclusive, as EU consumer law requires. This is only used to show how much of a total *is* VAT — it never adds anything on top. |
| Low stock warning at | The number at which a size is flagged here and shown as "only a few left" in the shop. |
| Maximum per size in one order | Stops one person clearing out a size. Does not limit how many different items they buy. |
| Delivery estimate | The range shown on the product page and in the confirmation email. |
| Order number prefix | The start of every order number, e.g. `SF-7K2M9QX4`. 1–6 capitals or digits. |
| Promotion banner on the homepage | Switches the banner off without deleting any promotion. The discounts keep working. |

---

## 3. Things the panel will not let you do

These are not missing features; they are refusals, and each one is checked on
the server, so they hold even if someone bypasses the screen entirely.

- Set stock below what live carts hold.
- Set a sale price at or above the normal price.
- Set a cart hold under 1 minute or over 60.
- Set a VAT rate over 100%, a negative price, or a fractional unit of stock.
- Read anybody's password.

If a refusal appears, the number on screen goes back to what is actually
stored. The screen never shows you a figure the database does not have.

---

## 4. Proving it still works

```powershell
npm run check:admin
```

With the site running (`npm run dev`), this signs in as a stranger, as a
customer and as an admin, and checks 44 things: that the first two are turned
away from every page and every API, that their write attempts changed nothing
in the database, that an admin can make each kind of change, that stock cannot
go below what carts hold, and that a settings change reaches the storefront on
the very next request. It puts every value it touched back afterwards.

`npm run check` runs that plus the stock-race, promotion, recently-viewed and
sign-in suites.

---

## 5. Not built yet

So you know what you are looking at rather than looking for it:

- Orders — there is no checkout yet, so there is nothing to list.
- Creating or deleting products, editing names, descriptions or images.
- Managing promotions and promo codes (they work; they are set in the seed).
- Customer list, password reset, promoting a user to admin.
