"use client";

import { useState } from "react";
import { TrendingUp, Loader2, AlertCircle, TrendingDown, Minus } from "lucide-react";

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
      // Get the commodity prices first
      const prices = COMMODITY_PRICES[commodity];
      
      if (!prices) {
        throw new Error("Commodity not found");
      }
      
      const productId = prices.commodity_id;
      console.log("Fetching prediction for productId:", productId);
      
      // Use the correct API endpoint (without .js extension for App Router)
      const response = await fetch(`/api/assistants/forecast/predict?productId=${productId}`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json",
        }
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log("Prediction data:", data);

      if (data.success === false || data.error) {
        throw new Error(data.error || data.message || "Prediction failed");
      }
      
      // Handle FastAPI response structure
      const predictionData =
        data?.data?.prediction ||
        data?.prediction ||
        data;

      console.log("Parsed prediction:", predictionData);

      const result: PredictionResult = {
        commodity: predictionData.commodity || commodity,
        region: predictionData.region || region,
        predicted_price_etb: Number(
          predictionData.predicted_price_etb || predictionData.predictedPrice || 0
        ),
        current_market_baseline:
          predictionData.current_market_baseline ?? predictionData.currentPrice ?? prices.rfq,
        price_range: {
          low: Number(predictionData.price_range?.low ?? (predictionData.predicted_price_etb || 0) * 0.85),
          high: Number(predictionData.price_range?.high ?? (predictionData.predicted_price_etb || 0) * 1.15),
        },
        trend: predictionData.trend || "stable",
        confidence: Number(
          predictionData.confidence ?? 75
        ),
      };

      setPrediction(result);
      
      // Add to history
      setHistory(prev => [{
        commodity,
        region,
        price: result.predicted_price_etb,
        timestamp: new Date().toLocaleString()
      }, ...prev].slice(0, 5));
      
    } catch (err) {
      console.error("Prediction error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to prediction service");
      
      // Fallback to mock prediction
      const fallbackPrediction = getFallbackPrediction(commodity, region);
      setPrediction(fallbackPrediction);
      
      setHistory(prev => [{
        commodity,
        region,
        price: fallbackPrediction.predicted_price_etb,
        timestamp: new Date().toLocaleString() + " (estimated)"
      }, ...prev].slice(0, 5));
    } finally {
      loading && setLoading(false);
    }
  };

  // Fallback prediction when API fails
  const getFallbackPrediction = (commodity: string, region: string): PredictionResult => {
    const basePrice = COMMODITY_PRICES[commodity]?.rfq || 50;
    const trends = ["increasing", "decreasing", "stable"];
    const trend = trends[Math.floor(Math.random() * 3)] as "increasing" | "decreasing" | "stable";
    const changePercent = trend === "increasing" ? 1.1 : trend === "decreasing" ? 0.9 : 1.0;
    
    return {
      commodity,
      region,
      predicted_price_etb: Math.round(basePrice * changePercent),
      current_market_baseline: basePrice,
      price_range: {
        low: Math.round(basePrice * changePercent * 0.85),
        high: Math.round(basePrice * changePercent * 1.15)
      },
      trend,
      confidence: 75 + Math.floor(Math.random() * 20)
    };
  };

  const getTrends = async () => {
    if (!commodity) {
      setError("Please select a commodity first");
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/assistants/forecast/trends/${commodity}?days=30`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Trends:", data);
      
      const trendsData = data.data || data;
      alert(`📈 Price Trends for ${commodity}:\n\n${JSON.stringify(trendsData, null, 2)}`);
    } catch (err) {
      console.error("Failed to get trends:", err);
      alert(`Unable to fetch trends for ${commodity}. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };

  const getMarketSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/assistants/forecast/summary");
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Market Summary:", data);
      
      const summaryData = data.data || data;
      
      if (summaryData.featured_commodities || summaryData.commodities) {
        const commoditiesList = summaryData.featured_commodities || summaryData.commodities;
        const summaryText = commoditiesList.map((c: any) => 
          `${c.name || c.commodity}: ${c.current_price || c.price || 'N/A'} ETB/kg`
        ).join("\n");
        alert(`📊 Market Summary:\n\n${summaryText}\n\nLast updated: ${new Date().toLocaleString()}`);
      } else {
        alert("Market summary data is currently unavailable. Please try again later.");
      }
    } catch (err) {
      console.error("Failed to get summary:", err);
      alert("Unable to fetch market summary. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatETB = (price: number) => {
    if (!price || isNaN(price)) return "N/A";
    return new Intl.NumberFormat('en-ET', { 
      style: 'currency', 
      currency: 'ETB',
      maximumFractionDigits: 0 
    }).format(price);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing' || trend === 'Rising' || trend === 'up') {
      return <TrendingUp size={18} className="text-green-600" />;
    } else if (trend === 'decreasing' || trend === 'Falling' || trend === 'down') {
      return <TrendingDown size={18} className="text-red-600" />;
    } else {
      return <Minus size={18} className="text-yellow-600" />;
    }
  };

  const getTrendText = (trend: string) => {
    if (trend === 'increasing' || trend === 'Rising' || trend === 'up') {
      return '📈 Rising';
    } else if (trend === 'decreasing' || trend === 'Falling' || trend === 'down') {
      return '📉 Falling';
    } else {
      return '➡️ Stable';
    }
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'increasing' || trend === 'Rising' || trend === 'up') {
      return 'text-green-600';
    } else if (trend === 'decreasing' || trend === 'Falling' || trend === 'down') {
      return 'text-red-600';
    } else {
      return 'text-yellow-600';
    }
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
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Select a commodity</option>
            {commodities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {commodity && COMMODITY_PRICES[commodity] && (
            <p className="text-xs text-slate-400 mt-1">
              Current market price: {formatETB(COMMODITY_PRICES[commodity].rfq)}
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
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 bg-white"
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
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <TrendingUp size={18} />}
            {loading ? "Analyzing..." : "Get Prediction"}
          </button>
          
          <button
            onClick={getTrends}
            disabled={loading || !commodity}
            className="px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="View price trends"
          >
            📈
          </button>
          
          <button
            onClick={getMarketSummary}
            disabled={loading}
            className="px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            title="Market summary"
          >
            📊
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
          <h3 className="font-bold text-slate-900 mb-3">AI Prediction Result</h3>
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
                <span className="text-sm font-medium">
                  {formatETB(prediction.price_range.low)} - {formatETB(prediction.price_range.high)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Trend:</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(prediction.trend)}
                <span className={`font-semibold ${getTrendColor(prediction.trend)}`}>
                  {getTrendText(prediction.trend)}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">AI Confidence:</span>
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
