"use client";

import { Leaf, Users, TrendingUp, Shield, Award, Heart, Sprout, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  const stats = [
    { value: "10K+", label: "Registered Farmers", icon: Users },
    { value: "50K+", label: "Happy Customers", icon: Heart },
    { value: "100K+", label: "Products Sold", icon: Truck },
    { value: "95%", label: "Customer Satisfaction", icon: Award },
  ];

  const values = [
    {
      icon: Leaf,
      title: "Sustainability",
      description: "Promoting eco-friendly farming practices and reducing food waste through direct farm-to-market connections.",
    },
    {
      icon: Shield,
      title: "Transparency",
      description: "Real-time pricing, verified farmers, and complete traceability from farm to table.",
    },
    {
      icon: TrendingUp,
      title: "Innovation",
      description: "AI-powered price predictions and market insights to help farmers maximize their profits.",
    },
    {
      icon: Heart,
      title: "Community",
      description: "Building a supportive ecosystem where farmers and buyers grow together.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-emerald-50 py-20 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-emerald-200 rounded-full blur-3xl opacity-20" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full mb-6">
              <Sprout size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-700">Our Story</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight mb-6">
              Empowering Farmers Through
              <span className="text-green-600"> Technology</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              AgriSmart AI is revolutionizing the agricultural marketplace by connecting farmers directly with buyers, 
              providing real-time market intelligence, and leveraging AI to optimize pricing and demand forecasting.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Mission</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                To democratize agricultural market access and empower smallholder farmers with data-driven insights, 
                fair pricing, and direct connections to consumers.
              </p>
              <p className="text-slate-600 leading-relaxed">
                We believe that technology can bridge the gap between traditional farming practices and modern market 
                demands, creating sustainable livelihoods for millions of farmers while ensuring food security for communities.
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white">
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 opacity-80" />
                    <div className="text-3xl font-black">{stat.value}</div>
                    <div className="text-sm opacity-90">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              These principles guide everything we do at AgriSmart AI
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-slate-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Meet Our Team</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Passionate individuals committed to transforming agriculture through technology
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center group">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg group-hover:scale-105 transition-transform">
                  {member.initials}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{member.name}</h3>
                <p className="text-green-600 font-medium mb-2">{member.role}</p>
                <p className="text-slate-500 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Join the Agricultural Revolution?</h2>
          <p className="text-green-100 text-lg mb-8">
            Whether you're a farmer looking to sell or a buyer seeking fresh produce, we're here to help.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="px-8 py-3 bg-white text-green-600 rounded-xl font-bold hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
            <Link href="/contact" className="px-8 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-400 transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const teamMembers = [
  {
    initials: "YB",
    name: "Yaekob Bonke",
    role: "Founder & CEO",
    bio: "Agricultural economist passionate about connecting farmers to markets through technology.",
  },
  {
    initials: "AD",
    name: "Amanuel Demeke",
    role: "CTO",
    bio: "AI specialist building intelligent systems for agricultural price prediction.",
  },
  {
    initials: "ST",
    name: "Selam Tesfaye",
    role: "Head of Operations",
    bio: "Ensuring smooth marketplace operations and farmer support.",
  },
];