import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, template_params } = await req.json()

    if (!action || !template_params) {
      return new Response(
        JSON.stringify({ error: 'Missing action or template_params in request payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resolve template ID securely on server-side based on authorized action
    let templateId = ''
    let resolvedParams = { ...template_params }

    if (action === 'contact_inquiry') {
      templateId = Deno.env.get('EMAILJS_TEMPLATE_ID') || ''
    } else if (action === 'partner_onboarding') {
      const onboardingTemplate = Deno.env.get('EMAILJS_ONBOARDING_TEMPLATE_ID')
      if (onboardingTemplate && onboardingTemplate !== 'template_partner_onboarding_placeholder' && onboardingTemplate.trim() !== '') {
        templateId = onboardingTemplate
      } else {
        // Fallback to generic template
        templateId = Deno.env.get('EMAILJS_TEMPLATE_ID') || ''
        const p = template_params
        const messageBody = `New Channel Partner Onboarding Application submitted.
Reference ID: ${p.appId}
Timestamp: ${p.timestamp}

CORPORATE DETAILS:
Representative Name: ${p.repName}
Designation / Position: ${p.designation}
Company Legal Name: ${p.companyName}
Registered Email: ${p.email}
Contact Phone: ${p.phone}
Preferred Channel Role: ${p.role}

OPERATIONAL DETAILS:
${p.detailsMessage || ''}`

        resolvedParams = {
          from_name: `${p.repName} (${p.companyName})`,
          from_email: p.email,
          from_phone: p.phone,
          target_dept: 'Partner Onboarding',
          subject_text: `[Onboarding Application] ${p.companyName} (${p.role})`,
          message_body: messageBody
        }
      }
    } else {
      return new Response(
        JSON.stringify({ error: `Unauthorized action: ${action}` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!templateId) {
      console.error(`EmailJS template ID for action "${action}" is not configured in Supabase Secrets.`)
      return new Response(
        JSON.stringify({ error: `Configuration error for action: ${action}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Read credentials from Edge Function secrets environment
    const serviceId = Deno.env.get('EMAILJS_SERVICE_ID')
    const publicKey = Deno.env.get('EMAILJS_PUBLIC_KEY')
    const privateKey = Deno.env.get('EMAILJS_PRIVATE_KEY')

    if (!serviceId || !publicKey) {
      console.error('EmailJS credentials are not configured in Supabase Secrets.')
      return new Response(
        JSON.stringify({ error: 'Mail proxy credentials missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Forwarding email notification to EmailJS. Action: ${action}, Template: ${templateId}`)

    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        ...(privateKey ? { accessToken: privateKey } : {}),
        template_params: resolvedParams,
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error('EmailJS service returned error:', errorText)
      return new Response(
        JSON.stringify({ error: `EmailJS dispatch failed: ${errorText}` }),
        { status: emailResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Failed to proxy email dispatch:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
