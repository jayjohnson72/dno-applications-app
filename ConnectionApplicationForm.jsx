**`ConnectionApplicationForm.jsx`** — the full React form component. Import it anywhere and pass an `onSubmit` handler that receives a structured payload including the resolved DNO, validated MPAN, and connection details.

**`dnoService.js`** — standalone utilities with zero dependencies, usable in any JS framework (or Node.js backend):
- `lookupDNO(postcode)` — async, hits postcodes.io first for geocoding then resolves the DNO offline; gracefully degrades with no internet
- `validateMPAN(mpan)` — full modulo-11 check digit validation, returns profile class and distributor ID
- `formatMPAN(digits)` — formats into the standard grouped display
- `getConnectionTypes(dnoId)` — returns the base 10 connection types plus any DNO-specific extras
- `getDNOByMPAN(mpan)` — identifies the DNO directly from an MPAN's distributor ID prefix

