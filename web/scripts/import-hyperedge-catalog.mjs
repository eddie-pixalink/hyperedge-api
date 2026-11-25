import { readFileSync, writeFileSync } from 'node:fs'

const [, , sourcePath, cnyPerUsd] = process.argv
const exchangeRate = Number(cnyPerUsd)
if (!sourcePath || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
  throw new Error('Usage: bun scripts/import-hyperedge-catalog.mjs <pricing.json> <CNY per USD>')
}

const source = JSON.parse(readFileSync(sourcePath, 'utf8'))
if (!source.success || !source.data?.length || !source.group_ratio) {
  throw new Error('The source must contain published models and route multipliers.')
}

const markup = 1.3
const vendors = [
  ['OpenAI', 'OpenAI', /^(gpt-|text-embedding-)/],
  ['Anthropic', 'Claude.Color', /^claude-/],
  ['Google', 'Gemini.Color', /^gemini-/],
  ['DeepSeek', 'DeepSeek.Color', /^deepseek-/],
  ['Moonshot AI', 'Moonshot', /^kimi-/],
  ['Alibaba', 'Qwen.Color', /^qwen/],
  ['Z.AI', 'ZAI', /^glm-/],
  ['ByteDance', 'Doubao.Color', /^doubao-/],
  ['StepFun', 'Stepfun.Color', /^step-/],
]

const pricedVariables = /(?<![\w"])\b(?:p|c|cr|cc|cc1h|cc12h|img|img_cr|img_o|ai|ao|acr)\s*\*\s*|u\("tokens"\)\s*\*\s*|fixed\(\s*/
const amountAfterVariable = new RegExp(
  `(${pricedVariables.source})([0-9]+(?:\\.[0-9]+)?)`,
  'g'
)

function retailExpression(row, factor) {
  let replacements = 0
  const expression = row.billing_expr.replace(amountAfterVariable, (_, prefix, amount) => {
    replacements++
    return prefix + Number((Number(amount) * factor).toPrecision(15))
  })
  if (replacements < [...row.billing_expr.matchAll(/\btier\(/g)].length) {
    throw new Error(`Unrecognized billing expression for ${row.model_name}`)
  }

  return expression.replaceAll('32K以内', 'Under 32K').replaceAll('32K至200K', '32K–200K')
}

const knownModalities = new Set(['text', 'image', 'audio', 'video', 'file'])
function modalities(values) {
  return [...new Set((values ?? []).map((value) => value === 'pdf' ? 'file' : value))]
    .filter((value) => knownModalities.has(value))
}

const seen = new Set()
const models = [...source.data].sort((left, right) =>
  left.model_name.localeCompare(right.model_name, 'en')
).map((row, index) => {
  if (!/^[a-z0-9][a-z0-9._-]+$/.test(row.model_name) || seen.has(row.model_name)) {
    throw new Error(`Invalid or duplicate model ID: ${row.model_name}`)
  }
  seen.add(row.model_name)
  const vendorIndex = vendors.findIndex(([, , pattern]) => pattern.test(row.model_name))
  if (vendorIndex === -1) throw new Error(`Add a model family for ${row.model_name}`)

  const ratios = row.enable_groups
    .filter((group) => group !== 'auto' && Object.hasOwn(source.usable_group, group))
    .map((group) => source.group_ratio[group])
  const groupRatio = Math.min(...ratios)
  if (!Number.isFinite(groupRatio) || groupRatio < 0) {
    throw new Error(`No valid published route for ${row.model_name}`)
  }

  // The storefront publishes the coefficients multiplied by the route ratio
  // as CNY. Normalize that amount to USD, then apply the retail markup once.
  const factor = (groupRatio / exchangeRate) * markup
  const inputModalities = modalities(row.input_modalities)
  const outputModalities = modalities(row.output_modalities)
  const model = {
    id: index + 1,
    model_name: row.model_name,
    vendor_id: vendorIndex + 1,
    quota_type: row.quota_type,
    model_ratio: row.model_ratio * factor,
    completion_ratio: row.completion_ratio,
    enable_groups: [],
    supported_endpoint_types: row.supported_endpoint_types ?? [],
    ...(inputModalities.length ? { input_modalities: inputModalities } : {}),
    ...(outputModalities.length ? { output_modalities: outputModalities } : {}),
    ...(row.context_length ? { context_length: row.context_length } : {}),
    ...(row.max_output_tokens ? { max_output_tokens: row.max_output_tokens } : {}),
  }
  if (row.quota_type === 1) model.model_price = row.model_price * factor
  for (const key of [
    'cache_ratio', 'create_cache_ratio', 'image_ratio', 'audio_ratio',
    'audio_completion_ratio',
  ]) {
    if (row[key] != null) model[key] = row[key]
  }
  if (row.billing_expr) {
    model.billing_mode = 'tiered_expr'
    model.billing_expr = retailExpression(row, factor)
    if (row.billing_usage_schema) model.billing_usage_schema = row.billing_usage_schema
  } else if (row.create_cache_ratio_1h != null) {
    const input = model.model_ratio * 2
    model.billing_mode = 'tiered_expr'
    model.billing_expr = `tier("standard", p * ${input} + c * ${input * row.completion_ratio} + cr * ${input * row.cache_ratio} + cc * ${input * row.create_cache_ratio} + cc1h * ${input * row.create_cache_ratio_1h})`
  }
  return model
})

const catalog = {
  vendors: vendors.map(([name, icon], index) => ({ id: index + 1, name, icon })),
  models,
}
const destination = new URL('../src/features/pricing/lib/hyperedge-retail-data.json', import.meta.url)
writeFileSync(destination, JSON.stringify(catalog, null, 2) + '\n', 'utf8')
console.log(`Prepared ${models.length} USD model quotes`)
