# Design Philosophy — Worked Examples

**As the reviewer applying `standards/design-philosophy.md`, I need one worked Flag/Clean pair per red flag, so that I match findings to real patterns instead of over-flagging style or missing genuine defects.**

Each section: a `Flag` block (a **hypothetical counter-design** in a generic HTTP service's idiom — the shape a well-designed codebase avoids; its file and field names are illustrative, not any real app's schema), a `Clean` block (the corrected shape), and a `Not a finding:` guard naming a nearby pattern that does NOT qualify.

The worked examples below share one running scenario: an HTTP service with a `store` module (owns persistence).

---

### shallow module

Flag — the interface is as complex as what it hides; every internal knob is a parameter:

```js
function saveRecord(id, data, ttl, retries, backoffMs, backend) {
  return backend.connect().write(id, data, { ttl, retries, backoffMs });
}
```

Clean — one decision the caller cares about; the storage policy lives inside (module-private constants, only the identifier comes from the caller):

```js
// Storage policy is this module's decision: callers say what, not how.
const DEFAULT_TTL_SECONDS = 3600;
const WRITE_RETRIES = 3;
const RETRY_BACKOFF_MS = 200;

function saveRecord(id, data) {
  let lastError;
  for (let attempt = 0; attempt < WRITE_RETRIES; attempt++) {
    try {
      return store.write(id, data, { ttl: DEFAULT_TTL_SECONDS });
    } catch (err) {
      lastError = err;
      sleep(RETRY_BACKOFF_MS * (attempt + 1));
    }
  }
  throw lastError;
}
```

Not a finding: a function with several parameters is not automatically shallow — flag it only when the parameters re-expose decisions the module exists to own (storage policy above), not when they carry genuinely caller-owned data (the record id).

---

### information leakage

Flag — duplicated ownership of a formula, filter, or status rule: a hypothetical counter-design where two routes each re-derive the "visible record" rule instead of asking the module that owns it:

```js
// hypothetical routeA.js
const rows = db.prepare('SELECT * FROM records WHERE deleted = 0 AND owner_id = ?').all(id);
// hypothetical routeB.js — the same visibility decision, re-stated and free to drift
const rows = db.prepare('SELECT * FROM records WHERE deleted = 0 AND group_id = ?').all(groupId);
```

Clean — the visibility rule (`deleted = 0`) is applied inside the module that owns it, and both callers consume the computed result, never the rule:

```js
// store.js owns "visible"; both callers consume the computed result, not the rule.
// hypothetical routeA.js
const rows = store.listVisible({ ownerId: id });
// hypothetical routeB.js
const rows = store.listVisible({ groupId });
```

Not a finding: two modules both importing a shared `config` module is not leakage — config is the sanctioned shared surface. Leakage requires an _internal representation decision_ (storage format, encoding, a filter rule like visibility) reappearing outside its owner.

---

### temporal decomposition

Flag — modules named for when they run, so one format decision smears across all three:

```js
// step1-fetch.js, step2-normalize.js, step3-persist.js
// step2 must know step1's raw response nests results under `payload.items`;
// step3 must know step2 already renamed `id` to `recordId` before writing.
```

Clean — modules named for what they hide; order of operations is an implementation detail:

```js
// syncRecords.js — owns the upstream-to-store pipeline end to end; the shape of the
// upstream response and the shape store.write expects never leak past this module.
function syncRecords(sourceUrl) {
  const response = fetchUpstream(sourceUrl); // fetch
  const records = response.payload.items.map(toRecord); // normalize
  return store.writeAll(records); // persist
}
```

Not a finding: a pipeline that genuinely IS sequential (parse → validate → write) may be written as ordered steps inside one module; the flag is structure that forces _knowledge_ of one step's internals into another module, not the mere existence of an order.

---

### pass-through

Flag — a layer that renames the layer below and adds nothing:

```js
function getRecord(id) {
  return store.getRecordById(id);
}
```

Clean — the layer earns its place by changing the abstraction (error contract, shape, policy):

```js
// Returns a record or throws (NotFound is an illustrative error type) —
// callers never see undefined.
function requireRecord(id) {
  const r = store.getRecordById(id);
  if (!r) throw new NotFound(`No record with id ${id}`);
  return r;
}
```

Not a finding: a thin wrapper that fixes an argument, narrows a type, or exists to be the single future seam for a policy (and says so) adds abstraction; the flag is forwarding with a new name and nothing else.

---

### vague name

Flag — the name forces the reader to trace the data flow to learn what it holds:

```js
const data = getData(req);
const tmp = process(data);
res.json(tmp);
```

Clean — the names state what the things are:

```js
const requestBody = parseRequestBody(req);
const savedRecord = persistRecord(requestBody);
res.json(savedRecord);
```

Not a finding: a short name with a one-line scope and an obvious source (`for (const row of rows)`) is fine — the flag is genericness that survives past the point a reader needs to know the meaning, not brevity itself.
