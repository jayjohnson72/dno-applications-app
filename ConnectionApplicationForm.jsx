
**`ConnectionApplicationForm.jsx`** — the full React form component. Import it anywhere and pass an `onSubmit` handler that receives a structured payload including the resolved DNO, validated MPAN, and connection details.

**`dnoService.js`** — standalone utilities with zero dependencies, usable in any JS framework (or Node.js backend):
- `lookupDNO(postcode)` — async, hits postcodes.io first for geocoding then resolves the DNO offline; gracefully degrades with no internet
- `validateMPAN(mpan)` — full modulo-11 check digit validation, returns profile class and distributor ID
- `formatMPAN(digits)` — formats into the standard grouped display
- `getConnectionTypes(dnoId)` — returns the base 10 connection types plus any DNO-specific extras
- `getDNOByMPAN(mpan)` — identifies the DNO directly from an MPAN's distributor ID prefix

**`README.md`** — full integration guide with the MPAN structure diagram, DNO ID table, and instructions for upgrading to the licensed Ofgem Data Portal API when you're ready.

A few things worth knowing as you integrate:

The Ofgem API requires a key from `developer.ofgem.gov.uk` — the code includes a commented stub showing exactly where to swap it in. Until then, postcodes.io provides free geocoding (lat/lng, admin region) and the offline map handles the actual DNO matching.

The MPAN field is optional — leave it blank for new connections. If an MPAN is entered, the form cross-checks that its distributor ID matches the postcode's DNO and flags any mismatch.