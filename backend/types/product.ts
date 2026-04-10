export interface MarketPrice {
  price: number;
  recordedAt: string;
}

export interface Prediction {
  predictedPrice: number;
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  location?: string;
  image?: string;
  category?: {
    name: string;
  };
  marketPrices?: MarketPrice[];
  predictions?: Prediction[];
}