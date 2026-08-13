import { Injectable } from '@nestjs/common';
import { ProductEntity } from '../entities/product.entity';
import { ProductDiscountType } from '../enums/product-discount-type.enum';

export interface ProductPriceCalculationResult {
  basePrice: number;
  effectivePrice: number;
  compareAtPrice?: number;
  costPrice?: number;
  isDiscountActive: boolean;
  discountType: ProductDiscountType;
  discountValue: number;
  savingsAmount: number;
  savingsPercent: number;
  taxRate: number;
  isTaxInclusive: boolean;
  taxAmount: number;
  totalWithTax: number;
  profit?: number;
  marginPercent?: number;
}

@Injectable()
export class ProductPricingCalculatorService {
  /**
   * Deterministic 2-decimal monetary rounding helper
   */
  private roundMoney(amount: number): number {
    return Math.round((Number(amount) + Number.EPSILON) * 100) / 100;
  }

  public calculate(product: ProductEntity, now = new Date()): ProductPriceCalculationResult {
    const basePrice = this.roundMoney(Number(product.basePrice || 0));
    const compareAtPrice = product.compareAtPrice !== undefined && product.compareAtPrice !== null
      ? this.roundMoney(Number(product.compareAtPrice))
      : undefined;
    const costPrice = product.costPrice !== undefined && product.costPrice !== null
      ? this.roundMoney(Number(product.costPrice))
      : undefined;

    const discountType = product.discountType || ProductDiscountType.NONE;
    const discountValue = this.roundMoney(Number(product.discountValue || 0));
    const taxRate = this.roundMoney(Number(product.taxRate || 0));
    const isTaxInclusive = Boolean(product.isTaxInclusive);

    // Evaluate discount schedule
    let isDiscountActive = false;
    if (discountType !== ProductDiscountType.NONE && discountValue > 0) {
      const startsAtValid = !product.discountStartsAt || new Date(product.discountStartsAt) <= now;
      const endsAtValid = !product.discountEndsAt || new Date(product.discountEndsAt) >= now;
      isDiscountActive = startsAtValid && endsAtValid;
    }

    let effectivePrice = basePrice;
    if (isDiscountActive) {
      if (discountType === ProductDiscountType.PERCENTAGE) {
        const discountAmount = (basePrice * discountValue) / 100;
        effectivePrice = Math.max(0, basePrice - discountAmount);
      } else if (discountType === ProductDiscountType.FIXED) {
        effectivePrice = Math.max(0, basePrice - discountValue);
      }
    }
    effectivePrice = this.roundMoney(effectivePrice);

    // Calculate savings relative to compareAtPrice or basePrice
    const referencePrice = compareAtPrice && compareAtPrice > effectivePrice ? compareAtPrice : basePrice;
    const savingsAmount = referencePrice > effectivePrice ? this.roundMoney(referencePrice - effectivePrice) : 0;
    const savingsPercent = referencePrice > 0 ? this.roundMoney((savingsAmount / referencePrice) * 100) : 0;

    // Calculate tax
    let taxAmount = 0;
    let totalWithTax = effectivePrice;

    if (taxRate > 0) {
      if (isTaxInclusive) {
        taxAmount = this.roundMoney(effectivePrice - effectivePrice / (1 + taxRate / 100));
        totalWithTax = effectivePrice;
      } else {
        taxAmount = this.roundMoney(effectivePrice * (taxRate / 100));
        totalWithTax = this.roundMoney(effectivePrice + taxAmount);
      }
    }

    // Calculate profit & margin
    let profit: number | undefined = undefined;
    let marginPercent: number | undefined = undefined;

    if (costPrice !== undefined) {
      profit = this.roundMoney(effectivePrice - costPrice);
      marginPercent = effectivePrice > 0 ? this.roundMoney((profit / effectivePrice) * 100) : 0;
    }

    return {
      basePrice,
      effectivePrice,
      compareAtPrice,
      costPrice,
      isDiscountActive,
      discountType,
      discountValue,
      savingsAmount,
      savingsPercent,
      taxRate,
      isTaxInclusive,
      taxAmount,
      totalWithTax,
      profit,
      marginPercent,
    };
  }
}
