import type { PricingModel, PricingVendor } from '../types'
import catalog from './hyperedge-retail-data.json'

const vendors: PricingVendor[] = catalog.vendors
const vendorById = new Map(vendors.map((vendor) => [vendor.id, vendor]))

const models = (catalog.models as PricingModel[]).map((model) => {
  const vendor = vendorById.get(model.vendor_id ?? 0)
  return {
    ...model,
    key: model.model_name,
    vendor_name: vendor?.name,
    vendor_icon: vendor?.icon,
  }
})

// Public quotes are independent of the configured channels and account billing.
export const retailCatalog = {
  models,
  vendors,
  groupRatio: {},
  usableGroup: {},
  endpointMap: {},
  autoGroups: [],
  priceRate: 1,
  usdExchangeRate: 1,
}
