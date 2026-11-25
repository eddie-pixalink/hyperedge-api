/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import {
  ArrowDown,
  ArrowRight,
  ChartNoAxesColumn,
  MessageSquare,
  KeyRound,
  MapPin,
  Network,
  RotateCw,
  ScanEye,
  Terminal,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { parseTiersFromExpr } from '@/features/pricing/lib/billing-expr'
import { retailCatalog } from '@/features/pricing/lib/hyperedge-retail-catalog'
import { toIntlLocale } from '@/i18n/languages'
import { getLobeIcon } from '@/lib/lobe-icon'

import {
  BulkPurchasing,
  BuyerIntegration,
  BuyerPlan,
  SpendControls,
  WorkloadExamples,
} from './hyperedge-buyer-sections'

import './hyperedge-landing.css'

const modelFamilies = [
  { label: 'OpenAI', icon: 'OpenAI' },
  { label: 'Claude', icon: 'Claude.Color' },
  { label: 'DeepSeek', icon: 'DeepSeek.Color' },
  { label: 'Qwen', icon: 'Qwen.Color' },
  { label: 'Google', icon: 'Google.Color' },
] as const

const retailRates = [
  {
    id: 'gpt-6.2-astra',
    model: 'GPT-6.2 Astra',
    officialInput: 8,
    officialOutput: 40,
  },
  {
    id: 'gpt-6.2-sol',
    model: 'GPT-6.2 Sol',
    officialInput: 2,
    officialOutput: 10,
  },
  {
    id: 'gpt-5.5',
    model: 'GPT-5.5',
    officialInput: 5,
    officialOutput: 30,
  },
].map((rate) => {
  const model = retailCatalog.models.find((item) => item.model_name === rate.id)
  const [standard] = parseTiersFromExpr(model?.billing_expr ?? '')
  if (
    typeof standard?.inputPrice !== 'number' ||
    typeof standard.outputPrice !== 'number'
  ) {
    throw new Error(`Missing standard retail quote for ${rate.id}`)
  }
  return { ...rate, input: standard.inputPrice, output: standard.outputPrice }
})

function RetailPricing() {
  const { t, i18n } = useTranslation()
  const [selectedModel, setSelectedModel] = useState<
    (typeof retailRates)[number]
  >(retailRates[0])
  const [input, setInput] = useState('100')
  const [output, setOutput] = useState('20')
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  // This rate card has a fixed USD quote currency and four-decimal prices.
  const usd = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
  const monthlyUsd = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  })
  const percent = new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
  })
  const inputMillions = Math.max(0, Number(input) || 0)
  const outputMillions = Math.max(0, Number(output) || 0)
  const estimated =
    inputMillions * selectedModel.input + outputMillions * selectedModel.output
  const official =
    inputMillions * selectedModel.officialInput +
    outputMillions * selectedModel.officialOutput
  const savings = official - estimated

  return (
    <>
      <WorkloadExamples
        onSelect={(usage) => {
          const rate = retailRates.find((item) => item.id === usage.model)
          if (rate) {
            setSelectedModel(rate)
            setInput(String(usage.input))
            setOutput(String(usage.output))
          }
        }}
      />
      <section id='rates' className='he-rates' aria-labelledby='he-rates-title'>
        <div className='he-container he-split'>
          <div>
            <h2 id='he-rates-title'>{t('hyperedge.home.ratesTitle')}</h2>
            <p className='he-description'>{t('hyperedge.home.ratesIntro')}</p>
            <Table
              aria-label={t('hyperedge.home.rateTable')}
              aria-describedby='he-upstream-note'
              className='he-rate-table'
            >
              <TableHeader>
                <TableRow>
                  <TableHead scope='col'>{t('Model')}</TableHead>
                  <TableHead scope='col'>
                    {t('hyperedge.home.hyperedgeQuote')}
                  </TableHead>
                  <TableHead scope='col'>
                    {t('hyperedge.home.openaiStandard')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {retailRates.map((rate) => (
                  <TableRow key={rate.model}>
                    <th scope='row'>
                      <strong>{rate.model}</strong>
                    </th>
                    <TableCell>
                      <div className='he-price-pair'>
                        <span>{t('Input')}</span>
                        <strong>{usd.format(rate.input)}</strong>
                        <span>{t('Output')}</span>
                        <strong>{usd.format(rate.output)}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='he-price-pair'>
                        <span>{t('Input')}</span>
                        <strong>{monthlyUsd.format(rate.officialInput)}</strong>
                        <span>{t('Output')}</span>
                        <strong>
                          {monthlyUsd.format(rate.officialOutput)}
                        </strong>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className='he-rate-note'>{t('hyperedge.home.rateNote')}</p>
            <p id='he-upstream-note' className='he-rate-note'>
              <strong>{t('hyperedge.home.upstreamTitle')}</strong>{' '}
              {t('hyperedge.home.upstreamNote')}
            </p>
            <p className='he-rate-sources'>
              <a
                href='https://developers.openai.com/api/docs/pricing?context-length=short'
                target='_blank'
                rel='noreferrer'
              >
                {t('hyperedge.home.officialSource')}
              </a>
              <span aria-hidden='true'>·</span>
              <a
                href='https://developers.openai.com/api/docs/models/gpt-5.5'
                target='_blank'
                rel='noreferrer'
              >
                {t('hyperedge.home.officialGpt55')}
              </a>
            </p>
          </div>

          <div className='he-estimator' id='he-estimator' tabIndex={-1}>
            <h3>{t('hyperedge.home.estimator')}</h3>
            <fieldset>
              <legend className='sr-only'>{t('Model')}</legend>
              <div className='he-model-picker'>
                {retailRates.map((rate) => (
                  <label key={rate.model}>
                    <Input
                      className='sr-only'
                      type='radio'
                      name='estimate-model'
                      value={rate.model}
                      checked={selectedModel.model === rate.model}
                      onChange={() => setSelectedModel(rate)}
                    />
                    <span>{rate.model}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className='he-estimator-inputs'>
              <label htmlFor='he-monthly-input'>
                <span>{t('hyperedge.home.monthlyInput')}</span>
                <Input
                  id='he-monthly-input'
                  type='number'
                  min='0'
                  step='any'
                  value={input}
                  onChange={(event) => setInput(event.currentTarget.value)}
                />
              </label>
              <label htmlFor='he-monthly-output'>
                <span>{t('hyperedge.home.monthlyOutput')}</span>
                <Input
                  id='he-monthly-output'
                  type='number'
                  min='0'
                  step='any'
                  value={output}
                  onChange={(event) => setOutput(event.currentTarget.value)}
                />
              </label>
            </div>
            <div className='he-estimator-total'>
              <span id='he-estimate-label'>
                {t('hyperedge.home.monthlyEstimate')}
              </span>
              <output
                aria-labelledby='he-estimate-label'
                htmlFor='he-monthly-input he-monthly-output'
              >
                {monthlyUsd.format(estimated)}
              </output>
            </div>
            <div className='he-estimator-benchmark'>
              <span id='he-official-label'>
                {t('hyperedge.home.monthlyOfficial')}
              </span>
              <output
                aria-labelledby='he-official-label'
                htmlFor='he-monthly-input he-monthly-output'
              >
                {monthlyUsd.format(official)}
              </output>
            </div>
            <div className='he-estimator-savings'>
              <div>
                <span id='he-savings-label'>
                  {t('hyperedge.home.monthlySavings')}
                </span>
                <output
                  aria-labelledby='he-savings-label'
                  htmlFor='he-monthly-input he-monthly-output'
                >
                  {monthlyUsd.format(savings)}
                </output>
              </div>
              {official > 0 && (
                <strong>
                  {t('hyperedge.home.percentLower', {
                    percent: percent.format(savings / official),
                  })}
                </strong>
              )}
            </div>
            <p className='he-rate-note'>{t('hyperedge.home.estimatorNote')}</p>
          </div>
        </div>
      </section>
    </>
  )
}

function GatewayFlow() {
  const { t } = useTranslation()
  const [route, setRoute] = useState<'text' | 'vision'>('text')
  const [run, setRun] = useState(0)

  function previewRoute(next: 'text' | 'vision') {
    setRoute(next)
    setRun((value) => value + 1)
  }

  return (
    <figure className='he-flow' data-route={route}>
      <figcaption className='he-flow-heading'>
        <div>
          <strong>{t('hyperedge.home.flowTitle')}</strong>
          <span>{t('hyperedge.home.flowPreview')}</span>
        </div>
        <Button
          size='icon-sm'
          variant='outline'
          className='he-flow-replay'
          aria-label={t('hyperedge.home.replay')}
          onClick={() => setRun((value) => value + 1)}
        >
          <RotateCw aria-hidden='true' />
        </Button>
      </figcaption>

      <div className='he-flow-diagram'>
        <div className='he-flow-client he-flow-node'>
          <Terminal aria-hidden='true' />
          <strong>{t('hyperedge.home.app')}</strong>
          <small>OpenAI SDK</small>
        </div>
        <div className='he-flow-entry' aria-hidden='true'>
          <span key={run} />
        </div>
        <div className='he-flow-gateway he-flow-node'>
          <img src='/hyperedge-icon.svg' width='34' height='34' alt='' />
          <strong>HyperEdge API</strong>
          <ul>
            <li>{t('hyperedge.home.flowKeys')}</li>
            <li>{t('hyperedge.home.flowRouting')}</li>
            <li>{t('hyperedge.home.flowUsage')}</li>
          </ul>
        </div>
        <div key={run} className='he-flow-branches' aria-hidden='true'>
          <span className='he-flow-branch-text' />
          <span className='he-flow-branch-vision' />
        </div>
        <div
          className='he-flow-targets'
          role='group'
          aria-label={t('hyperedge.home.flowSelect')}
        >
          <Button
            aria-pressed={route === 'text'}
            variant='outline'
            className='he-flow-node'
            onClick={() => previewRoute('text')}
          >
            <MessageSquare aria-hidden='true' />
            <strong>{t('hyperedge.home.textModels')}</strong>
          </Button>
          <Button
            aria-pressed={route === 'vision'}
            variant='outline'
            className='he-flow-node'
            onClick={() => previewRoute('vision')}
          >
            <ScanEye aria-hidden='true' />
            <strong>{t('hyperedge.home.visionModels')}</strong>
          </Button>
        </div>
      </div>
      <div className='he-flow-code'>
        <span>POST</span>
        <code>/v1/chat/completions</code>
      </div>
      <div className='he-model-families'>
        <p id='he-model-families-label'>{t('hyperedge.home.modelFamilies')}</p>
        <ul aria-labelledby='he-model-families-label'>
          {modelFamilies.map((family) => (
            <li key={family.label}>
              <span aria-hidden='true'>{getLobeIcon(family.icon, 17)}</span>
              {family.label}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}

export function HyperEdgeLanding(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  const supportRate = retailRates.find((rate) => rate.id === 'gpt-6.2-sol')
  const consoleLink = props.isAuthenticated ? '/dashboard' : '/sign-in'
  const consoleLabel = props.isAuthenticated
    ? t('Go to Dashboard')
    : t('Sign in')

  return (
    <main className='he-home'>
      <section className='he-hero' aria-labelledby='he-hero-title'>
        <img
          className='he-hero-photo'
          src='/hyperedge/pallekele-campus.webp'
          alt=''
          width='968'
          height='544'
          fetchPriority='high'
        />
        <div className='he-container he-hero-inner'>
          <div className='he-hero-content'>
            <p className='he-kicker'>
              <span aria-hidden='true' />
              {t('hyperedge.home.kicker')}
            </p>
            <h1 id='he-hero-title'>
              {t('hyperedge.home.heroTitle')}{' '}
              <span>{t('hyperedge.home.heroAccent')}</span>
            </h1>
            <p className='he-hero-copy'>{t('hyperedge.home.heroCopy')}</p>
            <div className='he-actions'>
              <Link
                to='/pricing'
                className={buttonVariants({
                  size: 'lg',
                  className: 'he-primary',
                })}
              >
                {t('hyperedge.home.browse')}
                <ArrowRight aria-hidden='true' />
              </Link>
              <Link
                to={consoleLink}
                className={buttonVariants({
                  size: 'lg',
                  variant: 'outline',
                  className: 'he-secondary',
                })}
              >
                {consoleLabel}
              </Link>
            </div>
          </div>
          <GatewayFlow />
          <a className='he-site-link' href='#infrastructure'>
            <MapPin aria-hidden='true' />
            <span>
              <strong>{t('hyperedge.home.siteLocation')}</strong>
              <small>{t('hyperedge.home.siteLabel')}</small>
            </span>
            <ArrowDown aria-hidden='true' />
          </a>
        </div>
      </section>

      <section
        className='he-capabilities'
        aria-label={t('hyperedge.home.gateway')}
      >
        <div className='he-container he-capability-grid'>
          <div>
            <Network aria-hidden='true' />
            <div>
              <h2>{t('hyperedge.home.routeTitle')}</h2>
              <p>{t('hyperedge.home.routeBody')}</p>
            </div>
          </div>
          <div>
            <KeyRound aria-hidden='true' />
            <div>
              <h2>{t('hyperedge.home.keysTitle')}</h2>
              <p>{t('hyperedge.home.keysBody')}</p>
            </div>
          </div>
          <div>
            <ChartNoAxesColumn aria-hidden='true' />
            <div>
              <h2>{t('hyperedge.home.usageTitle')}</h2>
              <p>{t('hyperedge.home.usageBody')}</p>
            </div>
          </div>
        </div>
      </section>

      <BulkPurchasing />
      <RetailPricing />
      <BuyerIntegration isAuthenticated={props.isAuthenticated} />
      {supportRate && <SpendControls rate={supportRate} />}

      <section
        id='infrastructure'
        className='he-infrastructure'
        aria-labelledby='he-site-title'
      >
        <div className='he-container he-site-grid'>
          <figure>
            <img
              src='/hyperedge/pallekele-earth-station.webp'
              alt={t('hyperedge.home.photoAlt')}
              width='538'
              height='302'
              loading='lazy'
            />
            <figcaption>{t('hyperedge.home.photoCaption')}</figcaption>
          </figure>
          <div className='he-site-copy'>
            <p className='he-kicker'>
              <span aria-hidden='true' />
              {t('hyperedge.home.infraLabel')}
            </p>
            <h2 id='he-site-title'>{t('hyperedge.home.siteHeading')}</h2>
            <p className='he-description'>{t('hyperedge.home.siteCopy')}</p>
            <dl>
              <div>
                <dt>{t('hyperedge.home.siteArea')}</dt>
                <dd>{t('hyperedge.home.siteValue')}</dd>
              </div>
              <div>
                <dt>{t('hyperedge.home.building')}</dt>
                <dd>{t('hyperedge.home.buildingValue')}</dd>
              </div>
              <div>
                <dt>{t('hyperedge.home.pod')}</dt>
                <dd>{t('hyperedge.home.podValue')}</dd>
              </div>
            </dl>
            <p className='he-site-note'>{t('hyperedge.home.siteNote')}</p>
          </div>
        </div>
      </section>

      <BuyerPlan />

      <section className='he-close' aria-labelledby='he-close-title'>
        <div className='he-container'>
          <div>
            <h2 id='he-close-title'>{t('hyperedge.home.closeTitle')}</h2>
            <p>{t('hyperedge.home.closeBody')}</p>
          </div>
          <Link
            to='/pricing'
            className={buttonVariants({ size: 'lg', className: 'he-primary' })}
          >
            {t('Model Square')}
            <ArrowRight aria-hidden='true' />
          </Link>
        </div>
      </section>
    </main>
  )
}
