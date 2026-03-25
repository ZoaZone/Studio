import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    price: "$49",
    desc: "Perfect for small businesses getting started",
    features: [
      "1 Client Account",
      "500 AI Generations/mo",
      "1,000 Messages/mo",
      "3 Social Accounts",
      "Basic Funnels",
      "Email Support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    price: "$149",
    desc: "For growing businesses and freelancers",
    features: [
      "5 Client Accounts",
      "2,500 AI Generations/mo",
      "10,000 Messages/mo",
      "15 Social Accounts",
      "Advanced Funnels & Sequences",
      "Website Scanner",
      "Priority Support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Agency",
    price: "$399",
    desc: "Full power for agencies managing clients",
    features: [
      "Unlimited Clients",
      "10,000 AI Generations/mo",
      "50,000 Messages/mo",
      "Unlimited Social Accounts",
      "White-label Options",
      "API Access",
      "Dedicated Account Manager",
      "Custom Integrations",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white mb-12">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs text-white/60 mb-6">
            <Star className="w-3 h-3 text-gold" /> Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white">
            Choose Your <span className="gradient-text">Plan</span>
          </h1>
          <p className="text-white/40 mt-4 max-w-md mx-auto">
            Start free for 14 days. No credit card required. Upgrade anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className={`glass rounded-2xl p-8 relative flex flex-col ${
                plan.popular ? "border-magenta/30 neon-magenta" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-magenta text-xs font-bold text-white">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-xs text-white/40 mt-1">{plan.desc}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-sm text-white/40">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-white/60">
                    <Check className="w-4 h-4 text-magenta flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full h-11 font-semibold ${
                  plan.popular
                    ? "gradient-magenta hover:opacity-90 border-0 text-white"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                }`}
              >
                {plan.cta} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}