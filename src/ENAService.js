// ─── ENA Connect Direct Service ───────────────────────────────────────────────
// Handles all communication with ENA Connect Direct API

const ENA_BASE = "https://hybrid.connect-direct.tst.energynetworks.org";
const ENA_API_KEY = "Q9b0SR0xxZ7TNlgsWcwCY7572MlGgjuQEDyDQTO4";
const ENA_TENANT_ID = "66329264-5021-704a-29a0-c97efef3aa2c";
const ENA_AUTH = "42A9CC6E-BB1B-4921-96FD-0D000C4249FC";

const ENA_HEADERS = {
  "Content-Type": "application/json",
  Authorization: ENA_AUTH,
  "X-API-Key": ENA_API_KEY,
  "X-Tenant-Id": ENA_TENANT_ID,
};

// ─── Step 1: Upload cut-out image to ENA ─────────────────────────────────────
export async function uploadCutoutToENA(imageUrl) {
  try {
    // Fetch the image from Supabase storage
    const imageRes = await fetch(imageUrl);
    const blob = await imageRes.blob();

    const formData = new FormData();
    formData.append("file", blob, "cutout.jpg");

    const res = await fetch(`${ENA_BASE}/upload-attachment/v1/upload`, {
      method: "POST",
      headers: {
        Authorization: ENA_AUTH,
        "X-API-Key": ENA_API_KEY,
        "X-Tenant-Id": ENA_TENANT_ID,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Image upload failed: ${JSON.stringify(err)}`);
    }

    const data = await res.json();
    return data.attachmentId || data.id || data.attachment_id;
  } catch (e) {
    throw new Error(`Cut-out upload error: ${e.message}`);
  }
}

// ─── Step 2: Build application payload ───────────────────────────────────────
function buildPayload(app, profile, attachmentId) {
  const addressParts = app.site_address.split(",");
  const streetAddress = addressParts[0]?.trim() || app.site_address;
  const town = addressParts[1]?.trim() || "";

  const installerDetails = {
    name: profile?.full_name || "Installer",
    companyName: profile?.company_name || "Installation Company",
    installerNumber: profile?.installer_number || "",
    mcsNumber: profile?.mcs_number || "",
    phone: profile?.phone || "",
    email: profile?.email || "",
  };

  const siteAddress = {
    address: streetAddress,
    town: town,
    postcode: app.postcode,
  };

  const cutoutAttachment = {
    attachmentId: attachmentId,
    attachmentType: "CUT_OUT_IMAGE",
  };

  // ── G98 / G99 Solar PV ──
  if (app.type === "G98" || app.type === "G99") {
    return {
      applicationClass: "GENERATION_GENERAL",
      lcts: ["SOLAR_PV"],
      installer: installerDetails,
      siteAddress,
      mpan: app.mpan || undefined,
      supplyDetails: {
        declaredVoltageAtConnectionPoint: "230 V",
      },
      devicesToInstall: [
        {
          deviceType: "SOLAR_PV",
          installedCapacityKw: app.type === "G98" ? 3.68 : 5,
          exportLimitKw: app.type === "G98" ? 3.68 : 5,
        },
      ],
      attachments: [cutoutAttachment],
      customerName: app.customer_name,
      customerAddress: siteAddress,
    };
  }

  // ── EV Charger ──
  if (app.type === "EV") {
    return {
      applicationClass: "DEMAND_GENERAL",
      lcts: ["EVCP_AC"],
      installer: installerDetails,
      siteAddress,
      mpan: app.mpan || undefined,
      supplyDetails: {
        declaredVoltageAtConnectionPoint: "230 V",
      },
      devicesToInstall: [
        {
          deviceType: "EVCP_AC",
          ratedCurrentAmps: 32,
          quantity: 1,
        },
      ],
      attachments: [cutoutAttachment],
      customerName: app.customer_name,
      customerAddress: siteAddress,
    };
  }

  // ── Heat Pump ──
  if (app.type === "HeatPump") {
    return {
      applicationClass: "DEMAND_GENERAL",
      lcts: ["HP"],
      installer: installerDetails,
      siteAddress,
      mpan: app.mpan || undefined,
      supplyDetails: {
        declaredVoltageAtConnectionPoint: "230 V",
      },
      devicesToInstall: [
        {
          deviceType: "HP",
          ratedOutputKw: 8,
          quantity: 1,
        },
      ],
      attachments: [cutoutAttachment],
      customerName: app.customer_name,
      customerAddress: siteAddress,
    };
  }

  throw new Error(`Unknown application type: ${app.type}`);
}

// ─── Step 3: Submit application to ENA ───────────────────────────────────────
export async function submitToENA(app, profile, attachmentId) {
  const payload = buildPayload(app, profile, attachmentId);

  const res = await fetch(`${ENA_BASE}/connection-application/v1/create`, {
    method: "POST",
    headers: ENA_HEADERS,
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      `ENA submission failed (${res.status}): ${JSON.stringify(data)}`,
    );
  }

  return {
    applicationId: data.applicationId || data.id,
    status: data.status || "Awaiting Assessment",
    raw: data,
  };
}

// ─── Step 4: Check application status ────────────────────────────────────────
export async function checkENAStatus(enaApplicationId) {
  const res = await fetch(
    `${ENA_BASE}/connection-application/v1/applications?applicationId=${enaApplicationId}`,
    { headers: ENA_HEADERS },
  );

  if (!res.ok) throw new Error("Could not fetch ENA status");

  const data = await res.json();
  const app = Array.isArray(data) ? data[0] : data;
  return app?.status || "Unknown";
}
