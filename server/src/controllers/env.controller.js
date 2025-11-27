// server/src/controllers/env.controller.js - Environment Health Check Controller

import Stripe from "stripe";

/**
 * Checks the status of critical environment variables (Stripe API key and Price ID).
 * Used primarily for health checks or debugging deployment configuration.
 */
export async function envCheck(req, res) {
    try {
        const key = process.env.STRIPE_SECRET_KEY || "";
        const priceId = process.env.STRIPE_PRICE_ID || "";
        
        // Initialize Stripe client with a recent API version
        const stripe = new Stripe(key, { apiVersion: "2023-10-16" });

        // 1. Retrieve Stripe Account Details
        const account = await stripe.accounts.retrieve();
        
        // 2. Check Stripe Price ID validity
        let priceOk = false;
        let priceData = null;
        try {
            priceData = await stripe.prices.retrieve(priceId);
            priceOk = true;
        } catch (e) {
            // Log the price lookup error but allow the check to continue
            priceData = { error: e?.message || String(e) };
        }

        // 3. Return environment status
        res.json({
            ok: true,
            keyPrefix: key ? key.slice(0, 12) : null, // Show truncated key for safety
            mode: key.startsWith("sk_test_")
                ? "test"
                : key.startsWith("sk_live_")
                    ? "live"
                    : "unknown",
            account: { id: account.id, business_profile: account?.business_profile },
            priceId,
            priceOk,
            priceData,
            webOrigin: process.env.WEB_ORIGIN,
            appUrl: process.env.APP_URL,
            port: process.env.PORT,
        });
    } catch (err) {
        // Handle critical failures (e.g., Stripe API key is invalid or connection error)
        res.status(500).json({ 
          ok: false, 
          message: err?.message || "Failed to connect to Stripe or retrieve account details." 
        });
    }
}