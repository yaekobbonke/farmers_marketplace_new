// app/PublicHomePage.tsx
"use client";

import Link from "next/link";
import { 
  ShoppingCart, 
  LayoutDashboard, 
  ArrowRight, 
  Sprout,
  Shield,
  TrendingUp,
  Users,
  Zap,
  CheckCircle,
  Star,
  BarChart3
} from "lucide-react";

export default function PublicHomePage() {
  const features = [
    {
      icon: TrendingUp,
      title: "AI Price Intelligence",
      description: "Real-time market predictions and price forecasts powered by advanced machine learning algorithms.",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      icon: Shield,
      title: "Secure Marketplace",
      description: "Verified farmers, quality checks, and secure payment processing for peace of mind.",
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      icon: Users,
      title: "Direct Connection",
      description: "Connect directly with farmers and buyers, eliminating middlemen for better prices.",
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      icon: Zap,
      title: "Fast Transactions",
      description: "Quick listing, instant updates, and streamlined order management system.",
      color: "text-yellow-600",
      bg: "bg-yellow-50"
    },
  ];

  const stats = [
    { value: "10K+", label: "Registered Farmers", icon: Users },
    { value: "50K+", label: "Happy Customers", icon: Star },
    { value: "100K+", label: "Products Sold", icon: ShoppingCart },
    { value: "95%", label: "Satisfaction Rate", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Sprout size={16} className="text-green-200" />
              <span className="text-sm font-medium text-white">Empowering Ethiopian Farmers Since 2024</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight">
              AI-Powered Agricultural
              <span className="block text-green-300">Marketplace</span>
            </h1>
            
            <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Connect directly with farmers, get real-time price predictions, and access the freshest produce - all powered by advanced AI technology.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
              >
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link 
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-400 transition-all"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 w-full">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative h-16 w-full">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
              className="fill-white"></path>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-black text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
              Why Choose AgriSmart AI?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We combine cutting-edge AI technology with a deep understanding of agricultural markets
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Simple steps to start your agricultural journey with us
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <Users size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Create Account</h3>
              <p className="text-slate-500">Sign up as a farmer or buyer in just a few minutes</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <BarChart3 size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Get AI Insights</h3>
              <p className="text-slate-500">Receive price predictions and market intelligence</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
                <span className="absolute -top-2 -right-2 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <ShoppingCart size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Start Trading</h3>
              <p className="text-slate-500">List products or purchase directly from farmers</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Ready to Transform Your Agricultural Business?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of farmers and buyers already using AgriSmart AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="px-8 py-4 bg-white text-green-700 rounded-xl font-bold hover:bg-gray-100 transition-all"
            >
              Create Free Account
            </Link>
            <Link 
              href="/contact"
              className="px-8 py-4 bg-green-500 text-white rounded-xl font-bold hover:bg-green-400 transition-all"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}