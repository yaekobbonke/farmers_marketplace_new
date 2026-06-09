// "use client";

// import { useState } from "react";
// import { TrendingUp, Loader2 } from "lucide-react";

// export default function PricePredictor() {
//   const [commodity, setCommodity] = useState("");
//   const [prediction, setPrediction] = useState<any>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");

//   const handlePredict = async () => {
//     if (!commodity) return;
    
//     setLoading(true);
//     setError("");
    
//     try {
//       const response = await fetch("/api/assistant/forecast", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           admin1: "ADDIS ABABA",
//           market_id: 14,
//           commodity_id: 1,
//           category: "CEREALS",
//           commodity: commodity.toUpperCase(),
//           latitude: 9.02,
//           longitude: 38.75,
//           rfq: 0,
//           r3q: 0,
//           include_trend: true
//         }),
//       });
      
//       const data = await response.json();
//       if (data.success === false) {
//         setError(data.message);
//       } else {
//         setPrediction(data.prediction);
//       }
//     } catch (err) {
//       setError("Failed to get prediction");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="bg-white rounded-2xl p-6 shadow-sm">
//       <h3 className="text-xl font-bold mb-4">Price Predictor</h3>
      
//       <div className="flex gap-2 mb-4">
//         <input
//           type="text"
//           value={commodity}
//           onChange={(e) => setCommodity(e.target.value)}
//           placeholder="Enter commodity (e.g., Teff, Maize)"
//           className="flex-1 px-4 py-2 border rounded-xl"
//         />
//         <button
//           onClick={handlePredict}
//           disabled={loading}
//           className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
//         >
//           {loading ? <Loader2 className="animate-spin" /> : "Predict"}
//         </button>
//       </div>
      
//       {error && <p className="text-red-500 text-sm">{error}</p>}
      
//       {prediction && (
//         <div className="mt-4 p-4 bg-gray-50 rounded-xl">
//           <p className="font-bold">Predicted Price: {prediction.predicted_price_etb} ETB</p>
//           <p className="text-sm text-gray-600">Range: {prediction.price_range?.low} - {prediction.price_range?.high} ETB</p>
//           <p className="text-sm">Trend: {prediction.trend}</p>
//           <p className="text-sm">Confidence: {prediction.confidence}%</p>
//         </div>
//       )}
//     </div>
//   );
// }