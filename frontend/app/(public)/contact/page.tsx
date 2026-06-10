"use client";

import { useState, useEffect } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle,
  MessageSquare,
  XCircle,
  Loader2,
  Mail as MailIcon,
  Bell,
  Globe,
  Share2,
  Linkedin,
  Instagram,
  Youtube
} from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  // Google Maps
  const [mapError, setMapError] = useState(false);

  // Social media links (UPDATE THESE WITH YOUR ACTUAL PROFILES)
  const socialLinks = {
    facebook: "https://facebook.com/agrismart",
    twitter: "https://twitter.com/agrismart",
    linkedin: "https://linkedin.com/company/agrismart",
    instagram: "https://instagram.com/agrismart",
    youtube: "https://youtube.com/@agrismart",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", email: "", subject: "", message: "" });
        
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    setNewsletterStatus("loading");
    setNewsletterMessage("");

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newsletterEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewsletterStatus("success");
        setNewsletterMessage("Successfully subscribed to our newsletter!");
        setNewsletterEmail("");
        
        setTimeout(() => {
          setNewsletterStatus("idle");
          setNewsletterMessage("");
        }, 5000);
      } else {
        setNewsletterStatus("error");
        setNewsletterMessage(data.message || "Subscription failed. Please try again.");
        
        setTimeout(() => {
          setNewsletterStatus("idle");
          setNewsletterMessage("");
        }, 5000);
      }
    } catch (err) {
      setNewsletterStatus("error");
      setNewsletterMessage("Network error. Please try again.");
      
      setTimeout(() => {
        setNewsletterStatus("idle");
        setNewsletterMessage("");
      }, 5000);
    }
  };

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      details: "support@agrismart.com",
      sub: "sales@agrismart.com",
      link: "mailto:support@agrismart.com",
    },
    {
      icon: Phone,
      title: "Call Us",
      details: "0916879491",
      sub: "Mon-Fri, 9am-5pm",
      link: "tel:0916879491",
    },
    {
      icon: MapPin,
      title: "Visit Us",
      details: "Bole Road, Addis Ababa",
      sub: "Ethiopia",
      link: "https://maps.google.com/?q=Addis+Ababa+Ethiopia",
    },
    {
      icon: Clock,
      title: "Business Hours",
      details: "Monday - Friday",
      sub: "9:00 AM - 5:00 PM",
      link: null,
    },
  ];

  const faqs = [
    {
      question: "How do I create an account?",
      answer: "Click the 'Register' button on the homepage, fill in your details, and verify your email address.",
    },
    {
      question: "How much does it cost to list products?",
      answer: "Basic listing is free for farmers. Premium features are available with our Pro plan at 499 ETB/month.",
    },
    {
      question: "How does the AI price prediction work?",
      answer: "Our AI analyzes historical market data, seasonal trends, and regional prices to provide accurate price forecasts.",
    },
    {
      question: "How do I contact support?",
      answer: "You can reach us via email at support@agrismart.com or call us during business hours.",
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h2>
          <p className="text-slate-500 mb-6">
            Thank you for reaching out. We'll get back to you within 24 hours.
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-black mb-4">Get in Touch</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <info.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{info.title}</h3>
                <p className="text-slate-600 font-medium">{info.details}</p>
                <p className="text-sm text-slate-400">{info.sub}</p>
                {info.link && (
                  <Link href={info.link} className="inline-block mt-3 text-green-600 text-sm font-medium hover:underline" target="_blank">
                    Contact →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form, FAQ, and Newsletter */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Send us a Message</h2>
              
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
                  <XCircle size={20} />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="What is this regarding?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* FAQ & Newsletter Section */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4 mb-8">
                {faqs.map((faq, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-4">
                    <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                    <p className="text-sm text-slate-600">{faq.answer}</p>
                  </div>
                ))}
              </div>

              {/* Newsletter Signup */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Bell size={20} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Newsletter Signup</h3>
                </div>
                <p className="text-slate-600 text-sm mb-4">
                  Subscribe to get latest updates, farming tips, and market insights directly to your inbox.
                </p>
                
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Your email address"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    disabled={newsletterStatus === "loading"}
                    className="px-6 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-70 whitespace-nowrap"
                  >
                    {newsletterStatus === "loading" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      "Subscribe"
                    )}
                  </button>
                </form>
                
                {newsletterMessage && (
                  <div className={`mt-3 text-sm flex items-center gap-2 ${
                    newsletterStatus === "success" ? "text-green-600" : "text-red-600"
                  }`}>
                    {newsletterStatus === "success" ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {newsletterMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Links Section - Using valid lucide-react icons */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Connect With Us</h2>
          <p className="text-slate-600 mb-8">Follow us on social media for updates, tips, and community news</p>
          <div className="flex flex-wrap justify-center gap-4">
            <SocialLink href={socialLinks.facebook} icon={<Globe size={20} />} label="Facebook" color="hover:bg-[#1877f2]" />
            <SocialLink href={socialLinks.twitter} icon={<Share2 size={20} />} label="Twitter" color="hover:bg-[#1da1f2]" />
            <SocialLink href={socialLinks.linkedin} icon={<Linkedin size={20} />} label="LinkedIn" color="hover:bg-[#0a66c2]" />
            <SocialLink href={socialLinks.instagram} icon={<Instagram size={20} />} label="Instagram" color="hover:bg-gradient-to-r from-[#833ab4] to-[#fd1d1d]" />
            <SocialLink href={socialLinks.youtube} icon={<Youtube size={20} />} label="YouTube" color="hover:bg-[#ff0000]" />
          </div>
        </div>
      </section>

      {/* Google Maps Section */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Find Us Here</h2>
          <div className="bg-slate-100 rounded-2xl overflow-hidden h-96 relative">
            {!mapError ? (
              <iframe
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}&q=Addis+Ababa+Ethiopia&center=9.030000,38.763175&zoom=13`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="AgriSmart Location"
                onError={() => setMapError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200">
                <div className="text-center p-8">
                  <MapPin size={48} className="text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">Unable to load map</p>
                  <p className="text-sm text-slate-500 mt-2">Addis Ababa, Ethiopia</p>
                  <a 
                    href="https://maps.google.com/?q=Addis+Ababa+Ethiopia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-green-600 hover:underline"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// Social Link Component
function SocialLink({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 ${color} transition-all hover:text-white hover:border-transparent shadow-sm`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </a>
  );
}