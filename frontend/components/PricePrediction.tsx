"use client";

import { useState } from "react";
import { TrendingUp, Loader2, AlertCircle } from "lucide-react";

interface PredictionResult {
  commodity: string;
  region: string;
  predicted_price_etb: number;
  current_market_baseline: number | null;
  price_range: {
    low: number;
    high: number;
  };
  trend: string;
  confidence: number;
}

// Realistic base prices for each commodity (ETB per kg)
const COMMODITY_PRICES: Record<string, { rfq: number; r3q: number; commodity_id: number }> = {
  "TEFF": { rfq: 55, r3q: 52, commodity_id: 67 },
  "MAIZE (WHITE)": { rfq: 35, r3q: 33, commodity_id: 1 },
  "WHEAT": { rfq: 40, r3q: 38, commodity_id: 2 },
  "COFFEE": { rfq: 350, r3q: 340, commodity_id: 3 },
  "BARLEY": { rfq: 32, r3q: 30, commodity_id: 4 },
  "SORGHUM": { rfq: 28, r3q: 26, commodity_id: 5 },
};

export default function PricePrediction() {
  const [commodity, setCommodity] = useState("");
  const [region, setRegion] = useState("ADDIS ABABA");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  const regions = [
    "ADDIS ABABA",
    "OROMIA",
    "AMHARA",
    "TIGRAY",
    "SOUTH ETHIOPIA",
    "SIDAMA"
  ];

  const commodities = [
    "TEFF",
    "MAIZE (WHITE)",
    "WHEAT",
    "COFFEE",
    "BARLEY",
    "SORGHUM"
  ];

  const getPrediction = async () => {
    if (!commodity) {
      setError("Please select a commodity");
      return;
    }

    setLoading(true);
    setError("");
    setPrediction(null);

    try {
      const prices = COMMODITY_PRICES[commodity];
      
      const response = await fetch("/api/assistant/forecast/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin1: region,
          market_id: 14,
          commodity_id: prices.commodity_id,
          category: commodity === "COFFEE" ? "BEVERAGE" : "CEREALS",
          commodity: commodity,
          latitude: 9.02,
          longitude: 38.75,
          rfq: prices.rfq,      // ✅ Send realistic current price
          r3q: prices.r3q,      // ✅ Send realistic 3-month average
          include_trend: true
        }),
      });

      const data = await response.json();

      if (data.status === "error" || data.success === false) {
        setError(data.message || data.detail || "Prediction failed");
      } else {
        const predictionData = data.prediction || data;
        setPrediction(predictionData);
        
        // Add to history
        setHistory(prev => [{
          commodity,
          region,
          price: predictionData.predicted_price_etb,
          timestamp: new Date().toLocaleString()
        }, ...prev].slice(0, 5));
      }
    } catch (err) {
      console.error("Prediction error:", err);
      setError("Failed to connect to prediction service");
    } finally {
      setLoading(false);
    }
  };

  const getTrends = async () => {
    if (!commodity) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/assistant/forecast/trends/${commodity}?days=30`);
      const data = await response.json();
      console.log("Trends:", data);
      alert(`Trends data for ${commodity}:\n${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      console.error("Failed to get trends:", err);
      alert("Failed to fetch trends");
    } finally {
      setLoading(false);
    }
  };

  const getMarketSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/assistant/forecast/summary");
      const data = await response.json();
      console.log("Market Summary:", data);
      
      // Show summary in a readable format
      if (data.featured_commodities) {
        const summaryText = data.featured_commodities.map((c: any) => 
          `${c.name}: ${c.current_price} ETB/kg`
        ).join("\n");
        alert(`📊 Market Summary:\n\n${summaryText}`);
      }
    } catch (err) {
      console.error("Failed to get summary:", err);
      alert("Failed to fetch market summary");
    } finally {
      setLoading(false);
    }
  };

  const formatETB = (price: number) => {
    return new Intl.NumberFormat('en-ET', { 
      style: 'currency', 
      currency: 'ETB',
      maximumFractionDigits: 0 
    }).format(price);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="text-green-600" size={24} />
        <h2 className="text-2xl font-black text-slate-900">Price Predictor</h2>
      </div>

      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Commodity
          </label>
          <select
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select a commodity</option>
            {commodities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {commodity && (
            <p className="text-xs text-slate-400 mt-1">
              Current market price: {formatETB(COMMODITY_PRICES[commodity]?.rfq || 0)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Region
          </label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={getPrediction}
            disabled={loading || !commodity}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : "Get Prediction"}
          </button>
          
          <button
            onClick={getTrends}
            disabled={loading || !commodity}
            className="px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="View price trends"
          >
            📈 Trends
          </button>
          
          <button
            onClick={getMarketSummary}
            disabled={loading}
            className="px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Market summary"
          >
            📊 Summary
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-xl flex items-center gap-2 text-red-600">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Prediction Result */}
      {prediction && (
        <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
          <h3 className="font-bold text-slate-900 mb-3">Prediction Result</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Commodity:</span>
              <span className="font-semibold">{prediction.commodity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Region:</span>
              <span>{prediction.region}</span>
            </div>
            <div className="flex justify-between border-t border-green-100 pt-2 mt-2">
              <span className="text-slate-600">Current Market:</span>
              <span className="font-semibold">
                {prediction.current_market_baseline ? formatETB(prediction.current_market_baseline) : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Predicted Price (7 days):</span>
              <span className="text-2xl font-bold text-green-600">
                {formatETB(prediction.predicted_price_etb)}
              </span>
            </div>
            {prediction.price_range && (
              <div className="flex justify-between">
                <span className="text-slate-600">Expected Range:</span>
                <span className="text-sm">
                  {formatETB(prediction.price_range.low)} - {formatETB(prediction.price_range.high)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Trend:</span>
              <span className={`font-semibold ${
                prediction.trend === 'increasing' ? 'text-green-600' :
                prediction.trend === 'decreasing' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {prediction.trend === 'increasing' ? '📈 Rising' :
                 prediction.trend === 'decreasing' ? '📉 Falling' : '➡️ Stable'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Confidence:</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${prediction.confidence}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{prediction.confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Predictions History */}
      {history.length > 0 && (
        <div>
          <h4 className="font-semibold text-slate-900 mb-2">Recent Predictions</h4>
          <div className="space-y-2">
            {history.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{item.commodity}</span>
                  <span className="text-green-600 font-bold">{formatETB(item.price)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{item.region}</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}