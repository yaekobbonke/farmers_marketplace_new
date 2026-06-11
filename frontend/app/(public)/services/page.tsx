"use client";

import { 
  TrendingUp, 
  ShoppingCart, 
  BarChart3, 
  MessageSquare, 
  Shield, 
  Truck,
  Sparkles,
  Users,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function ServicesPage() {
  const services = [
    {
      icon: TrendingUp,
      title: "AI Price Intelligence",
      description: "Real-time market price predictions and trend analysis to help farmers maximize profits.",
      features: ["Live price tracking", "7-day forecasts", "Regional comparisons", "Historical data"],
      color: "bg-blue-500",
    },
    {
      icon: ShoppingCart,
      title: "Direct Marketplace",
      description: "Connect directly with buyers, eliminate middlemen, and get fair prices for your produce.",
      features: ["No commission fees", "Direct buyer contact", "Bulk order management", "Secure payments"],
      color: "bg-green-500",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Comprehensive analytics to track sales, monitor inventory, and optimize your listings.",
      features: ["Sales reports", "Inventory tracking", "Customer insights", "Performance metrics"],
      color: "bg-purple-500",
    },
    {
      icon: MessageSquare,
      title: "AI Assistant",
      description: "24/7 AI-powered assistant to answer farming questions and provide expert advice.",
      features: ["Instant responses", "Farming tips", "Pest identification", "Seasonal guidance"],
      color: "bg-orange-500",
    },
    {
      icon: Shield,
      title: "Quality Assurance",
      description: "Verified farmers and quality-checked products to ensure buyer satisfaction.",
      features: ["Farmer verification", "Product quality checks", "Rating system", "Buyer protection"],
      color: "bg-red-500",
    },
    {
      icon: Truck,
      title: "Logistics Support",
      description: "Connect with reliable logistics partners for efficient product delivery.",
      features: ["Delivery tracking", "Route optimization", "Cost calculation", "Partner network"],
      color: "bg-yellow-500",
    },
  ];

  const pricingPlans = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for small-scale farmers",
      features: ["List up to 10 products", "Basic analytics", "Email support", "Marketplace access"],
      button: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "499 ETB",
      description: "For growing farms and businesses",
      features: ["Unlimited listings", "Advanced analytics", "Priority support", "AI price predictions", "Bulk export tools"],
      button: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large-scale operations",
      features: ["Custom integrations", "Dedicated account manager", "API access", "Custom training", "24/7 phone support"],
      button: "Contact Sales",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
            <Sparkles size={16} />
            <span className="text-sm font-medium">Our Services</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black mb-6">
            Everything You Need to Succeed
          </h1>
          <p className="text-xl text-green-100 max-w-3xl mx-auto">
            Comprehensive tools and services designed to empower farmers and streamline agricultural commerce.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-lg transition-shadow group">
                <div className={`w-14 h-14 ${service.color} bg-opacity-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon className={`w-7 h-7 ${service.color.replace("bg-", "text-")}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-500 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle size={14} className="text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-slate-600">Choose the plan that works best for your farming business</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-white rounded-2xl p-8 shadow-sm relative ${plan.popular ? 'ring-2 ring-green-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  {plan.price !== "Custom" && <span className="text-slate-500">/month</span>}
                </div>
                <p className="text-slate-500 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle size={14} className="text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-bold transition-colors ${
                  plan.popular 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}>
                  {plan.button}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-slate-600 mb-8">
            Join thousands of farmers already using AgriSmart AI to grow their business.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}