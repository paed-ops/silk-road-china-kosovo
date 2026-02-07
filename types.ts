
export enum Incoterm {
  EXW = 'EXW',
  FOB = 'FOB',
  CIF = 'CIF',
  DDP = 'DDP',
  DAP = 'DAP'
}

export enum ContainerType {
  LCL = 'LCL (Less than Container Load)',
  GP20 = '20ft General Purpose',
  GP40 = '40ft General Purpose',
  HC40 = '40ft High Cube',
  REF20 = '20ft Reefer',
  OT20 = '20ft Open Top',
  FR20 = '20ft Flat Rack'
}

export enum ShippingMode {
  DIRECT = 'Direct Route (Mainland to Kosovo)',
  INTERMODAL = 'Intermodal (Factory > Port > Freight)'
}

export interface ShipmentData {
  shippingMode: ShippingMode;
  factoryLocation: string;
  productDescription: string;
  weight: number; 
  volume: number; 
  invoiceAmount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'CNY';
  incoterm: Incoterm;
  originPort: string;
  containerType: ContainerType;
}

export interface RouteLeg {
  label: string;
  location: string;
  durationDays: number;
  cost: number;
  type: 'Inland' | 'Freight' | 'Customs' | 'Delivery';
}

export interface RouteOption {
  method: string;
  route: string;
  estimatedDays: number;
  estimatedCost: number;
  ports: string[];
  legs: RouteLeg[];
}

export interface PaymentOption {
  currency: string;
  totalCost: number;
  isRecommended: boolean;
  exchangeRateRisk: string;
}

export interface NewsItem {
  headline: string;
  summary: string;
  shippingImpact: string;
  date: string;
}

export interface LogisticsResult {
  classification: {
    category: string;
    subCategory: string;
    hsCodeHint?: string;
  };
  flightOption: RouteOption;
  seaOption: RouteOption;
  incotermAnalysis: {
    description: string;
    totalEstimatedFees: number;
    breakdown: { label: string; amount: number }[];
  };
  containerRecommendation: {
    type: string;
    reason: string;
    utilizationPercent: number;
    natureOfGoodsAdvice: string;
  };
  currencyOptimization: {
    recommendation: string;
    paymentOptions: PaymentOption[];
    savingsPotential: string;
    analysis: string; // Win/Loss analysis
    reasoning: string; // Explicit "Why"
    baseValueUSD: number;
  };
  importSteps: { step: string; detail: string; estimatedCost: number }[];
  mandatoryCertificates: {
    certificate: string;
    description: string;
    level: 'Mandatory' | 'Recommended';
    authority: string;
  }[];
  forecasting: {
    trend: 'rising' | 'falling' | 'stable';
    explanation: string;
    bestTimeToShip: string;
  };
  historicalPriceData: { month: string; price: number }[];
  trackingData: {
    airTrackingId: string;
    seaTrackingId: string;
    liveLocalization: {
      latitude: number;
      longitude: number;
      status: string;
      lastUpdated: string;
    };
  };
}
