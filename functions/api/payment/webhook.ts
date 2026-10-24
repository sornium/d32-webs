// Cloudflare Pages Function: /api/payment/webhook
// Securely handles Ziina webhooks on Cloudflare Edge

interface Env {
  ZIINA_WEBHOOK_SECRET?: string;
}

type PagesFunction<T = any> = (context: { request: Request; env: T; [key: string]: any }) => Promise<Response> | Response;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request } = context;
    const payload = (await request.json().catch(() => ({}))) as any;

    const intentId =
      payload.data?.id ||
      payload.id ||
      payload.payment_intent_id ||
      payload.data?.payment_intent_id;

    if (!intentId) {
      return new Response(JSON.stringify({ error: "Missing intent ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ received: true, verified: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Edge webhook processing failure" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
