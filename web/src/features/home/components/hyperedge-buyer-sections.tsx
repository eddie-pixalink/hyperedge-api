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
import { ArrowDown, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toIntlLocale } from '@/i18n/languages'

export function BulkPurchasing() {
  const { t } = useTranslation()
  const steps = [
    [t('hyperedge.buyer.poolTitle'), t('hyperedge.buyer.poolBody')],
    [t('hyperedge.buyer.buyTitle'), t('hyperedge.buyer.buyBody')],
    [t('hyperedge.buyer.quoteTitle'), t('hyperedge.buyer.quoteBody')],
  ]

  return (
    <section className='he-bulk he-section' aria-labelledby='he-bulk-title'>
      <div className='he-container'>
        <h2 id='he-bulk-title'>{t('hyperedge.buyer.bulkTitle')}</h2>
        <p className='he-description'>{t('hyperedge.buyer.bulkIntro')}</p>
        <ol className='he-bulk-steps'>
          {steps.map(([title, body], index) => (
            <li key={title}>
              <span aria-hidden='true'>
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

type WorkloadUsage = {
  model: 'gpt-6.2-sol' | 'gpt-5.5'
  input: number
  output: number
}

export function WorkloadExamples(props: {
  onSelect: (usage: WorkloadUsage) => void
}) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(
    toIntlLocale(i18n.resolvedLanguage || i18n.language),
    { notation: 'compact', maximumFractionDigits: 1 }
  )
  const workloads = [
    {
      title: t('hyperedge.buyer.consumerTitle'),
      body: t('hyperedge.buyer.consumerBody'),
      estimate: t('hyperedge.buyer.consumerEstimate'),
      usage: { model: 'gpt-6.2-sol', input: 300, output: 60 },
    },
    {
      title: t('hyperedge.buyer.supportTitle'),
      body: t('hyperedge.buyer.supportBody'),
      estimate: t('hyperedge.buyer.supportEstimate'),
      usage: { model: 'gpt-6.2-sol', input: 30, output: 6 },
    },
    {
      title: t('hyperedge.buyer.documentsTitle'),
      body: t('hyperedge.buyer.documentsBody'),
      estimate: t('hyperedge.buyer.documentsEstimate'),
      usage: { model: 'gpt-5.5', input: 80, output: 12 },
    },
  ] satisfies {
    title: string
    body: string
    estimate: string
    usage: WorkloadUsage
  }[]

  return (
    <section
      className='he-workloads he-section'
      aria-labelledby='he-workloads-title'
    >
      <div className='he-container he-buyer-split'>
        <div>
          <h2 id='he-workloads-title'>{t('hyperedge.buyer.workloadsTitle')}</h2>
          <p className='he-description'>
            {t('hyperedge.buyer.workloadsIntro')}
          </p>
        </div>
        <ul className='he-workload-list'>
          {workloads.map(({ title, body, estimate, usage }) => (
            <li key={usage.model + usage.input}>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
                <p className='he-workload-volume'>
                  {t('hyperedge.buyer.workloadVolume', {
                    input: number.format(usage.input * 1_000_000),
                    output: number.format(usage.output * 1_000_000),
                  })}
                </p>
              </div>
              <a
                href='#he-estimator'
                aria-label={estimate}
                className='he-section-link'
                onClick={() => props.onSelect(usage)}
              >
                {t('hyperedge.buyer.estimateSpend')}
                <ArrowDown aria-hidden='true' />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const examples = [
  {
    label: 'Python',
    code: (prompt: string) => `import os
from openai import OpenAI

client = OpenAI(
    base_url=os.environ["HYPEREDGE_BASE_URL"],
    api_key=os.environ["HYPEREDGE_API_KEY"],
)

response = client.chat.completions.create(
    model=os.environ["HYPEREDGE_MODEL"],
    messages=[{"role": "user", "content": ${prompt}}],
)
print(response.choices[0].message.content)`,
  },
  {
    label: 'Node.js',
    code: (prompt: string) => `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: process.env.HYPEREDGE_BASE_URL,
  apiKey: process.env.HYPEREDGE_API_KEY,
});

const response = await client.chat.completions.create({
  model: process.env.HYPEREDGE_MODEL,
  messages: [{ role: "user", content: ${prompt} }],
});
console.log(response.choices[0].message.content);`,
  },
] as const

export function BuyerIntegration(props: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  const prompt = JSON.stringify(t('hyperedge.buyer.examplePrompt'))

  return (
    <section
      className='he-integrate he-section'
      aria-labelledby='he-integrate-title'
    >
      <div className='he-container he-buyer-split'>
        <div>
          <h2 id='he-integrate-title'>{t('hyperedge.buyer.integrateTitle')}</h2>
          <p className='he-description'>
            {t('hyperedge.buyer.integrateIntro')}
          </p>
          <p className='he-integration-note'>
            {t('hyperedge.buyer.integrateNote')}
          </p>
          <Link
            to={props.isAuthenticated ? '/playground' : '/sign-in'}
            className='he-section-link'
          >
            {props.isAuthenticated
              ? t('Playground')
              : t('hyperedge.buyer.signInPlayground')}
            <ArrowRight aria-hidden='true' />
          </Link>
        </div>
        <Tabs defaultValue='Python' className='he-code-panel'>
          <TabsList
            aria-label={t('hyperedge.buyer.codeLanguage')}
            className='he-code-tabs'
          >
            {examples.map(({ label }) => (
              <TabsTrigger key={label} value={label}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {examples.map(({ label, code }) => {
            const snippet = code(prompt)
            return (
              <TabsContent
                value={label}
                key={label}
                className='he-code-content'
              >
                <CopyButton
                  value={snippet}
                  aria-label={t('hyperedge.buyer.copyExample')}
                />
                <pre aria-label={label} tabIndex={0}>
                  <code>{snippet}</code>
                </pre>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </section>
  )
}

export function SpendControls(props: {
  rate: { model: string; input: number; output: number }
}) {
  const { t, i18n } = useTranslation()
  const locale = toIntlLocale(i18n.resolvedLanguage || i18n.language)
  const currency = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  })
  const preciseCurrency = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 6,
  })
  const number = new Intl.NumberFormat(locale)
  const inputTokens = 10_000
  const outputTokens = 1_000
  const exampleCharge =
    (inputTokens * props.rate.input + outputTokens * props.rate.output) /
    1_000_000
  const quota = 100
  const used = 25

  return (
    <section className='he-spend he-section' aria-labelledby='he-spend-title'>
      <div className='he-container he-buyer-split'>
        <div>
          <h2 id='he-spend-title'>{t('hyperedge.buyer.spendTitle')}</h2>
          <p className='he-description'>{t('hyperedge.buyer.spendIntro')}</p>
          <ul className='he-spend-list'>
            <li>{t('hyperedge.buyer.spendKeys')}</li>
            <li>{t('hyperedge.buyer.spendModels')}</li>
            <li>{t('hyperedge.buyer.spendLogs')}</li>
          </ul>
        </div>
        <figure className='he-console-example'>
          <figcaption>{t('hyperedge.buyer.exampleAccount')}</figcaption>
          <div className='he-console-quota'>
            <div>
              <h3>{t('hyperedge.buyer.pilotKey')}</h3>
              <span>
                {t('hyperedge.buyer.quotaRemaining', {
                  balance: currency.format(quota - used),
                  total: currency.format(quota),
                })}
              </span>
            </div>
            <meter
              min={0}
              max={quota}
              value={used}
              aria-label={t('hyperedge.buyer.quotaUsed')}
            />
          </div>
          <dl className='he-console-log'>
            <div>
              <dt>{t('Model')}</dt>
              <dd>{props.rate.model}</dd>
            </div>
            <div>
              <dt>{t('hyperedge.buyer.exampleTokens')}</dt>
              <dd>
                {t('hyperedge.buyer.exampleTokenCounts', {
                  input: number.format(inputTokens),
                  output: number.format(outputTokens),
                })}
              </dd>
            </div>
            <div>
              <dt>{t('hyperedge.buyer.exampleQuote')}</dt>
              <dd>{preciseCurrency.format(exampleCharge)}</dd>
            </div>
          </dl>
        </figure>
      </div>
    </section>
  )
}

export function BuyerPlan() {
  const { t } = useTranslation()
  const steps = [
    t('hyperedge.buyer.prepareUsage'),
    t('hyperedge.buyer.preparePilot'),
    t('hyperedge.buyer.prepareRollout'),
  ]
  const questions = [
    [
      'availability',
      t('hyperedge.buyer.availabilityQ'),
      t('hyperedge.buyer.availabilityA'),
    ],
    ['outage', t('hyperedge.buyer.outageQ'), t('hyperedge.buyer.outageA')],
    ['pricing', t('hyperedge.buyer.pricingQ'), t('hyperedge.buyer.pricingA')],
    ['data', t('hyperedge.buyer.dataQ'), t('hyperedge.buyer.dataA')],
  ]

  return (
    <section
      className='he-buyer-plan he-section'
      aria-labelledby='he-buyer-plan-title'
    >
      <div className='he-container he-buyer-split'>
        <div>
          <h2 id='he-buyer-plan-title'>{t('hyperedge.buyer.planTitle')}</h2>
          <ol className='he-pilot-steps'>
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <a
            href='#he-estimator'
            className={buttonVariants({ className: 'he-primary' })}
          >
            {t('hyperedge.buyer.estimatePilot')}
            <ArrowRight aria-hidden='true' />
          </a>
        </div>
        <div className='he-faq'>
          <h3>{t('hyperedge.buyer.faqTitle')}</h3>
          <Accordion>
            {questions.map(([key, question, answer]) => (
              <AccordionItem value={key} key={key}>
                <AccordionTrigger>{question}</AccordionTrigger>
                <AccordionContent>{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
