import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";

const DNO_MAP = {
  BB: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  AB: {
    id: "10",
    name: "SSEN Transmission",
    region: "North of Scotland",
    emergency: "0345 026 2554",
  },
  AL: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  B: {
    id: "20",
    name: "Western Power Distribution",
    region: "West Midlands",
    emergency: "0800 096 3080",
  },
  BA: {
    id: "23",
    name: "Western Power Distribution",
    region: "South West",
    emergency: "0800 365 900",
  },
  BD: {
    id: "16",
    name: "Northern Powergrid",
    region: "Yorkshire",
    emergency: "0800 011 3332",
  },
  BH: {
    id: "11",
    name: "SSEN Distribution",
    region: "South of England",
    emergency: "0800 048 3515",
  },
  BL: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  BN: {
    id: "14",
    name: "UK Power Networks",
    region: "South East",
    emergency: "0800 029 4285",
  },
  BS: {
    id: "23",
    name: "Western Power Distribution",
    region: "South West",
    emergency: "0800 365 900",
  },
  CA: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  CB: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  CF: {
    id: "22",
    name: "Western Power Distribution",
    region: "South Wales",
    emergency: "0800 052 0400",
  },
  CH: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  CM: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  CR: {
    id: "14",
    name: "UK Power Networks",
    region: "South East",
    emergency: "0800 029 4285",
  },
  CV: {
    id: "20",
    name: "Western Power Distribution",
    region: "West Midlands",
    emergency: "0800 096 3080",
  },
  CW: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  DA: {
    id: "14",
    name: "UK Power Networks",
    region: "South East",
    emergency: "0800 029 4285",
  },
  DD: {
    id: "10",
    name: "SSEN Transmission",
    region: "North of Scotland",
    emergency: "0345 026 2554",
  },
  DE: {
    id: "24",
    name: "Western Power Distribution",
    region: "East Midlands",
    emergency: "0800 096 3080",
  },
  DG: {
    id: "18",
    name: "SP Energy Networks",
    region: "Southern Scotland",
    emergency: "0330 10 10 444",
  },
  DH: {
    id: "17",
    name: "Northern Powergrid",
    region: "North East",
    emergency: "0800 011 3332",
  },
  DL: {
    id: "17",
    name: "Northern Powergrid",
    region: "North East",
    emergency: "0800 011 3332",
  },
  DN: {
    id: "16",
    name: "Northern Powergrid",
    region: "Yorkshire",
    emergency: "0800 011 3332",
  },
  DT: {
    id: "23",
    name: "Western Power Distribution",
    region: "South West",
    emergency: "0800 365 900",
  },
  DY: {
    id: "20",
    name: "Western Power Distribution",
    region: "West Midlands",
    emergency: "0800 096 3080",
  },
  E: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  EC: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  EH: {
    id: "19",
    name: "SP Energy Networks",
    region: "Central Scotland",
    emergency: "0330 10 10 444",
  },
  EN: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  EX: {
    id: "23",
    name: "Western Power Distribution",
    region: "South West",
    emergency: "0800 365 900",
  },
  FK: {
    id: "19",
    name: "SP Energy Networks",
    region: "Central Scotland",
    emergency: "0330 10 10 444",
  },
  FY: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  G: {
    id: "19",
    name: "SP Energy Networks",
    region: "Central Scotland",
    emergency: "0330 10 10 444",
  },
  GL: {
    id: "23",
    name: "Western Power Distribution",
    region: "South West",
    emergency: "0800 365 900",
  },
  GU: {
    id: "11",
    name: "SSEN Distribution",
    region: "South of England",
    emergency: "0800 048 3515",
  },
  HA: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  HD: {
    id: "16",
    name: "Northern Powergrid",
    region: "Yorkshire",
    emergency: "0800 011 3332",
  },
  HG: {
    id: "16",
    name: "Northern Powergrid",
    region: "Yorkshire",
    emergency: "0800 011 3332",
  },
  HP: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  HR: {
    id: "20",
    name: "Western Power Distribution",
    region: "West Midlands",
    emergency: "0800 096 3080",
  },
  HU: {
    id: "16",
    name: "Northern Powergrid",
    region: "Yorkshire",
    emergency: "0800 011 3332",
  },
  HX: {
    id: "16",
    name: "Northern Powergrid",
    region: "Yorkshire",
    emergency: "0800 011 3332",
  },
  IG: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  IP: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  IV: {
    id: "10",
    name: "SSEN Transmission",
    region: "North of Scotland",
    emergency: "0345 026 2554",
  },
  KA: {
    id: "18",
    name: "SP Energy Networks",
    region: "Southern Scotland",
    emergency: "0330 10 10 444",
  },
  KT: {
    id: "14",
    name: "UK Power Networks",
    region: "South East",
    emergency: "0800 029 4285",
  },
  KW: {
    id: "10",
    name: "SSEN Transmission",
    region: "North of Scotland",
    emergency: "0345 026 2554",
  },
  KY: {
    id: "19",
    name: "SP Energy Networks",
    region: "Central Scotland",
    emergency: "0330 10 10 444",
  },
  L: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  LA: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  LD: {
    id: "22",
    name: "Western Power Distribution",
    region: "South Wales",
    emergency: "0800 052 0400",
  },
  LE: {
    id: "24",
    name: "Western Power Distribution",
    region: "East Midlands",
    emergency: "0800 096 3080",
  },
  LL: {
    id: "12",
    name: "SP Manweb",
    region: "North Wales",
    emergency: "0330 10 10 444",
  },
  LN: {
    id: "24",
    name: "Western Power Distribution",
    region: "East Midlands",
    emergency: "0800 096 3080",
  },
  LS: {
    id: "16",
    name: "Northern Powergrid",
    region: "Yorkshire",
    emergency: "0800 011 3332",
  },
  LU: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  M: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  ME: {
    id: "14",
    name: "UK Power Networks",
    region: "South East",
    emergency: "0800 029 4285",
  },
  MK: {
    id: "24",
    name: "Western Power Distribution",
    region: "East Midlands",
    emergency: "0800 096 3080",
  },
  ML: {
    id: "19",
    name: "SP Energy Networks",
    region: "Central Scotland",
    emergency: "0330 10 10 444",
  },
  N: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  NE: {
    id: "17",
    name: "Northern Powergrid",
    region: "North East",
    emergency: "0800 011 3332",
  },
  NG: {
    id: "24",
    name: "Western Power Distribution",
    region: "East Midlands",
    emergency: "0800 096 3080",
  },
  NN: {
    id: "24",
    name: "Western Power Distribution",
    region: "East Midlands",
    emergency: "0800 096 3080",
  },
  NP: {
    id: "22",
    name: "Western Power Distribution",
    region: "South Wales",
    emergency: "0800 052 0400",
  },
  NR: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  NW: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  OL: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  OX: {
    id: "11",
    name: "SSEN Distribution",
    region: "South of England",
    emergency: "0800 048 3515",
  },
  PA: {
    id: "19",
    name: "SP Energy Networks",
    region: "Central Scotland",
    emergency: "0330 10 10 444",
  },
  PE: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  PH: {
    id: "10",
    name: "SSEN Transmission",
    region: "North of Scotland",
    emergency: "0345 026 2554",
  },
  PL: {
    id: "23",
    name: "Western Power Distribution",
    region: "South West",
    emergency: "0800 365 900",
  },
  PO: {
    id: "11",
    name: "SSEN Distribution",
    region: "South of England",
    emergency: "0800 048 3515",
  },
  PR: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  RG: {
    id: "11",
    name: "SSEN Distribution",
    region: "South of England",
    emergency: "0800 048 3515",
  },
  RH: {
    id: "14",
    name: "UK Power Networks",
    region: "South East",
    emergency: "0800 029 4285",
  },
  RM: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  S: {
    id: "16",
    name: "Northern Powergrid",
    region: "Yorkshire",
    emergency: "0800 011 3332",
  },
  SA: {
    id: "22",
    name: "Western Power Distribution",
    region: "South Wales",
    emergency: "0800 052 0400",
  },
  SE: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  SG: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  SK: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  SL: {
    id: "11",
    name: "SSEN Distribution",
    region: "South of England",
    emergency: "0800 048 3515",
  },
  SM: {
    id: "14",
    name: "UK Power Networks",
    region: "South East",
    emergency: "0800 029 4285",
  },
  SN: {
    id: "23",
    name: "Western Power Distribution",
    region: "South West",
    emergency: "0800 365 900",
  },
  SO: {
    id: "11",
    name: "SSEN Distribution",
    region: "South of England",
    emergency: "0800 048 3515",
  },
  SR: {
    id: "17",
    name: "Northern Powergrid",
    region: "North East",
    emergency: "0800 011 3332",
  },
  SS: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  ST: {
    id: "20",
    name: "Western Power Distribution",
    region: "West Midlands",
    emergency: "0800 096 3080",
  },
  SW: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  SY: {
    id: "12",
    name: "SP Manweb",
    region: "Mid Wales",
    emergency: "0330 10 10 444",
  },
  TA: {
    id: "23",
    name: "Western Power Distribution",
    region: "South West",
    emergency: "0800 365 900",
  },
  TD: {
    id: "18",
    name: "SP Energy Networks",
    region: "Southern Scotland",
    emergency: "0330 10 10 444",
  },
  TF: {
    id: "20",
    name: "Western Power Distribution",
    region: "West Midlands",
    emergency: "0800 096 3080",
  },
  TN: {
    id: "14",
    name: "UK Power Networks",
    region: "South East",
    emergency: "0800 029 4285",
  },
  TQ: {
    id: "23",
    name: "Western Power Distribution",
    region: "South West",
    emergency: "0800 365 900",
  },
  TR: {
    id: "23",
    name: "Western Power Distribution",
    region: "South West",
    emergency: "0800 365 900",
  },
  TS: {
    id: "17",
    name: "Northern Powergrid",
    region: "North East",
    emergency: "0800 011 3332",
  },
  TW: {
    id: "14",
    name: "UK Power Networks",
    region: "South East",
    emergency: "0800 029 4285",
  },
  UB: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  W: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  WA: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  WC: {
    id: "13",
    name: "UK Power Networks",
    region: "London",
    emergency: "0800 029 4285",
  },
  WD: {
    id: "15",
    name: "UK Power Networks",
    region: "East of England",
    emergency: "0800 029 4285",
  },
  WF: {
    id: "16",
    name: "Northern Powergrid",
    region: "Yorkshire",
    emergency: "0800 011 3332",
  },
  WN: {
    id: "21",
    name: "Electricity North West",
    region: "North West England",
    emergency: "0800 195 4141",
  },
  WR: {
    id: "20",
    name: "Western Power Distribution",
    region: "West Midlands",
    emergency: "0800 096 3080",
  },
  WS: {
    id: "20",
    name: "Western Power Distribution",
    region: "West Midlands",
    emergency: "0800 096 3080",
  },
  WV: {
    id: "20",
    name: "Western Power Distribution",
    region: "West Midlands",
    emergency: "0800 096 3080",
  },
  YO: {
    id: "16",
    name: "Northern Powergrid",
    region: "Yorkshire",
    emergency: "0800 011 3332",
  },
  ZE: {
    id: "10",
    name: "SSEN Transmission",
    region: "North of Scotland",
    emergency: "0345 026 2554",
  },
};

function lookupDNO(postcode) {
  const clean = postcode.replace(/\s+/g, "").toUpperCase();
  const match = clean.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  if (!match) return null;
  const outward = match[1];
  const tries = [
    outward,
    outward.replace(/[A-Z]$/, ""),
    outward.replace(/\d[A-Z]?$/, ""),
    outward.replace(/\d{1,2}[A-Z]?$/, ""),
  ];
  for (const t of tries) {
    if (DNO_MAP[t]) return DNO_MAP[t];
  }
  return null;
}

function validateMPAN(mpan) {
  const digits = mpan.replace(/\s+/g, "");
  if (!/^\d{21}$/.test(digits))
    return { valid: false, error: "MPAN must be 21 digits" };
  const primes = [3, 5, 7, 13, 11, 17, 19, 23, 29, 31, 37, 41, 43];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[8 + i]) * primes[i];
  const expected = (sum % 11) % 10;
  return {
    valid: expected === parseInt(digits[20]),
    error: expected !== parseInt(digits[20]) ? "Check digit invalid" : null,
  };
}

export default function NewApplication({ setCurrentPage, demoMode }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [dno, setDno] = useState(null);
  const [dnoStatus, setDnoStatus] = useState("idle");
  const [mpanCheck, setMpanCheck] = useState(null);
  const [cutoutFile, setCutoutFile] = useState(null);
  const [cutoutPreview, setCutoutPreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const postcodeTimer = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    type: "G98",
    customer_name: "",
    site_address: "",
    postcode: "",
    mpan: "",
    status: "draft",
  });

  useEffect(() => {
    const pc = form.postcode.trim();
    if (pc.length < 3) {
      setDno(null);
      setDnoStatus("idle");
      return;
    }
    clearTimeout(postcodeTimer.current);
    setDnoStatus("loading");
    postcodeTimer.current = setTimeout(() => {
      const found = lookupDNO(pc);
      if (found) {
        setDno(found);
        setDnoStatus("found");
      } else setDnoStatus("error");
    }, 500);
    return () => clearTimeout(postcodeTimer.current);
  }, [form.postcode]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "mpan") {
      const digits = value.replace(/\s+/g, "");
      setMpanCheck(digits.length === 21 ? validateMPAN(value) : null);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10MB");
      return;
    }
    setCutoutFile(file);
    setCutoutPreview(URL.createObjectURL(file));
  }

  function removeImage() {
    setCutoutFile(null);
    setCutoutPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function uploadCutoutImage(userId) {
    if (!cutoutFile) return null;
    setUploadingImage(true);
    const ext = cutoutFile.name.split(".").pop();
    const filename = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("cutout-images")
      .upload(filename, cutoutFile, { upsert: true });
    setUploadingImage(false);
    if (error) {
      console.error("Image upload error:", error);
      return null;
    }
    const { data } = supabase.storage
      .from("cutout-images")
      .getPublicUrl(filename);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (demoMode) {
      alert(
        "Demo mode — no data will be saved. Exit demo mode to save real applications.",
      );
      return;
    }
    if (dnoStatus !== "found") {
      alert("Please enter a valid postcode so we can identify the DNO.");
      return;
    }
    setLoading(true);
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
      alert("You must be logged in to save an application.");
      setLoading(false);
      return;
    }

    // Upload cut-out image if provided
    const cutoutImageUrl = await uploadCutoutImage(user.id);

    const { error } = await supabase.from("applications").insert([
      {
        ...form,
        dno_name: dno.name,
        dno_region: dno.region,
        dno_emergency: dno.emergency,
        user_id: user.id,
        cutout_image_url: cutoutImageUrl,
      },
    ]);

    setLoading(false);
    if (!error) {
      try {
        await supabase.functions.invoke("send-email", {
          body: {
            customer_name: form.customer_name,
            site_address: form.site_address,
            postcode: form.postcode,
            mpan: form.mpan,
            type: form.type,
            status: form.status,
            dno_name: dno?.name,
            dno_region: dno?.region,
            dno_emergency: dno?.emergency,
          },
        });
      } catch (e) {
        console.log("Email error:", e);
      }
      setSuccess(true);
      setTimeout(() => setCurrentPage("dashboard"), 1500);
    } else {
      alert("Error saving application: " + error.message);
    }
  }

  if (success) {
    return (
      <div className="text-center py-16">
        <div className="text-green-500 text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Application Saved!
        </h2>
        <p className="text-gray-500">Redirecting to dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        New DNO Application
      </h2>

      {demoMode && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-sm text-orange-700">
          Demo mode — filling in this form will not save any data.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Application Type
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="G98">G98 — Small scale (up to 3.68kW)</option>
            <option value="G99">G99 — Large scale (over 3.68kW)</option>
            <option value="EV">EV Charger Installation</option>
            <option value="HeatPump">Heat Pump Installation</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name
          </label>
          <input
            type="text"
            name="customer_name"
            value={form.customer_name}
            onChange={handleChange}
            placeholder="e.g. John Smith"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Site Address
          </label>
          <input
            type="text"
            name="site_address"
            value={form.site_address}
            onChange={handleChange}
            placeholder="e.g. 123 Main Street, Burnley"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postcode
          </label>
          <div className="relative">
            <input
              type="text"
              name="postcode"
              value={form.postcode}
              onChange={handleChange}
              placeholder="e.g. BB11 1AA"
              required
              maxLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase pr-8"
            />
            {dnoStatus === "loading" && (
              <span className="absolute right-3 top-2.5 text-gray-400 text-sm">
                ⟳
              </span>
            )}
            {dnoStatus === "found" && (
              <span className="absolute right-3 top-2.5 text-green-500 text-sm">
                ✓
              </span>
            )}
          </div>
          {dnoStatus === "found" && dno && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 mb-0.5">
                Distribution Network Operator
              </p>
              <p className="text-sm font-semibold text-blue-800">{dno.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {dno.region} · Emergency: {dno.emergency}
              </p>
            </div>
          )}
          {dnoStatus === "error" && (
            <p className="mt-1 text-xs text-red-500">
              Postcode not recognised — please check and try again.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            MPAN Number{" "}
            <span className="text-gray-400 font-normal">
              (21 digits — optional)
            </span>
          </label>
          <input
            type="text"
            name="mpan"
            value={form.mpan}
            onChange={handleChange}
            placeholder="21 digit MPAN number"
            maxLength={21}
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${mpanCheck && !mpanCheck.valid ? "border-red-400" : "border-gray-300"}`}
          />
          {mpanCheck && (
            <p
              className={`mt-1 text-xs ${mpanCheck.valid ? "text-green-600" : "text-red-500"}`}
            >
              {mpanCheck.valid ? "✓ MPAN valid" : "✗ " + mpanCheck.error}
            </p>
          )}
        </div>

        {/* Cut-out image upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cut-Out Image
            <span className="text-blue-600 font-normal ml-1">
              (Required for ENA Connect Direct submission)
            </span>
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Photo of the consumer unit cut-out / fuse. Must be within 1 metre of
            the cut-out. Max 10MB.
          </p>

          {!cutoutPreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
            >
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm font-medium text-gray-600">
                Click to upload cut-out photo
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG or PDF — max 10MB
              </p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={cutoutPreview}
                alt="Cut-out preview"
                className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 transition"
              >
                ✕
              </button>
              <p className="text-xs text-green-600 mt-1">
                ✓ Cut-out image ready — {cutoutFile?.name}
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={
              loading || uploadingImage || (!demoMode && dnoStatus !== "found")
            }
            className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50"
          >
            {uploadingImage
              ? "Uploading image..."
              : loading
                ? "Saving..."
                : demoMode
                  ? "Save Application (Demo)"
                  : "Save Application"}
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage("dashboard")}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
