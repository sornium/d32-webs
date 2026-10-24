// Cloudflare Pages Function: /api/payment/intent
// Securely executed in Cloudflare Edge Workers runtime with Zero Secret Exposure

interface Env {
  ZIINA_API_KEY?: string;
  ZIINA_TEST_MODE?: string;
}

type PagesFunction<T = any> = (context: { request: Request; env: T; [key: string]: any }) => Promise<Response> | Response;

const ZIINA_API_BASE = "https://api-v2.ziina.com/api";
const SUPPORTED_CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "QAR", "KWD", "BHD", "OMR", "INR"];
const THREE_DECIMAL = ["KWD", "BHD", "OMR"];

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = (await request.json().catch(() => ({}))) as any;
    const { items, cartItems, amount, currency = "USD", customerEmail } = body;

    const rawItems = items || cartItems || [];
    if (!amount && (!rawItems || rawItems.length === 0)) {
      return new Response(JSON.stringify({ error: "Missing required order items or amount." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rawCurr = String(currency).toUpperCase();
    const currency_code = SUPPORTED_CURRENCIES.includes(rawCurr) ? rawCurr : "USD";
    const multiplier = THREE_DECIMAL.includes(currency_code) ? 1000 : 100;
    const smallestUnitAmount = Math.max(1, Math.round(Number(amount || 0) * multiplier));

    const displayOrderId = `D32-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const url = new URL(request.url);
    const origin = url.origin;

    const apiKey = (env.ZIINA_API_KEY || "").trim();
    const isLive = apiKey.length >= 20 && !apiKey.toLowerCase().includes("test");

    if (!isLive) {
      const simId = `sim_ziina_${Date.now()}`;
      const redirectUrl = `${origin}/order/success?order_id=${displayOrderId}&intent_id=${simId}&simulated=true`;

      return new Response(
        JSON.stringify({
          success: true,
          redirect_url: redirectUrl,
          intent_id: simId,
          order_id: displayOrderId,
          simulated: true,
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Call Ziina API v2
    const ziinaRes = await fetch(`${ZIINA_API_BASE}/payment_intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        amount: smallestUnitAmount,
        currency_code,
        message: `d32.store Order #${displayOrderId}`,
        success_url: `${origin}/order/success?order_id=${displayOrderId}`,
        cancel_url: `${origin}/cart?canceled=true`,
        test: env.ZIINA_TEST_MODE === "true" || apiKey.toLowerCase().includes("test"),
      }),
    });

    const ziinaData = (await ziinaRes.json().catch(() => ({}))) as any;

    if (!ziinaRes.ok) {
      if (ziinaRes.status === 401 || ziinaRes.status === 403) {
        const simId = `sim_ziina_${Date.now()}`;
        const redirectUrl = `${origin}/order/success?order_id=${displayOrderId}&intent_id=${simId}&simulated=true`;
        return new Response(
          JSON.stringify({
            success: true,
            redirect_url: redirectUrl,
            intent_id: simId,
            order_id: displayOrderId,
            simulated: true,
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: ziinaData.message || `Ziina rejected payment intent (${ziinaRes.status})` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        redirect_url: ziinaData.redirect_url || ziinaData.payment_url,
        intent_id: ziinaData.id,
        order_id: displayOrderId,
        simulated: false,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Internal edge worker error processing payment intent." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
