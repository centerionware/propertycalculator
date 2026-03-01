import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Home, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  ChevronRight,
  History,
  Calculator,
  ArrowUpRight,
  Info,
  Briefcase,
  PieChart,
  AlertTriangle,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Property, FinancialBreakdown, InvestmentType } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const INFLATION_RATE = 0.03;
const MAINTENANCE_RESERVE_PERCENT = 0.01; // 1% of property value annually

const LABEL_MAP: Record<InvestmentType, Record<string, string>> = {
  [InvestmentType.REAL_ESTATE]: {
    type: 'Real Estate',
    address: 'Property Address',
    askingPrice: 'Asking Price',
    monthlyRent: 'Monthly Rent',
    initialRepairs: 'Initial Repairs',
    lotRent: 'Lot Rent',
    hoaFee: 'HOA Fee',
    propertyTax: 'Property Tax',
    isManaged: 'Managed by Company',
    mortgage: 'Mortgage',
    loanAmount: 'Mortgage Amount',
    loanTerm: 'Mortgage Term',
    loanPayment: 'Monthly Payment',
    utilities: 'Utilities',
    amenities: 'Amenities',
    recoup: 'Recoupment Timeline',
    revenue: 'Monthly Rent (Year 1)',
    setup: 'Initial Repairs',
    overhead: 'Operating Expenses',
    tax: 'Property Tax',
  },
  [InvestmentType.BUSINESS]: {
    type: 'Business/Equipment',
    address: 'Business Name/Location',
    askingPrice: 'Purchase Price',
    monthlyRent: 'Monthly Revenue',
    initialRepairs: 'Setup Costs',
    lotRent: 'Space Lease',
    hoaFee: 'Association Fee',
    propertyTax: 'Business Tax',
    isManaged: 'Outsourced Management',
    mortgage: 'Business Loan',
    loanAmount: 'Loan Amount',
    loanTerm: 'Loan Term',
    loanPayment: 'Monthly Payment',
    utilities: 'Operating Costs',
    amenities: 'Equipment/Features',
    recoup: 'ROI Timeline',
    revenue: 'Monthly Revenue (Year 1)',
    setup: 'Setup Costs',
    overhead: 'Overhead Costs',
    tax: 'Business Tax',
  },
  [InvestmentType.VEHICLE]: {
    type: 'Vehicle/Route',
    address: 'Vehicle/Route Name',
    askingPrice: 'Purchase Price',
    monthlyRent: 'Monthly Earnings',
    initialRepairs: 'Initial Maintenance',
    lotRent: 'Parking/Storage',
    hoaFee: 'Permit Fees',
    propertyTax: 'Vehicle Tax',
    isManaged: 'Fleet Management',
    mortgage: 'Vehicle Loan',
    loanAmount: 'Loan Amount',
    loanTerm: 'Loan Term',
    loanPayment: 'Monthly Payment',
    utilities: 'Fuel & Maintenance',
    amenities: 'Upgrades/Specs',
    recoup: 'Payback Period',
    revenue: 'Monthly Earnings (Year 1)',
    setup: 'Initial Maintenance',
    overhead: 'Operating Costs',
    tax: 'Vehicle Tax',
  },
  [InvestmentType.EQUIPMENT]: {
    type: 'Specialized Equipment',
    address: 'Equipment Name',
    askingPrice: 'Unit Cost',
    monthlyRent: 'Monthly Income',
    initialRepairs: 'Installation Costs',
    lotRent: 'Storage Cost',
    hoaFee: 'Insurance',
    propertyTax: 'Usage Tax',
    isManaged: 'Service Contract',
    mortgage: 'Equipment Lease/Loan',
    loanAmount: 'Amount Financed',
    loanTerm: 'Lease Term',
    loanPayment: 'Monthly Payment',
    utilities: 'Power & Consumables',
    amenities: 'Features/Options',
    recoup: 'Break-even Timeline',
    revenue: 'Monthly Income (Year 1)',
    setup: 'Installation Costs',
    overhead: 'Running Costs',
    tax: 'Usage Tax',
  }
};

const getLabel = (type: InvestmentType | undefined, key: string) => {
  const t = type || InvestmentType.REAL_ESTATE;
  return LABEL_MAP[t][key] || LABEL_MAP[InvestmentType.REAL_ESTATE][key] || key;
};

export default function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [activeRentOverride, setActiveRentOverride] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'properties' | 'portfolio'>('properties');
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('propcalc_disclaimer_accepted');
    if (!accepted) {
      setShowDisclaimer(true);
    }
  }, []);

  const acceptDisclaimer = () => {
    localStorage.setItem('propcalc_disclaimer_accepted', 'true');
    setShowDisclaimer(false);
  };

  // Form State
  const [address, setAddress] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [initialRepairs, setInitialRepairs] = useState('');
  const [lotRent, setLotRent] = useState('');
  const [hoaFee, setHoaFee] = useState('');
  const [propertyTax, setPropertyTax] = useState('');
  const [taxGrowthRate, setTaxGrowthRate] = useState('2'); // Default 2%
  const [federalTaxRate, setFederalTaxRate] = useState('22'); // Default 22%
  const [stateTaxRate, setStateTaxRate] = useState('5'); // Default 5%
  const [is55Plus, setIs55Plus] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedUtilities, setSelectedUtilities] = useState<string[]>([]);
  const [monthlyUtilityCost, setMonthlyUtilityCost] = useState('');
  const [isManaged, setIsManaged] = useState(false);
  const [managementRate, setManagementRate] = useState('10'); // Default 10%
  const [isMortgaged, setIsMortgaged] = useState(false);
  const [mortgageAmount, setMortgageAmount] = useState('');
  const [mortgageTerm, setMortgageTerm] = useState('30'); // Default 30 years
  const [mortgageMonthlyPayment, setMortgageMonthlyPayment] = useState('');
  const [investmentType, setInvestmentType] = useState<InvestmentType>(InvestmentType.REAL_ESTATE);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  const selectedProperty = useMemo(() => 
    properties.find(p => p.id === selectedPropertyId), 
    [properties, selectedPropertyId]
  );

  const AMENITIES_OPTIONS = ['Pool', 'Gym', 'Clubhouse', 'Gated', 'Tennis Courts', 'Playground', 'Dog Park', 'Laundry Facility'];
  const UTILITIES_OPTIONS = ['Water', 'Sewer', 'Trash', 'Electricity', 'Gas', 'Internet', 'Cable'];

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('investment_properties');
    if (saved) {
      try {
        setProperties(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse properties', e);
      }
    }
  }, []);

  // Reset override when property changes
  useEffect(() => {
    if (selectedProperty) {
      setActiveRentOverride(selectedProperty.activeRentOverride || null);
    } else {
      setActiveRentOverride(null);
    }
  }, [selectedPropertyId, selectedProperty]);

  // Update property's activeRentOverride when it changes in state
  useEffect(() => {
    if (selectedPropertyId && activeRentOverride !== undefined) {
      setProperties(prev => prev.map(p => 
        p.id === selectedPropertyId 
          ? { ...p, activeRentOverride: activeRentOverride || undefined } 
          : p
      ));
    }
  }, [activeRentOverride, selectedPropertyId]);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('investment_properties', JSON.stringify(properties));
  }, [properties]);

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    const propertyData = {
      type: investmentType,
      address,
      askingPrice: Number(askingPrice),
      monthlyRent: Number(monthlyRent),
      initialRepairs: Number(initialRepairs) || 0,
      lotRent: Number(lotRent) || 0,
      hoaFee: Number(hoaFee) || 0,
      propertyTax: Number(propertyTax) || 0,
      taxGrowthRate: Number(taxGrowthRate) / 100 || 0.02,
      federalTaxRate: Number(federalTaxRate) / 100 || 0,
      stateTaxRate: Number(stateTaxRate) / 100 || 0,
      is55Plus,
      isManaged,
      managementRate: Number(managementRate) / 100 || 0,
      amenities: selectedAmenities,
      utilities: selectedUtilities,
      monthlyUtilityCost: Number(monthlyUtilityCost) || 0,
      mortgageAmount: isMortgaged ? Number(mortgageAmount) : undefined,
      mortgageTerm: isMortgaged ? Number(mortgageTerm) : undefined,
      mortgageMonthlyPayment: isMortgaged ? Number(mortgageMonthlyPayment) : undefined,
    };

    if (editingPropertyId) {
      setProperties(properties.map(p => 
        p.id === editingPropertyId 
          ? { ...p, ...propertyData } 
          : p
      ));
    } else {
      const newProperty: Property = {
        id: crypto.randomUUID(),
        ...propertyData,
        createdAt: Date.now(),
      };
      setProperties([newProperty, ...properties]);
      setSelectedPropertyId(newProperty.id);
    }
    
    setIsAdding(false);
    setEditingPropertyId(null);
    resetForm();
  };

  const handleEditProperty = (prop: Property) => {
    setEditingPropertyId(prop.id);
    setInvestmentType(prop.type || InvestmentType.REAL_ESTATE);
    setAddress(prop.address);
    setAskingPrice(prop.askingPrice.toString());
    setMonthlyRent(prop.monthlyRent.toString());
    setInitialRepairs(prop.initialRepairs.toString());
    setLotRent(prop.lotRent.toString());
    setHoaFee(prop.hoaFee.toString());
    setPropertyTax(prop.propertyTax.toString());
    setTaxGrowthRate((prop.taxGrowthRate * 100).toString());
    setFederalTaxRate((prop.federalTaxRate * 100).toString());
    setStateTaxRate((prop.stateTaxRate * 100).toString());
    setIs55Plus(prop.is55Plus);
    setSelectedAmenities(prop.amenities);
    setSelectedUtilities(prop.utilities);
    setMonthlyUtilityCost(prop.monthlyUtilityCost.toString());
    setIsManaged(prop.isManaged);
    setManagementRate((prop.managementRate * 100).toString());
    setIsMortgaged(!!prop.mortgageAmount);
    setMortgageAmount(prop.mortgageAmount?.toString() || '');
    setMortgageTerm(prop.mortgageTerm?.toString() || '30');
    setMortgageMonthlyPayment(prop.mortgageMonthlyPayment?.toString() || '');
    setIsAdding(true);
  };

  const resetForm = () => {
    setAddress('');
    setAskingPrice('');
    setMonthlyRent('');
    setInitialRepairs('');
    setLotRent('');
    setHoaFee('');
    setPropertyTax('');
    setTaxGrowthRate('2');
    setFederalTaxRate('22');
    setStateTaxRate('5');
    setIs55Plus(false);
    setSelectedAmenities([]);
    setSelectedUtilities([]);
    setMonthlyUtilityCost('');
    setIsManaged(false);
    setManagementRate('10');
    setIsMortgaged(false);
    setMortgageAmount('');
    setMortgageTerm('30');
    setMortgageMonthlyPayment('');
    setInvestmentType(InvestmentType.REAL_ESTATE);
    setEditingPropertyId(null);
  };

  const deleteProperty = (id: string) => {
    const property = properties.find(p => p.id === id);
    if (!property) return;
    setPropertyToDelete(property);
  };

  const handleDeleteConfirm = () => {
    if (propertyToDelete) {
      setProperties(properties.filter(p => p.id !== propertyToDelete.id));
      if (selectedPropertyId === propertyToDelete.id) setSelectedPropertyId(null);
      setPropertyToDelete(null);
    }
  };

  const suggestedRents = useMemo(() => {
    if (!selectedProperty) return [];
    const price = selectedProperty.askingPrice;
    return [
      { label: '0.5%', value: Math.round(price * 0.005) },
      { label: '0.7%', value: Math.round(price * 0.007) },
      { label: '0.8%', value: Math.round(price * 0.008) },
      { label: '1.0%', value: Math.round(price * 0.01) },
    ];
  }, [selectedProperty]);

  const breakdown = useMemo((): FinancialBreakdown | null => {
    if (!selectedProperty) return null;

    const currentMonthlyRent = activeRentOverride || selectedProperty.monthlyRent;
    const mortgageAmount = selectedProperty.mortgageAmount || 0;
    const totalInitialInvestment = (selectedProperty.askingPrice - mortgageAmount) + selectedProperty.initialRepairs;
    const annualGrossIncome = currentMonthlyRent * 12;
    const annualManagementFee = selectedProperty.isManaged ? annualGrossIncome * selectedProperty.managementRate : 0;
    const annualOperatingExpenses = (selectedProperty.lotRent + selectedProperty.hoaFee + selectedProperty.monthlyUtilityCost) * 12;
    const annualPropertyTax = selectedProperty.propertyTax;
    const annualMortgagePayment = (selectedProperty.mortgageMonthlyPayment || 0) * 12;
    
    const annualPreTaxIncome = annualGrossIncome - annualOperatingExpenses - annualPropertyTax - annualManagementFee;
    const totalIncomeTaxRate = selectedProperty.federalTaxRate + selectedProperty.stateTaxRate;
    const annualIncomeTax = Math.max(0, annualPreTaxIncome * totalIncomeTaxRate);
    const annualPostTaxNetIncome = annualPreTaxIncome - annualIncomeTax - annualMortgagePayment;

    const maintenanceReserve = selectedProperty.askingPrice * MAINTENANCE_RESERVE_PERCENT;
    
    // Calculate years to recoup with growth
    let cumulativeIncome = 0;
    let years = 0;
    let currentAnnualRent = currentMonthlyRent * 12;
    let currentAnnualTax = annualPropertyTax;
    const mortgageTerm = selectedProperty.mortgageTerm || 0;

    // Simple simulation for 50 years max
    while (cumulativeIncome < totalInitialInvestment && years < 50) {
      const currentManagementFee = selectedProperty.isManaged ? currentAnnualRent * selectedProperty.managementRate : 0;
      const preTax = currentAnnualRent - annualOperatingExpenses - currentAnnualTax - currentManagementFee;
      const tax = Math.max(0, preTax * totalIncomeTaxRate);
      const currentAnnualMortgage = years < mortgageTerm ? annualMortgagePayment : 0;
      const net = preTax - tax - currentAnnualMortgage;
      
      cumulativeIncome += net;
      currentAnnualRent *= (1 + INFLATION_RATE);
      currentAnnualTax *= (1 + selectedProperty.taxGrowthRate);
      years++;
    }

    // Linear interpolation for more precision in years
    if (cumulativeIncome >= totalInitialInvestment && years > 0) {
      const lastYearPreTax = (currentAnnualRent / (1 + INFLATION_RATE)) - annualOperatingExpenses - (currentAnnualTax / (1 + selectedProperty.taxGrowthRate));
      const lastYearTax = Math.max(0, lastYearPreTax * totalIncomeTaxRate);
      const lastYearNet = lastYearPreTax - lastYearTax;
      
      const prevCumulative = cumulativeIncome - lastYearNet;
      const neededInLastYear = totalInitialInvestment - prevCumulative;
      years = (years - 1) + (neededInLastYear / lastYearNet);
    }

    return {
      totalInitialInvestment,
      annualGrossIncome,
      annualOperatingExpenses,
      annualManagementFee,
      annualPropertyTax,
      annualMortgagePayment,
      annualPreTaxIncome,
      annualIncomeTax,
      annualPostTaxNetIncome,
      maintenanceReserve,
      yearsToRecoup: years,
      monthlyNetCashFlow: (annualPostTaxNetIncome / 12),
      roi: (annualPostTaxNetIncome / totalInitialInvestment) * 100
    };
  }, [selectedProperty, activeRentOverride]);

  const recoupData = useMemo(() => {
    if (!selectedProperty || !breakdown) return [];
    
    const data = [];
    let cumulative = -breakdown.totalInitialInvestment;
    const currentMonthlyRent = activeRentOverride || selectedProperty.monthlyRent;
    let currentAnnualRent = currentMonthlyRent * 12;
    let currentAnnualTax = breakdown.annualPropertyTax;
    const totalIncomeTaxRate = selectedProperty.federalTaxRate + selectedProperty.stateTaxRate;

    data.push({ year: 0, balance: Math.round(cumulative) });

    for (let i = 1; i <= Math.ceil(breakdown.yearsToRecoup) + 5; i++) {
      const currentManagementFee = selectedProperty.isManaged ? currentAnnualRent * selectedProperty.managementRate : 0;
      const preTax = currentAnnualRent - breakdown.annualOperatingExpenses - currentAnnualTax - currentManagementFee;
      const tax = Math.max(0, preTax * totalIncomeTaxRate);
      const currentAnnualMortgage = i <= (selectedProperty.mortgageTerm || 0) ? breakdown.annualMortgagePayment : 0;
      const net = preTax - tax - currentAnnualMortgage;
      
      cumulative += net;
      data.push({ year: i, balance: Math.round(cumulative) });
      
      currentAnnualRent *= (1 + INFLATION_RATE);
      currentAnnualTax *= (1 + selectedProperty.taxGrowthRate);
    }
    return data;
  }, [selectedProperty, breakdown, activeRentOverride]);

  const portfolioStats = useMemo(() => {
    if (properties.length === 0) return null;

    return properties.reduce((acc, prop) => {
      const currentMonthlyRent = prop.activeRentOverride || prop.monthlyRent;
      const mortgageAmount = prop.mortgageAmount || 0;
      const totalInitialInvestment = (prop.askingPrice - mortgageAmount) + prop.initialRepairs;
      const annualGrossIncome = currentMonthlyRent * 12;
      const annualManagementFee = prop.isManaged ? annualGrossIncome * prop.managementRate : 0;
      const annualOperatingExpenses = (prop.lotRent + prop.hoaFee + prop.monthlyUtilityCost) * 12;
      const annualPropertyTax = prop.propertyTax;
      const annualMortgagePayment = (prop.mortgageMonthlyPayment || 0) * 12;
      
      const annualPreTaxIncome = annualGrossIncome - annualOperatingExpenses - annualPropertyTax - annualManagementFee;
      const totalIncomeTaxRate = prop.federalTaxRate + prop.stateTaxRate;
      const annualIncomeTax = Math.max(0, annualPreTaxIncome * totalIncomeTaxRate);
      const annualPostTaxNetIncome = annualPreTaxIncome - annualIncomeTax - annualMortgagePayment;

      return {
        totalInvestment: acc.totalInvestment + totalInitialInvestment,
        totalMonthlyGrossIncome: acc.totalMonthlyGrossIncome + currentMonthlyRent,
        totalMonthlyNetIncome: acc.totalMonthlyNetIncome + (annualPostTaxNetIncome / 12),
        totalAnnualNetIncome: acc.totalAnnualNetIncome + annualPostTaxNetIncome,
        propertyCount: acc.propertyCount + 1
      };
    }, {
      totalInvestment: 0,
      totalMonthlyGrossIncome: 0,
      totalMonthlyNetIncome: 0,
      totalAnnualNetIncome: 0,
      propertyCount: 0
    });
  }, [properties]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
              <Calculator className="w-8 h-8 text-emerald-600" />
              PropCalc
            </h1>
            <p className="text-zinc-500 mt-1">Investment Property Analyzer</p>
          </div>
          
          <div className="flex items-center gap-2 bg-zinc-200/50 p-1 rounded-xl self-start md:self-center">
            <button 
              onClick={() => setActiveTab('properties')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'properties' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Properties
            </button>
            <button 
              onClick={() => setActiveTab('portfolio')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'portfolio' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              )}
            >
              Full Portfolio
            </button>
          </div>

          <button 
            onClick={() => {
              setIsAdding(true);
              setActiveTab('properties');
            }}
            className="bg-zinc-900 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Property
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar: Property List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 font-medium text-sm uppercase tracking-wider px-2">
              <History className="w-4 h-4" />
              Your Investments
            </div>
            
            <div className="space-y-3">
              {properties.length === 0 && !isAdding && (
                <div className="p-8 text-center glass-card border-dashed">
                  <Home className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">No properties saved yet.</p>
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {properties.map((prop) => (
                  <motion.div
                    key={prop.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => {
                      setSelectedPropertyId(prop.id);
                      setActiveTab('properties');
                      setIsAdding(false);
                    }}
                    className={cn(
                      "p-4 glass-card cursor-pointer transition-all group relative",
                      selectedPropertyId === prop.id && activeTab === 'properties' ? "ring-2 ring-emerald-500 border-transparent" : "hover:border-zinc-300"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-900 truncate">{prop.address}</h3>
                        <p className="text-sm text-zinc-500">{formatCurrency(prop.askingPrice)}</p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProperty(prop.id);
                        }}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Main Content: Breakdown or Form */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {isAdding ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-card p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{editingPropertyId ? `Edit ${getLabel(investmentType, 'type')}` : `Add New ${getLabel(investmentType, 'type')}`}</h2>
                    <button onClick={() => {
                      setIsAdding(false);
                      setEditingPropertyId(null);
                      resetForm();
                    }} className="text-zinc-400 hover:text-zinc-600">Cancel</button>
                  </div>
                  
                  <form onSubmit={handleAddProperty} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">Investment Type</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.values(InvestmentType).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setInvestmentType(type)}
                            className={cn(
                              "px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                              investmentType === type
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100"
                                : "bg-white border-zinc-200 text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50"
                            )}
                          >
                            {LABEL_MAP[type].type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'address')}</label>
                      <input 
                        required
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        placeholder={investmentType === InvestmentType.REAL_ESTATE ? "123 Investment Way, City, State" : "e.g. Food Trailer #1"}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'askingPrice')} ($)</label>
                        <input 
                          required
                          type="number"
                          value={askingPrice}
                          onChange={e => setAskingPrice(e.target.value)}
                          placeholder="e.g. 250000"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'monthlyRent')} ($)</label>
                        <input 
                          required
                          type="number"
                          value={monthlyRent}
                          onChange={e => setMonthlyRent(e.target.value)}
                          placeholder="e.g. 1800"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'lotRent')} ($/mo) <span className="text-zinc-400 font-normal">(Optional)</span></label>
                        <input 
                          type="number"
                          value={lotRent}
                          onChange={e => setLotRent(e.target.value)}
                          placeholder="e.g. 450"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'hoaFee')} ($/mo) <span className="text-zinc-400 font-normal">(Optional)</span></label>
                        <input 
                          type="number"
                          value={hoaFee}
                          onChange={e => setHoaFee(e.target.value)}
                          placeholder="e.g. 150"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'initialRepairs')} ($) <span className="text-zinc-400 font-normal">(Optional)</span></label>
                      <input 
                        type="number"
                        value={initialRepairs}
                        onChange={e => setInitialRepairs(e.target.value)}
                        placeholder="e.g. 15000"
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'propertyTax')} ($)</label>
                        <input 
                          type="number"
                          value={propertyTax}
                          onChange={e => setPropertyTax(e.target.value)}
                          placeholder="e.g. 3200"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Tax Growth Rate (%/yr)</label>
                        <input 
                          type="number"
                          value={taxGrowthRate}
                          onChange={e => setTaxGrowthRate(e.target.value)}
                          placeholder="e.g. 2"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Federal Income Tax (%)</label>
                        <input 
                          type="number"
                          value={federalTaxRate}
                          onChange={e => setFederalTaxRate(e.target.value)}
                          placeholder="e.g. 22"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">State Income Tax (%)</label>
                        <input 
                          type="number"
                          value={stateTaxRate}
                          onChange={e => setStateTaxRate(e.target.value)}
                          placeholder="e.g. 5"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    {investmentType === InvestmentType.REAL_ESTATE && (
                      <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                        <input 
                          type="checkbox"
                          id="is55Plus"
                          checked={is55Plus}
                          onChange={e => setIs55Plus(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="is55Plus" className="text-sm font-medium text-zinc-700 cursor-pointer">
                          This is a 55+ Community property
                        </label>
                      </div>
                    )}

                    <div className="space-y-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id="isManaged"
                          checked={isManaged}
                          onChange={e => setIsManaged(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="isManaged" className="text-sm font-medium text-zinc-700 cursor-pointer">
                          {getLabel(investmentType, 'isManaged')}
                        </label>
                      </div>
                      
                      {isManaged && (
                        <div className="space-y-2 pl-8">
                          <label className="text-sm font-medium text-zinc-700">Management Rate (%)</label>
                          <input 
                            type="number"
                            value={managementRate}
                            onChange={e => setManagementRate(e.target.value)}
                            placeholder="e.g. 10"
                            className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                          />
                          <p className="text-[10px] text-zinc-500">Percentage of monthly gross rent</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id="isMortgaged"
                          checked={isMortgaged}
                          onChange={e => setIsMortgaged(e.target.checked)}
                          className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="isMortgaged" className="text-sm font-medium text-zinc-700 cursor-pointer">
                          This {investmentType === InvestmentType.REAL_ESTATE ? 'property' : 'investment'} has a {getLabel(investmentType, 'mortgage').toLowerCase()}
                        </label>
                      </div>
                      
                      {isMortgaged && (
                        <div className="space-y-4 pl-8">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'loanAmount')} ($)</label>
                            <input 
                              type="number"
                              value={mortgageAmount}
                              onChange={e => setMortgageAmount(e.target.value)}
                              placeholder="e.g. 200000"
                              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'loanTerm')} (Years)</label>
                              <input 
                                type="number"
                                value={mortgageTerm}
                                onChange={e => setMortgageTerm(e.target.value)}
                                placeholder="e.g. 30"
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'loanPayment')} ($)</label>
                              <input 
                                type="number"
                                value={mortgageMonthlyPayment}
                                onChange={e => setMortgageMonthlyPayment(e.target.value)}
                                placeholder="e.g. 1200"
                                className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'amenities')} Included</label>
                      <div className="flex flex-wrap gap-2">
                        {AMENITIES_OPTIONS.map(amenity => (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => setSelectedAmenities(prev => 
                              prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
                            )}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                              selectedAmenities.includes(amenity)
                                ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                                : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                            )}
                          >
                            {amenity}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-medium text-zinc-700">{getLabel(investmentType, 'utilities')} Included in {investmentType === InvestmentType.REAL_ESTATE ? 'Rent/Lot Rent' : 'Revenue'}</label>
                      <div className="flex flex-wrap gap-2">
                        {UTILITIES_OPTIONS.map(utility => (
                          <button
                            key={utility}
                            type="button"
                            onClick={() => setSelectedUtilities(prev => 
                              prev.includes(utility) ? prev.filter(u => u !== utility) : [...prev, utility]
                            )}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                              selectedUtilities.includes(utility)
                                ? "bg-blue-100 border-blue-200 text-blue-700"
                                : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
                            )}
                          >
                            {utility}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedUtilities.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <label className="text-sm font-medium text-zinc-700">Estimated Monthly Utility Cost ($)</label>
                        <input 
                          type="number"
                          value={monthlyUtilityCost}
                          onChange={e => setMonthlyUtilityCost(e.target.value)}
                          placeholder="e.g. 200"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                        <p className="text-xs text-zinc-400 italic">This will be subtracted from your net profit.</p>
                      </motion.div>
                    )}

                    <button 
                      type="submit"
                      className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                      {editingPropertyId ? 'Update Analysis' : 'Analyze Property'}
                    </button>
                  </form>
                </motion.div>
              ) : activeTab === 'portfolio' ? (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  {portfolioStats ? (
                    <>
                      {/* Portfolio Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 bg-emerald-50/50 border-emerald-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                              <TrendingUp className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-zinc-900">Portfolio Performance</h3>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <span className="text-sm text-zinc-500">Total ROI</span>
                              <span className="text-2xl font-bold text-emerald-600">
                                {((portfolioStats.totalAnnualNetIncome / portfolioStats.totalInvestment) * 100).toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-sm text-zinc-500">Monthly Net Income</span>
                              <span className="text-2xl font-bold text-emerald-600">{formatCurrency(portfolioStats.totalMonthlyNetIncome)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="glass-card p-6 bg-blue-50/50 border-blue-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                              <Briefcase className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-zinc-900">Portfolio Overview</h3>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <span className="text-sm text-zinc-500">Total Investment</span>
                              <span className="text-xl font-bold text-zinc-900">{formatCurrency(portfolioStats.totalInvestment)}</span>
                            </div>
                            <div className="flex justify-between items-end">
                              <span className="text-sm text-zinc-500">Investments</span>
                              <span className="text-xl font-bold text-zinc-900">{portfolioStats.propertyCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Property Breakdown Table */}
                      <div className="glass-card overflow-hidden">
                        <div className="p-6 border-b border-zinc-100">
                          <h3 className="font-bold text-zinc-900">Investment Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-zinc-50 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                              <tr>
                                <th className="px-6 py-4">Name/Location</th>
                                <th className="px-6 py-4">Investment</th>
                                <th className="px-6 py-4">Monthly Net</th>
                                <th className="px-6 py-4">ROI</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {properties.map(prop => {
                                const currentMonthlyRent = prop.activeRentOverride || prop.monthlyRent;
                                const mortgageAmount = prop.mortgageAmount || 0;
                                const totalInitialInvestment = (prop.askingPrice - mortgageAmount) + prop.initialRepairs;
                                const annualGrossIncome = currentMonthlyRent * 12;
                                const annualManagementFee = prop.isManaged ? annualGrossIncome * prop.managementRate : 0;
                                const annualOperatingExpenses = (prop.lotRent + prop.hoaFee + prop.monthlyUtilityCost) * 12;
                                const annualPropertyTax = prop.propertyTax;
                                const annualMortgagePayment = (prop.mortgageMonthlyPayment || 0) * 12;
                                const annualPreTaxIncome = annualGrossIncome - annualOperatingExpenses - annualPropertyTax - annualManagementFee;
                                const totalIncomeTaxRate = prop.federalTaxRate + prop.stateTaxRate;
                                const annualIncomeTax = Math.max(0, annualPreTaxIncome * totalIncomeTaxRate);
                                const annualPostTaxNetIncome = annualPreTaxIncome - annualIncomeTax - annualMortgagePayment;
                                const roi = (annualPostTaxNetIncome / totalInitialInvestment) * 100;

                                return (
                                  <tr key={prop.id} className="hover:bg-zinc-50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-zinc-900">{prop.address}</td>
                                    <td className="px-6 py-4 text-zinc-600">{formatCurrency(totalInitialInvestment)}</td>
                                    <td className="px-6 py-4 text-emerald-600 font-bold">{formatCurrency(annualPostTaxNetIncome / 12)}</td>
                                    <td className="px-6 py-4 text-emerald-600 font-bold">{roi.toFixed(1)}%</td>
                                    <td className="px-6 py-4 text-right">
                                      <button 
                                        onClick={() => deleteProperty(prop.id)}
                                        className="p-2 text-zinc-400 hover:text-red-500 transition-all"
                                        title="Remove from portfolio"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-12 text-center glass-card border-dashed">
                      <PieChart className="w-12 h-12 text-zinc-200 mx-auto mb-3" />
                      <p className="text-zinc-500">Add properties to your portfolio to see the combined analysis.</p>
                    </div>
                  )}
                </motion.div>
              ) : selectedProperty && breakdown ? (
                <motion.div
                  key="breakdown"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-card p-6 bg-emerald-50 border-emerald-100">
                      <div className="flex items-center gap-2 text-emerald-700 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Annual ROI</span>
                      </div>
                      <div className="text-3xl font-bold text-emerald-900">{breakdown.roi.toFixed(1)}%</div>
                      <p className="text-xs text-emerald-600 mt-1">Based on post-tax net income</p>
                    </div>

                    <div className="glass-card p-6 bg-blue-50 border-blue-100">
                      <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">{getLabel(selectedProperty.type, 'recoup')}</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-900">{breakdown.yearsToRecoup.toFixed(1)} <span className="text-lg font-medium">yrs</span></div>
                      <p className="text-xs text-blue-600 mt-1">Post-tax & growth adjusted</p>
                    </div>

                    <div className="glass-card p-6 bg-amber-50 border-amber-100">
                      <div className="flex items-center gap-2 text-amber-700 mb-2">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Safety Reserve</span>
                      </div>
                      <div className="text-3xl font-bold text-amber-900">{formatCurrency(breakdown.maintenanceReserve)}</div>
                      <p className="text-xs text-amber-600 mt-1">Target annual savings</p>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="glass-card p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ArrowUpRight className="w-6 h-6 text-zinc-400" />
                        Financial Breakdown
                      </h2>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => handleEditProperty(selectedProperty)}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          Edit Details
                        </button>
                        <button 
                          onClick={() => deleteProperty(selectedProperty.id)}
                          className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
                        >
                          Delete Property
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-500">{getLabel(selectedProperty.type, 'address')}</span>
                        <span className="font-medium text-zinc-900">{selectedProperty.address}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-500">{getLabel(selectedProperty.type, 'askingPrice')}</span>
                        <span className="font-medium text-zinc-900">{formatCurrency(selectedProperty.askingPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-500">{getLabel(selectedProperty.type, 'setup')}</span>
                        <span className="font-medium text-zinc-900">{formatCurrency(selectedProperty.initialRepairs)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-500 font-semibold text-zinc-900">Total Initial Investment</span>
                        <span className="font-bold text-zinc-900">{formatCurrency(breakdown.totalInitialInvestment)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <div className="flex flex-col">
                          <span className="text-zinc-500">{getLabel(selectedProperty.type, 'revenue')}</span>
                          {activeRentOverride && (
                            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Override Active</span>
                          )}
                        </div>
                        <span className="font-bold text-emerald-600 text-lg">
                          {formatCurrency(activeRentOverride || selectedProperty.monthlyRent)}
                        </span>
                      </div>

                      <div className="py-4 bg-zinc-50 rounded-xl px-4 border border-zinc-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{selectedProperty.type === InvestmentType.REAL_ESTATE ? 'Rent Scenarios' : 'Revenue Scenarios'}</span>
                          {activeRentOverride && (
                            <button 
                              onClick={() => setActiveRentOverride(null)}
                              className="text-[10px] text-emerald-600 font-bold uppercase hover:underline"
                            >
                              Reset to Original
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {suggestedRents.map((rent) => (
                            <button
                              key={rent.label}
                              onClick={() => setActiveRentOverride(rent.value)}
                              className={cn(
                                "flex flex-col items-center p-2 rounded-lg border transition-all",
                                activeRentOverride === rent.value
                                  ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-100"
                                  : "bg-white border-zinc-200 text-zinc-600 hover:border-emerald-200 hover:bg-emerald-50"
                              )}
                            >
                              <span className="text-[10px] font-bold uppercase opacity-70">{rent.label}</span>
                              <span className="text-sm font-bold">{formatCurrency(rent.value)}</span>
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <input 
                            type="range"
                            min={Math.round(selectedProperty.monthlyRent * 0.5)}
                            max={Math.round(selectedProperty.monthlyRent * 2)}
                            step={50}
                            value={activeRentOverride || selectedProperty.monthlyRent}
                            onChange={(e) => setActiveRentOverride(Number(e.target.value))}
                            className="flex-1 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                          />
                        </div>
                      </div>
                      {selectedProperty.mortgageAmount && selectedProperty.mortgageAmount > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                          <div className="flex flex-col">
                            <span className="text-zinc-500">Mortgage Payment</span>
                            <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                              {formatCurrency(selectedProperty.mortgageAmount)} / {selectedProperty.mortgageTerm} Years
                            </span>
                          </div>
                          <span className="font-medium text-red-500">-{formatCurrency(breakdown.annualMortgagePayment / 12)}</span>
                        </div>
                      )}
                      {selectedProperty.isManaged && (
                        <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                          <span className="text-zinc-500">Management Fee ({selectedProperty.managementRate * 100}%)</span>
                          <span className="font-medium text-red-500">-{formatCurrency(breakdown.annualManagementFee / 12)}</span>
                        </div>
                      )}
                      {selectedProperty.lotRent > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                          <span className="text-zinc-500">Lot Rent</span>
                          <span className="font-medium text-red-500">-{formatCurrency(selectedProperty.lotRent)}</span>
                        </div>
                      )}
                      {selectedProperty.hoaFee > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                          <span className="text-zinc-500">HOA Fee</span>
                          <span className="font-medium text-red-500">-{formatCurrency(selectedProperty.hoaFee)}</span>
                        </div>
                      )}
                      {selectedProperty.monthlyUtilityCost > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                          <span className="text-zinc-500">Utility Cost (Included)</span>
                          <span className="font-medium text-red-500">-{formatCurrency(selectedProperty.monthlyUtilityCost)}</span>
                        </div>
                      )}
                      {selectedProperty.propertyTax > 0 && (
                        <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                          <span className="text-zinc-500">Monthly Property Tax</span>
                          <span className="font-medium text-red-500">-{formatCurrency(selectedProperty.propertyTax / 12)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-500">Pre-Tax Monthly Cash Flow</span>
                        <span className="font-medium text-zinc-900">{formatCurrency(breakdown.annualPreTaxIncome / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-500">Estimated Income Tax ({(selectedProperty.federalTaxRate + selectedProperty.stateTaxRate) * 100}%)</span>
                        <span className="font-medium text-red-500">-{formatCurrency(breakdown.annualIncomeTax / 12)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-zinc-100">
                        <span className="text-zinc-500 font-semibold text-zinc-900">Post-Tax Net Monthly Cash Flow</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(breakdown.monthlyNetCashFlow)}</span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-zinc-500">Annual Post-Tax Net Income</span>
                        <span className="font-bold text-emerald-600">{formatCurrency(breakdown.annualPostTaxNetIncome)}</span>
                      </div>
                    </div>

                    {(selectedProperty.amenities.length > 0 || selectedProperty.utilities.length > 0 || selectedProperty.is55Plus) && (
                      <div className="mt-8 pt-8 border-t border-zinc-100">
                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Property Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedProperty.is55Plus && (
                            <span className="px-3 py-1 bg-zinc-900 text-white text-xs font-bold rounded-full">55+ Community</span>
                          )}
                          {selectedProperty.amenities.map(a => (
                            <span key={a} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-medium rounded-full">{a}</span>
                          ))}
                          {selectedProperty.utilities.map(u => (
                            <span key={u} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium rounded-full">
                              {u} {selectedProperty.monthlyUtilityCost > 0 && `($${selectedProperty.monthlyUtilityCost}/mo)`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-8 p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex gap-3">
                      <Info className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                      <p className="text-sm text-zinc-600 leading-relaxed">
                        The <strong>Safety Reserve</strong> of {formatCurrency(breakdown.maintenanceReserve)} is calculated as 1% of the property value annually. This fund is essential for covering unexpected repairs, tenant turnovers, and general upkeep.
                      </p>
                    </div>
                  </div>

                  {/* Recoup Chart */}
                  <div className="glass-card p-8">
                    <h2 className="text-xl font-bold mb-6">Recoupment Timeline</h2>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={recoupData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                          <XAxis 
                            dataKey="year" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 12 }}
                            label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#71717a', fontSize: 12 }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#71717a', fontSize: 12 }}
                            tickFormatter={(val) => `$${val/1000}k`}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [formatCurrency(value), 'Net Balance']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="balance" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorBalance)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-center text-xs text-zinc-400 mt-4">
                      Net balance includes initial cash investment (negative) and cumulative rental income minus expenses, taxes, and mortgage payments.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 glass-card border-dashed">
                  <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
                    <Calculator className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-900 mb-2">Select an investment to analyze</h2>
                  <p className="text-zinc-500 max-w-xs">
                    Choose an investment from your portfolio or add a new one to see the full financial breakdown.
                  </p>
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="mt-8 text-emerald-600 font-semibold flex items-center gap-2 hover:text-emerald-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add your first investment
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <footer className="mt-12 pb-8 text-center">
        <button 
          onClick={() => setShowDisclaimer(true)}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors underline underline-offset-4"
        >
          Legal Disclaimer & Terms of Use
        </button>
        <p className="text-[10px] text-zinc-300 mt-2">
          PropCalc • Vibe Coded with Precision
        </p>
      </footer>

      {/* Delete Confirmation Overlay */}
      <AnimatePresence>
        {propertyToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPropertyToDelete(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 text-center mb-2">Delete Property?</h3>
                <p className="text-zinc-500 text-center mb-8">
                  Are you sure you want to remove <span className="font-semibold text-zinc-900">"{propertyToDelete.address}"</span>? This action cannot be undone and all associated data will be lost.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleDeleteConfirm}
                    className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-100"
                  >
                    Yes, Delete Property
                  </button>
                  <button
                    onClick={() => setPropertyToDelete(null)}
                    className="w-full py-4 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Legal Disclaimer Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-8 mx-auto rotate-3">
                  <ShieldCheck className="w-10 h-10 text-emerald-600" />
                </div>
                
                <h2 className="text-3xl font-black text-zinc-900 text-center mb-6 tracking-tight">
                  Legal Disclaimer
                </h2>
                
                <div className="space-y-4 text-zinc-600 text-sm leading-relaxed max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                  <p className="font-bold text-zinc-900">
                    Please read this carefully before using PropCalc.
                  </p>
                  <p>
                    PropCalc is a "vibe-coded" tool designed for quick, rough financial estimates. It is provided for informational and entertainment purposes only and does not constitute professional financial, legal, or tax advice.
                  </p>
                  <p>
                    <span className="font-bold text-zinc-900">No Accuracy Guarantee:</span> The calculations provided are estimates based on user input and simplified financial models. Real-world results will vary significantly due to market conditions, unexpected expenses, tax law changes, and other variables.
                  </p>
                  <p>
                    <span className="font-bold text-zinc-900">No Warranty:</span> This tool is provided "as is" without any warranties of any kind, express or implied. We do not guarantee that the tool will be error-free, accurate, or available at all times.
                  </p>
                  <p>
                    <span className="font-bold text-zinc-900">Limitation of Liability:</span> By using this tool, you agree that the creators and providers of PropCalc shall not be liable for any direct, indirect, incidental, or consequential damages resulting from your use of or inability to use the tool, or from any investment decisions made based on its output.
                  </p>
                  <p>
                    Always consult with a qualified financial advisor, CPA, and legal professional before making any significant investment decisions.
                  </p>
                </div>

                <div className="mt-10">
                  <button
                    onClick={acceptDisclaimer}
                    className="w-full py-5 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-zinc-200 active:scale-[0.98]"
                  >
                    I Understand & Accept
                  </button>
                  <p className="text-center text-[10px] text-zinc-400 mt-4 uppercase tracking-widest font-bold">
                    By clicking, you agree to these terms
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
