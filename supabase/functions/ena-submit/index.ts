import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ENA_BASE = 'https://hybrid.connect-direct.tst.energynetworks.org'
const ENA_API_KEY = 'Q9b0SR0xxZ7TNlgsWcwCY7572MlGgjuQEDyDQTO4'
const ENA_TENANT_ID = '66329264-5021-704a-29a0-c97efef3aa2c'
const ENA_AUTH = '42A9CC6E-BB1B-4921-96FD-0D000C4249FC'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, imageUrl, payload } = await req.json()

    if (action === 'upload-image') {
      const imageRes = await fetch(imageUrl)
      const blob = await imageRes.blob()
      const formData = new FormData()
      formData.append('file', blob, 'cutout.jpg')

      const res = await fetch(`${ENA_BASE}/upload-attachment/v1/upload`, {
        method: 'POST',
        headers: {
          'Authorization': ENA_AUTH,
          'X-API-Key': ENA_API_KEY,
          'X-Tenant-Id': ENA_TENANT_ID,
        },
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(`Image upload failed: ${JSON.stringify(data)}`)
      return new Response(JSON.stringify({ attachmentId: data.attachmentId || data.id || data.attachment_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'submit-application') {
      const res = await fetch(`${ENA_BASE}/connection-application/v1/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ENA_AUTH,
          'X-API-Key': ENA_API_KEY,
          'X-Tenant-Id': ENA_TENANT_ID,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(`ENA submission failed (${res.status}): ${JSON.stringify(data)}`)
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Unknown action')
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
