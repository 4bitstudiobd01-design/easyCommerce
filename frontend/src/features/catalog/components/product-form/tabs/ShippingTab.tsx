'use client';

import React from 'react';
import { ProductFormState } from '@/features/catalog/hooks/useProductForm';
import { ProductFulfillmentConfig } from '@/features/catalog/components/ProductFulfillmentConfig';

interface ShippingTabProps {
  form: ProductFormState;
}

export function ShippingTab({ form }: ShippingTabProps) {
  const {
    productType,
    shippingRequired, setShippingRequired,
    weight, setWeight,
    weightUnit, setWeightUnit,
    length, setLength,
    width, setWidth,
    height, setHeight,
    dimensionUnit, setDimensionUnit,
    shippingProfileId, setShippingProfileId,
    isFragile, setIsFragile,
    digitalDeliveryType, setDigitalDeliveryType,
    digitalAssetUrl, setDigitalAssetUrl,
    downloadLimit, setDownloadLimit,
    downloadExpiryDays, setDownloadExpiryDays,
    serviceDeliveryType, setServiceDeliveryType,
    serviceDuration, setServiceDuration,
    serviceDurationUnit, setServiceDurationUnit,
  } = form;

  return (
    <ProductFulfillmentConfig
      productType={productType}
      shippingRequired={shippingRequired}
      onShippingRequiredChange={setShippingRequired}
      weight={weight}
      onWeightChange={setWeight}
      weightUnit={weightUnit}
      onWeightUnitChange={setWeightUnit}
      length={length}
      onLengthChange={setLength}
      width={width}
      onWidthChange={setWidth}
      height={height}
      onHeightChange={setHeight}
      dimensionUnit={dimensionUnit}
      onDimensionUnitChange={setDimensionUnit}
      shippingProfileId={shippingProfileId}
      onShippingProfileIdChange={setShippingProfileId}
      isFragile={isFragile}
      onIsFragileChange={setIsFragile}
      digitalDeliveryType={digitalDeliveryType}
      onDigitalDeliveryTypeChange={setDigitalDeliveryType}
      digitalAssetUrl={digitalAssetUrl}
      onDigitalAssetUrlChange={setDigitalAssetUrl}
      downloadLimit={downloadLimit}
      onDownloadLimitChange={setDownloadLimit}
      downloadExpiryDays={downloadExpiryDays}
      onDownloadExpiryDaysChange={setDownloadExpiryDays}
      serviceDeliveryType={serviceDeliveryType}
      onServiceDeliveryTypeChange={setServiceDeliveryType}
      serviceDuration={serviceDuration}
      onServiceDurationChange={setServiceDuration}
      serviceDurationUnit={serviceDurationUnit}
      onServiceDurationUnitChange={setServiceDurationUnit}
    />
  );
}
