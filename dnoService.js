/**
 * dnoService.js
 *
 * Standalone utilities for DNO lookup, MPAN validation, and connection type logic.
 * Import individual functions into any codebase — no React dependency.
 *
 * Exports:
 *   lookupDNO(postcode)          → Promise<DNOResult | null>
 *   validateMPAN(mpan)           → MPANValidationResult
 *   formatMPAN(digits)           → string
 *   getConnectionTypes(dnoId)    → ConnectionType[]
 *   getDNOByMPAN(mpan)           → DNOResult | null
 */

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
/**
 * @typedef {Object} DNOResult
 * @property {string} id            - Ofgem distributor ID (2-digit string)
 * @property {string} name          - Full DNO legal name
 * @property {string} short         - Abbreviated name
 * @property {string} region        - Human-readable service region
 * @property {string} emergency     - 24h fault/emergency phone number
 * @property {string} mpanPrefix    - MPAN distributor prefix (matches id)
 * @property {string} website       - DNO website URL
 * @property {"offline"|"api"} source - How the result was resolved
 * @property {GeoResult} [geo]      - Postcode geo data if API was available
 */

/**
 * @typedef {Object} MPANValidationResult
 * @property {boolean} valid
 * @property {string|null} error
 * @property {number} profileClass
 * @property {string} profileLabel
 * @property {string} distributorId
 * @property {string} formatted
 */

/**
 * @typedef {Object} ConnectionType
 * @property {string} value
 * @property {string} label
 * @property {string} description
 * @property {number} typicalLeadWeeks
 */

// ─── Offline DNO postcode area map ────────────────────────────────────────────
const DNO_MAP = {
  AB: { id:"10", name:"SSEN Transmission",        short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  AL: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  B:  { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  BA: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  BB: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  BD: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  BH: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  BL: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  BN: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  BS: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  CA: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  CB: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  CF: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  CH: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  CM: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  CR: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  CV: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  CW: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  DA: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  DD: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  DE: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  DG: { id:"18", name:"SP Energy Networks",         short:"SP Manweb",          region:"Southern Scotland",       emergency:"0330 10 10 444",mpanPrefix:"18", website:"https://www.spenergynetworks.co.uk" },
  DH: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  DL: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  DN: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  DT: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  DY: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  E:  { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  EC: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  EH: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  EN: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  EX: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  FK: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  FY: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  G:  { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  GL: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  GU: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  HA: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  HD: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  HG: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  HP: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  HR: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  HU: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  HX: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  IG: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  IP: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  IV: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  KA: { id:"18", name:"SP Energy Networks",         short:"SP Manweb",          region:"Southern Scotland",       emergency:"0330 10 10 444",mpanPrefix:"18", website:"https://www.spenergynetworks.co.uk" },
  KT: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  KW: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  KY: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  L:  { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  LA: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  LD: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  LE: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  LL: { id:"12", name:"SP Manweb",                  short:"SP Manweb",          region:"North Wales",             emergency:"0330 10 10 444",mpanPrefix:"12", website:"https://www.spenergynetworks.co.uk" },
  LN: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  LS: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  LU: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  M:  { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  ME: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  MK: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  ML: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  N:  { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  NE: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  NG: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  NN: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  NP: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  NR: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  NW: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  OL: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  OX: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  PA: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  PE: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  PH: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  PL: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  PO: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  PR: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  RG: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  RH: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  RM: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  S:  { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  SA: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  SE: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  SG: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  SK: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  SL: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  SM: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  SN: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  SO: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  SR: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  SS: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  ST: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  SW: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  SY: { id:"12", name:"SP Manweb",                  short:"SP Manweb",          region:"Mid Wales / Shropshire",  emergency:"0330 10 10 444",mpanPrefix:"12", website:"https://www.spenergynetworks.co.uk" },
  TA: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  TD: { id:"18", name:"SP Energy Networks",         short:"SP Manweb",          region:"Southern Scotland",       emergency:"0330 10 10 444",mpanPrefix:"18", website:"https://www.spenergynetworks.co.uk" },
  TF: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  TN: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  TQ: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  TR: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  TS: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  TW: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  UB: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  W:  { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  WA: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  WC: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  WD: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  WF: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  WN: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  WR: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  WS: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  WV: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  YO: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  ZE: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
};

// ID → DNO lookup (for MPAN prefix matching)
const DNO_BY_ID = Object.values(DNO_MAP).reduce((acc, d) => {
  if (!acc[d.id]) acc[d.id] = d;
  return acc;
}, {});

// ─── Connection types ─────────────────────────────────────────────────────────
const BASE_CONNECTION_TYPES = [
  { value:"new_residential",  label:"New residential connection",     description:"First-time supply to a new-build or converted property",  typicalLeadWeeks:11 },
  { value:"new_commercial",   label:"New commercial connection",       description:"Business premises requiring a new supply point",           typicalLeadWeeks:13 },
  { value:"upgrade_supply",   label:"Upgrade existing supply",         description:"Increase capacity at an already-connected property",       typicalLeadWeeks:8  },
  { value:"ev_charger",       label:"EV charger installation",         description:"Dedicated circuit for electric vehicle charging",          typicalLeadWeeks:6  },
  { value:"solar_export",     label:"Solar PV / battery export",       description:"G99 or G98 export connection for generation assets",       typicalLeadWeeks:10 },
  { value:"hv_connection",    label:"High voltage (HV) connection",    description:"11kV or 33kV supply for large commercial/industrial",      typicalLeadWeeks:26 },
  { value:"temporary",        label:"Temporary / construction supply", description:"Builder's supply for a site under development",            typicalLeadWeeks:4  },
  { value:"disconnection",    label:"Permanent disconnection",         description:"Remove an existing metered supply permanently",            typicalLeadWeeks:6  },
  { value:"diversions",       label:"Cable diversion / alteration",    description:"Reroute existing underground or overhead cables",          typicalLeadWeeks:16 },
  { value:"substation",       label:"New substation / transformer",    description:"DNO-owned substation for large development sites",         typicalLeadWeeks:40 },
];

const DNO_EXTRA_CONNECTION_TYPES = {
  "10": [{ value:"island_connection", label:"Island / remote connection", description:"Off-mainland supply requiring submarine or overhead works", typicalLeadWeeks:52 }],
  "13": [{ value:"smart_street",      label:"Smart Street low carbon",    description:"UKPN Smart Street zone upgrade for EVs and heat pumps",   typicalLeadWeeks:8  }],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Look up the DNO for a UK postcode.
 * Tries postcodes.io for geocoding first, then falls back to offline map.
 *
 * @param {string} postcode
 * @returns {Promise<DNOResult|null>}
 */
export async function lookupDNO(postcode) {
  const clean = postcode.replace(/\s+/g, "").toUpperCase();

  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    if (data.status === 200) {
      const offline = _lookupOffline(clean);
      if (offline) return { ...offline, source: "api", geo: data.result };
    }
  } catch { /* fall through to offline */ }

  const offline = _lookupOffline(clean);
  return offline ? { ...offline, source: "offline" } : null;
}

/**
 * Get the connection types available for a given DNO ID.
 * Pass null/undefined to get all base types.
 *
 * @param {string|null} dnoId
 * @returns {ConnectionType[]}
 */
export function getConnectionTypes(dnoId) {
  const extras = dnoId ? (DNO_EXTRA_CONNECTION_TYPES[dnoId] || []) : [];
  return [...BASE_CONNECTION_TYPES, ...extras];
}

/**
 * Validate a 21-digit MPAN string.
 * Performs modulo-11 check digit validation.
 *
 * @param {string} mpan - Raw digits, spaces allowed
 * @returns {MPANValidationResult}
 */
export function validateMPAN(mpan) {
  const digits = mpan.replace(/\s+/g, "");
  if (!/^\d{21}$/.test(digits)) {
    return { valid: false, error: "MPAN must be exactly 21 digits", profileClass: null, profileLabel: null, distributorId: null, formatted: mpan };
  }

  // Modulo-11 check on positions 9–20 (bottom 13 digits, last is check digit)
  const bottom13 = digits.slice(8);
  const primes   = [3, 5, 7, 13, 11, 17, 19, 23, 29, 31, 37, 41, 43];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(bottom13[i]) * primes[i];
  const expectedCheck = sum % 11 % 10;
  const actualCheck   = parseInt(bottom13[12]);
  const profileClass  = parseInt(digits.slice(1, 3));
  const distributorId = digits.slice(9, 11);

  return {
    valid:        expectedCheck === actualCheck,
    error:        expectedCheck !== actualCheck ? `Check digit invalid (expected ${expectedCheck}, got ${actualCheck})` : null,
    profileClass,
    profileLabel: _profileLabel(profileClass),
    distributorId,
    formatted:    formatMPAN(digits),
  };
}

/**
 * Format a raw 21-digit MPAN into readable grouped form.
 * Returns: "S  PP TC LLLL  DD OO SSSSSSSS C"
 *
 * @param {string} digits
 * @returns {string}
 */
export function formatMPAN(digits) {
  const d = digits.replace(/\s+/g, "");
  if (d.length !== 21) return digits;
  // Top line (check): d[0]
  // Profile class: d[1-2], Timeswitch: d[3-4], LLFC: d[5-8]
  // Bottom: Distributor ID d[9-10], Office d[11-12], MSID d[13-20], Check d[20]
  return `${d[0]}  ${d.slice(1,3)} ${d.slice(3,5)} ${d.slice(5,9)}  ${d.slice(9,11)} ${d.slice(11,13)} ${d.slice(13,21)}`;
}

/**
 * Look up the DNO from an MPAN's distributor ID prefix.
 *
 * @param {string} mpan
 * @returns {DNOResult|null}
 */
export function getDNOByMPAN(mpan) {
  const digits = mpan.replace(/\s+/g, "");
  if (digits.length < 11) return null;
  const distributorId = digits.slice(9, 11);
  return DNO_BY_ID[distributorId] ? { ...DNO_BY_ID[distributorId], source: "mpan" } : null;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _lookupOffline(clean) {
  const match = clean.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  if (!match) return null;
  const outward = match[1];
  const tries = [outward, outward.replace(/[A-Z]$/, ""), outward.replace(/\d[A-Z]?$/, ""), outward.replace(/\d{1,2}[A-Z]?$/, "")];
  for (const t of tries) {
    if (DNO_MAP[t]) return { ...DNO_MAP[t] };
  }
  return null;
}

function _profileLabel(pc) {
  const map = {
    1:"Domestic unrestricted", 2:"Domestic Economy 7",
    3:"Non-domestic unrestricted (<100MWh)", 4:"Non-domestic Economy 7 (<100MWh)",
    5:"Non-domestic max demand (>100MWh, NHH)", 6:"Non-domestic max demand (>100MWh, HH)",
    7:"Non-domestic, half-hourly", 8:"Non-domestic, HH aggregated",
  };
  return map[pc] || `Unknown profile class ${pc}`;
}/**
 * dnoService.js
 *
 * Standalone utilities for DNO lookup, MPAN validation, and connection type logic.
 * Import individual functions into any codebase — no React dependency.
 *
 * Exports:
 *   lookupDNO(postcode)          → Promise<DNOResult | null>
 *   validateMPAN(mpan)           → MPANValidationResult
 *   formatMPAN(digits)           → string
 *   getConnectionTypes(dnoId)    → ConnectionType[]
 *   getDNOByMPAN(mpan)           → DNOResult | null
 */

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
/**
 * @typedef {Object} DNOResult
 * @property {string} id            - Ofgem distributor ID (2-digit string)
 * @property {string} name          - Full DNO legal name
 * @property {string} short         - Abbreviated name
 * @property {string} region        - Human-readable service region
 * @property {string} emergency     - 24h fault/emergency phone number
 * @property {string} mpanPrefix    - MPAN distributor prefix (matches id)
 * @property {string} website       - DNO website URL
 * @property {"offline"|"api"} source - How the result was resolved
 * @property {GeoResult} [geo]      - Postcode geo data if API was available
 */

/**
 * @typedef {Object} MPANValidationResult
 * @property {boolean} valid
 * @property {string|null} error
 * @property {number} profileClass
 * @property {string} profileLabel
 * @property {string} distributorId
 * @property {string} formatted
 */

/**
 * @typedef {Object} ConnectionType
 * @property {string} value
 * @property {string} label
 * @property {string} description
 * @property {number} typicalLeadWeeks
 */

// ─── Offline DNO postcode area map ────────────────────────────────────────────
const DNO_MAP = {
  AB: { id:"10", name:"SSEN Transmission",        short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  AL: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  B:  { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  BA: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  BB: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  BD: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  BH: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  BL: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  BN: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  BS: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  CA: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  CB: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  CF: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  CH: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  CM: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  CR: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  CV: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  CW: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  DA: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  DD: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  DE: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  DG: { id:"18", name:"SP Energy Networks",         short:"SP Manweb",          region:"Southern Scotland",       emergency:"0330 10 10 444",mpanPrefix:"18", website:"https://www.spenergynetworks.co.uk" },
  DH: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  DL: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  DN: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  DT: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  DY: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  E:  { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  EC: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  EH: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  EN: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  EX: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  FK: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  FY: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  G:  { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  GL: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  GU: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  HA: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  HD: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  HG: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  HP: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  HR: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  HU: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  HX: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  IG: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  IP: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  IV: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  KA: { id:"18", name:"SP Energy Networks",         short:"SP Manweb",          region:"Southern Scotland",       emergency:"0330 10 10 444",mpanPrefix:"18", website:"https://www.spenergynetworks.co.uk" },
  KT: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  KW: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  KY: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  L:  { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  LA: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  LD: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  LE: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  LL: { id:"12", name:"SP Manweb",                  short:"SP Manweb",          region:"North Wales",             emergency:"0330 10 10 444",mpanPrefix:"12", website:"https://www.spenergynetworks.co.uk" },
  LN: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  LS: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  LU: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  M:  { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  ME: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  MK: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  ML: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  N:  { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  NE: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  NG: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  NN: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  NP: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  NR: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  NW: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  OL: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  OX: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  PA: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  PE: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  PH: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  PL: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  PO: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  PR: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  RG: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  RH: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  RM: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  S:  { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  SA: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  SE: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  SG: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  SK: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  SL: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  SM: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  SN: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  SO: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  SR: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  SS: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  ST: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  SW: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  SY: { id:"12", name:"SP Manweb",                  short:"SP Manweb",          region:"Mid Wales / Shropshire",  emergency:"0330 10 10 444",mpanPrefix:"12", website:"https://www.spenergynetworks.co.uk" },
  TA: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  TD: { id:"18", name:"SP Energy Networks",         short:"SP Manweb",          region:"Southern Scotland",       emergency:"0330 10 10 444",mpanPrefix:"18", website:"https://www.spenergynetworks.co.uk" },
  TF: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  TN: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  TQ: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  TR: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  TS: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  TW: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  UB: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  W:  { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  WA: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  WC: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  WD: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  WF: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  WN: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  WR: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  WS: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  WV: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  YO: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  ZE: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
};

// ID → DNO lookup (for MPAN prefix matching)
const DNO_BY_ID = Object.values(DNO_MAP).reduce((acc, d) => {
  if (!acc[d.id]) acc[d.id] = d;
  return acc;
}, {});

// ─── Connection types ─────────────────────────────────────────────────────────
const BASE_CONNECTION_TYPES = [
  { value:"new_residential",  label:"New residential connection",     description:"First-time supply to a new-build or converted property",  typicalLeadWeeks:11 },
  { value:"new_commercial",   label:"New commercial connection",       description:"Business premises requiring a new supply point",           typicalLeadWeeks:13 },
  { value:"upgrade_supply",   label:"Upgrade existing supply",         description:"Increase capacity at an already-connected property",       typicalLeadWeeks:8  },
  { value:"ev_charger",       label:"EV charger installation",         description:"Dedicated circuit for electric vehicle charging",          typicalLeadWeeks:6  },
  { value:"solar_export",     label:"Solar PV / battery export",       description:"G99 or G98 export connection for generation assets",       typicalLeadWeeks:10 },
  { value:"hv_connection",    label:"High voltage (HV) connection",    description:"11kV or 33kV supply for large commercial/industrial",      typicalLeadWeeks:26 },
  { value:"temporary",        label:"Temporary / construction supply", description:"Builder's supply for a site under development",            typicalLeadWeeks:4  },
  { value:"disconnection",    label:"Permanent disconnection",         description:"Remove an existing metered supply permanently",            typicalLeadWeeks:6  },
  { value:"diversions",       label:"Cable diversion / alteration",    description:"Reroute existing underground or overhead cables",          typicalLeadWeeks:16 },
  { value:"substation",       label:"New substation / transformer",    description:"DNO-owned substation for large development sites",         typicalLeadWeeks:40 },
];

const DNO_EXTRA_CONNECTION_TYPES = {
  "10": [{ value:"island_connection", label:"Island / remote connection", description:"Off-mainland supply requiring submarine or overhead works", typicalLeadWeeks:52 }],
  "13": [{ value:"smart_street",      label:"Smart Street low carbon",    description:"UKPN Smart Street zone upgrade for EVs and heat pumps",   typicalLeadWeeks:8  }],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Look up the DNO for a UK postcode.
 * Tries postcodes.io for geocoding first, then falls back to offline map.
 *
 * @param {string} postcode
 * @returns {Promise<DNOResult|null>}
 */
export async function lookupDNO(postcode) {
  const clean = postcode.replace(/\s+/g, "").toUpperCase();

  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    if (data.status === 200) {
      const offline = _lookupOffline(clean);
      if (offline) return { ...offline, source: "api", geo: data.result };
    }
  } catch { /* fall through to offline */ }

  const offline = _lookupOffline(clean);
  return offline ? { ...offline, source: "offline" } : null;
}

/**
 * Get the connection types available for a given DNO ID.
 * Pass null/undefined to get all base types.
 *
 * @param {string|null} dnoId
 * @returns {ConnectionType[]}
 */
export function getConnectionTypes(dnoId) {
  const extras = dnoId ? (DNO_EXTRA_CONNECTION_TYPES[dnoId] || []) : [];
  return [...BASE_CONNECTION_TYPES, ...extras];
}

/**
 * Validate a 21-digit MPAN string.
 * Performs modulo-11 check digit validation.
 *
 * @param {string} mpan - Raw digits, spaces allowed
 * @returns {MPANValidationResult}
 */
export function validateMPAN(mpan) {
  const digits = mpan.replace(/\s+/g, "");
  if (!/^\d{21}$/.test(digits)) {
    return { valid: false, error: "MPAN must be exactly 21 digits", profileClass: null, profileLabel: null, distributorId: null, formatted: mpan };
  }

  // Modulo-11 check on positions 9–20 (bottom 13 digits, last is check digit)
  const bottom13 = digits.slice(8);
  const primes   = [3, 5, 7, 13, 11, 17, 19, 23, 29, 31, 37, 41, 43];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(bottom13[i]) * primes[i];
  const expectedCheck = sum % 11 % 10;
  const actualCheck   = parseInt(bottom13[12]);
  const profileClass  = parseInt(digits.slice(1, 3));
  const distributorId = digits.slice(9, 11);

  return {
    valid:        expectedCheck === actualCheck,
    error:        expectedCheck !== actualCheck ? `Check digit invalid (expected ${expectedCheck}, got ${actualCheck})` : null,
    profileClass,
    profileLabel: _profileLabel(profileClass),
    distributorId,
    formatted:    formatMPAN(digits),
  };
}

/**
 * Format a raw 21-digit MPAN into readable grouped form.
 * Returns: "S  PP TC LLLL  DD OO SSSSSSSS C"
 *
 * @param {string} digits
 * @returns {string}
 */
export function formatMPAN(digits) {
  const d = digits.replace(/\s+/g, "");
  if (d.length !== 21) return digits;
  // Top line (check): d[0]
  // Profile class: d[1-2], Timeswitch: d[3-4], LLFC: d[5-8]
  // Bottom: Distributor ID d[9-10], Office d[11-12], MSID d[13-20], Check d[20]
  return `${d[0]}  ${d.slice(1,3)} ${d.slice(3,5)} ${d.slice(5,9)}  ${d.slice(9,11)} ${d.slice(11,13)} ${d.slice(13,21)}`;
}

/**
 * Look up the DNO from an MPAN's distributor ID prefix.
 *
 * @param {string} mpan
 * @returns {DNOResult|null}
 */
export function getDNOByMPAN(mpan) {
  const digits = mpan.replace(/\s+/g, "");
  if (digits.length < 11) return null;
  const distributorId = digits.slice(9, 11);
  return DNO_BY_ID[distributorId] ? { ...DNO_BY_ID[distributorId], source: "mpan" } : null;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _lookupOffline(clean) {
  const match = clean.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  if (!match) return null;
  const outward = match[1];
  const tries = [outward, outward.replace(/[A-Z]$/, ""), outward.replace(/\d[A-Z]?$/, ""), outward.replace(/\d{1,2}[A-Z]?$/, "")];
  for (const t of tries) {
    if (DNO_MAP[t]) return { ...DNO_MAP[t] };
  }
  return null;
}

function _profileLabel(pc) {
  const map = {
    1:"Domestic unrestricted", 2:"Domestic Economy 7",
    3:"Non-domestic unrestricted (<100MWh)", 4:"Non-domestic Economy 7 (<100MWh)",
    5:"Non-domestic max demand (>100MWh, NHH)", 6:"Non-domestic max demand (>100MWh, HH)",
    7:"Non-domestic, half-hourly", 8:"Non-domestic, HH aggregated",
  };
  return map[pc] || `Unknown profile class ${pc}`;
}/**
 * dnoService.js
 *
 * Standalone utilities for DNO lookup, MPAN validation, and connection type logic.
 * Import individual functions into any codebase — no React dependency.
 *
 * Exports:
 *   lookupDNO(postcode)          → Promise<DNOResult | null>
 *   validateMPAN(mpan)           → MPANValidationResult
 *   formatMPAN(digits)           → string
 *   getConnectionTypes(dnoId)    → ConnectionType[]
 *   getDNOByMPAN(mpan)           → DNOResult | null
 */

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────
/**
 * @typedef {Object} DNOResult
 * @property {string} id            - Ofgem distributor ID (2-digit string)
 * @property {string} name          - Full DNO legal name
 * @property {string} short         - Abbreviated name
 * @property {string} region        - Human-readable service region
 * @property {string} emergency     - 24h fault/emergency phone number
 * @property {string} mpanPrefix    - MPAN distributor prefix (matches id)
 * @property {string} website       - DNO website URL
 * @property {"offline"|"api"} source - How the result was resolved
 * @property {GeoResult} [geo]      - Postcode geo data if API was available
 */

/**
 * @typedef {Object} MPANValidationResult
 * @property {boolean} valid
 * @property {string|null} error
 * @property {number} profileClass
 * @property {string} profileLabel
 * @property {string} distributorId
 * @property {string} formatted
 */

/**
 * @typedef {Object} ConnectionType
 * @property {string} value
 * @property {string} label
 * @property {string} description
 * @property {number} typicalLeadWeeks
 */

// ─── Offline DNO postcode area map ────────────────────────────────────────────
const DNO_MAP = {
  AB: { id:"10", name:"SSEN Transmission",        short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  AL: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  B:  { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  BA: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  BB: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  BD: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  BH: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  BL: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  BN: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  BS: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  CA: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  CB: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  CF: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  CH: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  CM: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  CR: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  CV: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  CW: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  DA: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  DD: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  DE: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  DG: { id:"18", name:"SP Energy Networks",         short:"SP Manweb",          region:"Southern Scotland",       emergency:"0330 10 10 444",mpanPrefix:"18", website:"https://www.spenergynetworks.co.uk" },
  DH: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  DL: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  DN: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  DT: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  DY: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  E:  { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  EC: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  EH: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  EN: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  EX: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  FK: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  FY: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  G:  { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  GL: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  GU: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  HA: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  HD: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  HG: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  HP: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  HR: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  HU: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  HX: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  IG: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  IP: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  IV: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  KA: { id:"18", name:"SP Energy Networks",         short:"SP Manweb",          region:"Southern Scotland",       emergency:"0330 10 10 444",mpanPrefix:"18", website:"https://www.spenergynetworks.co.uk" },
  KT: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  KW: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  KY: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  L:  { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  LA: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  LD: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  LE: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  LL: { id:"12", name:"SP Manweb",                  short:"SP Manweb",          region:"North Wales",             emergency:"0330 10 10 444",mpanPrefix:"12", website:"https://www.spenergynetworks.co.uk" },
  LN: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  LS: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  LU: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  M:  { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  ME: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  MK: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  ML: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  N:  { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  NE: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  NG: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  NN: { id:"24", name:"Western Power Distribution",short:"WPD East Mids",      region:"East Midlands",           emergency:"0800 096 3080", mpanPrefix:"24", website:"https://www.westernpower.co.uk" },
  NP: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  NR: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  NW: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  OL: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  OX: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  PA: { id:"19", name:"SP Energy Networks",         short:"SPD Central Scotland",region:"Central Scotland",       emergency:"0330 10 10 444",mpanPrefix:"19", website:"https://www.spenergynetworks.co.uk" },
  PE: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  PH: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
  PL: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  PO: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  PR: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  RG: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  RH: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  RM: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  S:  { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  SA: { id:"22", name:"Western Power Distribution",short:"WPD South Wales",    region:"South Wales",             emergency:"0800 052 0400", mpanPrefix:"22", website:"https://www.westernpower.co.uk" },
  SE: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  SG: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  SK: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  SL: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  SM: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  SN: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  SO: { id:"11", name:"SSEN Distribution",          short:"SSEN South",         region:"South of England",        emergency:"0800 048 3515", mpanPrefix:"11", website:"https://www.ssen.co.uk" },
  SR: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  SS: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  ST: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  SW: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  SY: { id:"12", name:"SP Manweb",                  short:"SP Manweb",          region:"Mid Wales / Shropshire",  emergency:"0330 10 10 444",mpanPrefix:"12", website:"https://www.spenergynetworks.co.uk" },
  TA: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  TD: { id:"18", name:"SP Energy Networks",         short:"SP Manweb",          region:"Southern Scotland",       emergency:"0330 10 10 444",mpanPrefix:"18", website:"https://www.spenergynetworks.co.uk" },
  TF: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  TN: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  TQ: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  TR: { id:"23", name:"Western Power Distribution",short:"WPD South West",     region:"South West England",      emergency:"0800 365 900",  mpanPrefix:"23", website:"https://www.westernpower.co.uk" },
  TS: { id:"17", name:"Northern Powergrid",         short:"NPg North East",     region:"North East England",      emergency:"0800 011 3332", mpanPrefix:"17", website:"https://www.northernpowergrid.com" },
  TW: { id:"14", name:"UK Power Networks",         short:"UKPN South East",    region:"South East England",      emergency:"0800 029 4285", mpanPrefix:"14", website:"https://www.ukpowernetworks.co.uk" },
  UB: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  W:  { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  WA: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  WC: { id:"13", name:"UK Power Networks",         short:"UKPN London",        region:"London",                  emergency:"0800 029 4285", mpanPrefix:"13", website:"https://www.ukpowernetworks.co.uk" },
  WD: { id:"15", name:"UK Power Networks",         short:"UKPN EoE",           region:"East of England",         emergency:"0800 029 4285", mpanPrefix:"15", website:"https://www.ukpowernetworks.co.uk" },
  WF: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  WN: { id:"21", name:"Electricity North West",    short:"ENW",                region:"North West England",      emergency:"0800 195 4141", mpanPrefix:"21", website:"https://www.enwl.co.uk" },
  WR: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  WS: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  WV: { id:"20", name:"Western Power Distribution",short:"WPD West Mids",      region:"West Midlands",           emergency:"0800 096 3080", mpanPrefix:"20", website:"https://www.westernpower.co.uk" },
  YO: { id:"16", name:"Northern Powergrid",         short:"NPg Yorkshire",      region:"Yorkshire",               emergency:"0800 011 3332", mpanPrefix:"16", website:"https://www.northernpowergrid.com" },
  ZE: { id:"10", name:"SSEN Transmission",          short:"SSEN North",         region:"North of Scotland",       emergency:"0345 026 2554", mpanPrefix:"10", website:"https://www.ssen.co.uk" },
};

// ID → DNO lookup (for MPAN prefix matching)
const DNO_BY_ID = Object.values(DNO_MAP).reduce((acc, d) => {
  if (!acc[d.id]) acc[d.id] = d;
  return acc;
}, {});

// ─── Connection types ─────────────────────────────────────────────────────────
const BASE_CONNECTION_TYPES = [
  { value:"new_residential",  label:"New residential connection",     description:"First-time supply to a new-build or converted property",  typicalLeadWeeks:11 },
  { value:"new_commercial",   label:"New commercial connection",       description:"Business premises requiring a new supply point",           typicalLeadWeeks:13 },
  { value:"upgrade_supply",   label:"Upgrade existing supply",         description:"Increase capacity at an already-connected property",       typicalLeadWeeks:8  },
  { value:"ev_charger",       label:"EV charger installation",         description:"Dedicated circuit for electric vehicle charging",          typicalLeadWeeks:6  },
  { value:"solar_export",     label:"Solar PV / battery export",       description:"G99 or G98 export connection for generation assets",       typicalLeadWeeks:10 },
  { value:"hv_connection",    label:"High voltage (HV) connection",    description:"11kV or 33kV supply for large commercial/industrial",      typicalLeadWeeks:26 },
  { value:"temporary",        label:"Temporary / construction supply", description:"Builder's supply for a site under development",            typicalLeadWeeks:4  },
  { value:"disconnection",    label:"Permanent disconnection",         description:"Remove an existing metered supply permanently",            typicalLeadWeeks:6  },
  { value:"diversions",       label:"Cable diversion / alteration",    description:"Reroute existing underground or overhead cables",          typicalLeadWeeks:16 },
  { value:"substation",       label:"New substation / transformer",    description:"DNO-owned substation for large development sites",         typicalLeadWeeks:40 },
];

const DNO_EXTRA_CONNECTION_TYPES = {
  "10": [{ value:"island_connection", label:"Island / remote connection", description:"Off-mainland supply requiring submarine or overhead works", typicalLeadWeeks:52 }],
  "13": [{ value:"smart_street",      label:"Smart Street low carbon",    description:"UKPN Smart Street zone upgrade for EVs and heat pumps",   typicalLeadWeeks:8  }],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Look up the DNO for a UK postcode.
 * Tries postcodes.io for geocoding first, then falls back to offline map.
 *
 * @param {string} postcode
 * @returns {Promise<DNOResult|null>}
 */
export async function lookupDNO(postcode) {
  const clean = postcode.replace(/\s+/g, "").toUpperCase();

  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    const data = await res.json();
    if (data.status === 200) {
      const offline = _lookupOffline(clean);
      if (offline) return { ...offline, source: "api", geo: data.result };
    }
  } catch { /* fall through to offline */ }

  const offline = _lookupOffline(clean);
  return offline ? { ...offline, source: "offline" } : null;
}

/**
 * Get the connection types available for a given DNO ID.
 * Pass null/undefined to get all base types.
 *
 * @param {string|null} dnoId
 * @returns {ConnectionType[]}
 */
export function getConnectionTypes(dnoId) {
  const extras = dnoId ? (DNO_EXTRA_CONNECTION_TYPES[dnoId] || []) : [];
  return [...BASE_CONNECTION_TYPES, ...extras];
}

/**
 * Validate a 21-digit MPAN string.
 * Performs modulo-11 check digit validation.
 *
 * @param {string} mpan - Raw digits, spaces allowed
 * @returns {MPANValidationResult}
 */
export function validateMPAN(mpan) {
  const digits = mpan.replace(/\s+/g, "");
  if (!/^\d{21}$/.test(digits)) {
    return { valid: false, error: "MPAN must be exactly 21 digits", profileClass: null, profileLabel: null, distributorId: null, formatted: mpan };
  }

  // Modulo-11 check on positions 9–20 (bottom 13 digits, last is check digit)
  const bottom13 = digits.slice(8);
  const primes   = [3, 5, 7, 13, 11, 17, 19, 23, 29, 31, 37, 41, 43];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(bottom13[i]) * primes[i];
  const expectedCheck = sum % 11 % 10;
  const actualCheck   = parseInt(bottom13[12]);
  const profileClass  = parseInt(digits.slice(1, 3));
  const distributorId = digits.slice(9, 11);

  return {
    valid:        expectedCheck === actualCheck,
    error:        expectedCheck !== actualCheck ? `Check digit invalid (expected ${expectedCheck}, got ${actualCheck})` : null,
    profileClass,
    profileLabel: _profileLabel(profileClass),
    distributorId,
    formatted:    formatMPAN(digits),
  };
}

/**
 * Format a raw 21-digit MPAN into readable grouped form.
 * Returns: "S  PP TC LLLL  DD OO SSSSSSSS C"
 *
 * @param {string} digits
 * @returns {string}
 */
export function formatMPAN(digits) {
  const d = digits.replace(/\s+/g, "");
  if (d.length !== 21) return digits;
  // Top line (check): d[0]
  // Profile class: d[1-2], Timeswitch: d[3-4], LLFC: d[5-8]
  // Bottom: Distributor ID d[9-10], Office d[11-12], MSID d[13-20], Check d[20]
  return `${d[0]}  ${d.slice(1,3)} ${d.slice(3,5)} ${d.slice(5,9)}  ${d.slice(9,11)} ${d.slice(11,13)} ${d.slice(13,21)}`;
}

/**
 * Look up the DNO from an MPAN's distributor ID prefix.
 *
 * @param {string} mpan
 * @returns {DNOResult|null}
 */
export function getDNOByMPAN(mpan) {
  const digits = mpan.replace(/\s+/g, "");
  if (digits.length < 11) return null;
  const distributorId = digits.slice(9, 11);
  return DNO_BY_ID[distributorId] ? { ...DNO_BY_ID[distributorId], source: "mpan" } : null;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _lookupOffline(clean) {
  const match = clean.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  if (!match) return null;
  const outward = match[1];
  const tries = [outward, outward.replace(/[A-Z]$/, ""), outward.replace(/\d[A-Z]?$/, ""), outward.replace(/\d{1,2}[A-Z]?$/, "")];
  for (const t of tries) {
    if (DNO_MAP[t]) return { ...DNO_MAP[t] };
  }
  return null;
}

function _profileLabel(pc) {
  const map = {
    1:"Domestic unrestricted", 2:"Domestic Economy 7",
    3:"Non-domestic unrestricted (<100MWh)", 4:"Non-domestic Economy 7 (<100MWh)",
    5:"Non-domestic max demand (>100MWh, NHH)", 6:"Non-domestic max demand (>100MWh, HH)",
    7:"Non-domestic, half-hourly", 8:"Non-domestic, HH aggregated",
  };
  return map[pc] || `Unknown profile class ${pc}`;
}