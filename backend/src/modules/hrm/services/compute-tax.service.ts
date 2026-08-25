import { Injectable } from '@nestjs/common';
import { TaxSlabEntity } from '../entities/tax-slab.entity';

export interface TaxSlabBreakdown {
  minAmount: number;
  maxAmount: number | null;
  ratePercent: number;
  taxableInSlab: number;
  taxInSlab: number;
}

export interface TaxComputationResult {
  annualIncome: number;
  annualTax: number;
  monthlyTax: number;
  breakdown: TaxSlabBreakdown[];
}

/**
 * Pure progressive-slab calculator — it has no opinion on what the slabs or rates
 * should be. Bangladesh's tax year is July–June; getFiscalYear() encodes only that
 * structural fact, never a rate or threshold.
 */
@Injectable()
export class ComputeTaxService {
  getFiscalYear(month: number, year: number): string {
    const startYear = month >= 7 ? year : year - 1;
    return `${startYear}-${startYear + 1}`;
  }

  computeAnnualTax(slabs: TaxSlabEntity[], annualIncome: number): TaxComputationResult {
    let annualTax = 0;
    const breakdown: TaxSlabBreakdown[] = [];

    for (const slab of slabs) {
      const min = Number(slab.minAmount);
      const max = slab.maxAmount !== undefined && slab.maxAmount !== null ? Number(slab.maxAmount) : Infinity;
      const rate = Number(slab.ratePercent);

      const taxableInSlab = Math.max(0, Math.min(annualIncome, max) - min);
      const taxInSlab = taxableInSlab * (rate / 100);
      annualTax += taxInSlab;

      breakdown.push({
        minAmount: min,
        maxAmount: Number.isFinite(max) ? max : null,
        ratePercent: rate,
        taxableInSlab,
        taxInSlab,
      });
    }

    return {
      annualIncome,
      annualTax,
      monthlyTax: annualTax / 12,
      breakdown,
    };
  }
}
