Love it. We’ll keep it **basic Node.js + plain JSON**, and I’ll comment the code like crazy so you can explain every choice to your instructor.

---

# Folder layout (simple)

```
your-project/
├─ data/
│  └─ sales.json
└─ src/
   └─ index.js
```

## `data/sales.json`  (plain JSON)

```json
[
  { "productId": "A1", "amount": 100 },
  { "productId": "B2", "amount": 150 },
  { "productId": "A1", "amount": 200 },
  { "productId": "C3", "amount": 50 },
  { "productId": "B2", "amount": 100 }
]
```

## `src/index.js`  (Node.js, CommonJS, ultra-commented)

```js
/**
 * src/index.js
 *
 * What this program does (high-level):
 *  1) Read a local JSON file that contains an array of sales transactions.
 *     Each transaction looks like: { "productId": "A1", "amount": 100 }
 *  2) Calculate the total sales amount per productId.
 *     Example output: { "A1": 300, "B2": 250, "C3": 50 }
 *  3) Write the result to a new JSON file (pretty-printed for readability).
 *
 * Why Node.js (not browser JS)?
 *  - We need to read/write files. Browsers block direct disk access for security.
 *  - Node.js provides the 'fs' (file system) module for this.
 *
 * Why CommonJS (require/module.exports) here?
 *  - It runs out-of-the-box in Node without extra config (package.json "type": "module").
 *  - You can switch to ES modules (import/export) later if you prefer.
 */

// 1) Import Node core modules we need.
// We choose 'fs/promises' specifically so we can use async/await (cleaner than callbacks).
const fs = require('fs/promises');

// 'path' builds file paths in a cross-platform way (Windows, macOS, Linux).
// Using path.join avoids hardcoding slashes like "data/sales.json" which can be OS-specific.
const path = require('path');

// 2) Define simple, hardcoded file paths for clarity.
// This is "basic and obvious" (good for instructors reviewing your code).
// We still use path.join for portability.
const INPUT_FILE = path.join('data', 'sales.json');
const OUTPUT_FILE = path.join('data', 'totals.json');

/**
 * 3) calculateTotalSales
 * A pure function that does the core business logic.
 *
 * Why a separate function?
 *  - Separation of concerns: business logic is independent from I/O (reading/writing files).
 *  - Easier to test in isolation by passing an array and checking the returned object.
 *
 * @param {Array<{productId: string, amount: number | string}>} transactions
 * @returns {Record<string, number>} Totals per productId (e.g., { "A1": 300, "B2": 250 })
 */
function calculateTotalSales(transactions) {
  // Defensive check: we expect an array. If not, throw a clear error early.
  if (!Array.isArray(transactions)) {
    throw new TypeError('Expected an array of transactions');
  }

  // We use Array.prototype.reduce to accumulate totals into a single object.
  // Why reduce?
  //  - It's a standard pattern to transform an array into a single result (object/number/etc.).
  //  - It avoids mutating external variables and keeps logic in one expression.
  const totals = transactions.reduce((acc, item, idx) => {
    // Validate shape minimally: both keys should exist.
    // We don't "hard fail" for a single bad item; we log and skip instead.
    if (!item || typeof item.productId === 'undefined' || typeof item.amount === 'undefined') {
      console.warn(`⚠️  Skipping item #${idx}: missing productId or amount`);
      return acc;
    }

    // Normalize productId to string to avoid surprises (e.g., numbers as IDs).
    const id = String(item.productId).trim();

    // Coerce amount to a number in case it's provided as a string ("200").
    // Using Number(...) ensures arithmetic addition instead of string concatenation.
    const amt = Number(item.amount);

    // Validate data sanity: non-empty id and a finite number amount.
    if (!id) {
      console.warn(`⚠️  Skipping item #${idx}: empty productId`);
      return acc;
    }
    if (!Number.isFinite(amt)) {
      console.warn(`⚠️  Skipping item #${idx}: amount "${item.amount}" is not a finite number`);
      return acc;
    }

    // Accumulate: if this id was never seen, start from 0; then add the amount.
    acc[id] = (acc[id] || 0) + amt;
    return acc;
  }, {}); // {} is the initial value of the accumulator (an empty totals object)

  return totals;
}

/**
 * 4) main
 * Orchestrates the full flow (I/O + compute).
 *
 * Why an async main?
 *  - Reading and writing files are asynchronous operations (non-blocking in Node).
 *  - Using async/await makes the code linear, readable, and easy to reason about.
 */
async function main() {
  // READ: get the raw JSON text from disk.
  // 'utf8' ensures we receive a string (not a Buffer).
  const raw = await fs.readFile(INPUT_FILE, 'utf8');

  // PARSE: turn JSON text into a JS value (we expect an array).
  // We wrap in try/catch to give a clear error if the JSON is malformed.
  let transactions;
  try {
    transactions = JSON.parse(raw);
  } catch (err) {
    // Throw a more helpful message including the input file path.
    throw new Error(`Failed to parse ${INPUT_FILE} as JSON: ${err.message}`);
  }

  // COMPUTE: get totals by productId using our pure function.
  const totals = calculateTotalSales(transactions);

  // SERIALIZE: pretty-print the result so humans can read it in GitHub easily.
  // JSON.stringify(value, replacer=null, space=2) adds 2-space indentation.
  const outputJson = JSON.stringify(totals, null, 2);

  // WRITE: save to the output file.
  // If the 'data' folder exists, this overwrites/creates totals.json.
  await fs.writeFile(OUTPUT_FILE, outputJson, 'utf8');

  // LOG: helpful info for the console so users know it worked and where to look.
  console.log('✅ Totals written to', OUTPUT_FILE);
  console.log('🧾 Result preview:\n', outputJson);
}

// 5) Kick off the program and surface any error clearly.
// process.exit(1) signals a failure exit code in case something goes wrong (useful in CI).
main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

// (Optional) Export for unit tests if you add them later.
module.exports = { calculateTotalSales };
```

---

## How to run

From your project root:

```bash
node src/index.js
```

**Expected output in terminal:**

```
✅ Totals written to data/totals.json
🧾 Result preview:
{
  "A1": 300,
  "B2": 250,
  "C3": 50
}
```

**Expected file `data/totals.json`:**

```json
{
  "A1": 300,
  "B2": 250,
  "C3": 50
}
```

---

One quick check (your turn — one question):
If you change one `amount` in `sales.json` from `100` to `"100"` (a string), will the totals still be correct? Why?
