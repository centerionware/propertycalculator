export interface Property {
  id: string;
  address: string;
  askingPrice: number;
  monthlyRent: number;
  activeRentOverride?: number;
  initialRepairs: number;
  lotRent: number;
  hoaFee: number;
  propertyTax: number;
  taxGrowthRate: number;
  federalTaxRate: number;
  stateTaxRate: number;
  is55Plus: boolean;
  isManaged: boolean;
  managementRate: number;
  amenities: string[];
  utilities: string[];
  monthlyUtilityCost: number;
  mortgageAmount?: number;
  mortgageTerm?: number;
  mortgageMonthlyPayment?: number;
  createdAt: number;
}

export interface FinancialBreakdown {
  totalInitialInvestment: number;
  annualGrossIncome: number;
  annualOperatingExpenses: number;
  annualManagementFee: number;
  annualPropertyTax: number;
  annualMortgagePayment: number;
  annualPreTaxIncome: number;
  annualIncomeTax: number;
  annualPostTaxNetIncome: number;
  maintenanceReserve: number;
  yearsToRecoup: number;
  monthlyNetCashFlow: number;
  roi: number;
}
