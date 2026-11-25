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
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import i18next from 'i18next'
import type { ReactNode } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import en from '@/i18n/locales/en.json'
import fr from '@/i18n/locales/fr.json'
import ja from '@/i18n/locales/ja.json'
import ru from '@/i18n/locales/ru.json'
import viLocale from '@/i18n/locales/vi.json'
import zhTW from '@/i18n/locales/zh-TW.json'
import zhCN from '@/i18n/locales/zh.json'

import { Home } from '..'

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  Link: ({ to, children, ...props }: { to: string; children: ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))
vi.mock('@/components/layout', () => ({
  PublicLayout: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('@/components/layout/components/footer', () => ({
  Footer: () => <footer>Project attribution</footer>,
}))
vi.mock('@/context/theme-provider', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}))
vi.mock('@/hooks/use-status', () => ({ useStatus: () => ({ status: null }) }))
vi.mock('@/lib/lobe-icon', () => ({ getLobeIcon: () => null }))
vi.mock('../hooks', () => ({
  useHomePageContent: () => ({ content: '', isLoaded: true, isUrl: false }),
}))

describe('HyperEdge homepage', () => {
  beforeAll(() => {
    i18next.addResourceBundle('en', 'translation', en.translation)
  })

  it.each([
    ['fr', fr],
    ['ja', ja],
    ['ru', ru],
    ['vi', viLocale],
    ['zhTW', zhTW],
    ['zhCN', zhCN],
  ])(
    'loads the homepage copy without English fallback in %s',
    (_language, locale) => {
      const localizableKeys = Object.entries(en.translation).filter(([key]) =>
        /^(hyperedge\.(home|buyer)\.)/.test(key)
      )
      const localeText: Record<string, string> = locale.translation
      const sharedLabels = new Set([
        'hyperedge.home.openaiStandard',
        'hyperedge.home.infraLabel',
        'hyperedge.home.siteLocation',
        'hyperedge.home.siteHeading',
        'hyperedge.home.siteValue',
        'hyperedge.buyer.exampleTokenCounts',
      ])

      for (const [key, source] of localizableKeys) {
        expect(localeText[key], key).toBeTruthy()
        if (!sharedLabels.has(key)) {
          expect(localeText[key], key).not.toBe(source)
        }
        const placeholders = /{{\w+}}/g
        expect(localeText[key].match(placeholders)?.sort()).toEqual(
          source.match(placeholders)?.sort()
        )
      }
    }
  )

  it('updates the homepage copy and example prompt when the language changes', async () => {
    i18next.addResourceBundle('fr', 'translation', fr.translation)
    render(<Home />)

    try {
      await act(async () => {
        await i18next.changeLanguage('fr')
      })

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: [
            fr.translation['hyperedge.home.heroTitle'],
            fr.translation['hyperedge.home.heroAccent'],
          ].join(' '),
        })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('tabpanel', { name: 'Python' })
      ).toHaveTextContent(fr.translation['hyperedge.buyer.examplePrompt'])
      expect(
        screen.getByLabelText(fr.translation['hyperedge.home.monthlyEstimate'])
          .textContent
      ).toBe(
        new Intl.NumberFormat('fr', {
          style: 'currency',
          currency: 'USD',
        }).format(186.27)
      )
    } finally {
      await act(async () => {
        await i18next.changeLanguage('en')
      })
    }
  })
  it('presents the gateway and planned Pallekele deployment without third-party application promotions', () => {
    render(<Home />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Leading AI models. One dependable API.',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /pallekele, kandy/i })
    ).toBeInTheDocument()
    expect(screen.getByText(/planned deployment/i)).toBeInTheDocument()
    expect(
      screen.queryByText(/cherry studio|local ollama|hosted models/i)
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /browse models/i })
    ).toHaveAttribute('href', '/pricing')
  })

  it('lets visitors choose which route the illustrative request follows', () => {
    render(<Home />)

    expect(screen.getByRole('button', { name: 'Text models' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Vision models' }))
    expect(screen.getByRole('button', { name: 'Text models' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(
      screen.getByRole('button', { name: 'Vision models' })
    ).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('button', { name: 'Replay request flow' })
    ).toBeEnabled()
  })

  it('lists the supported model families under HyperEdge branding', () => {
    render(<Home />)

    expect(
      screen.getByText(/provided through hyperedge api/i)
    ).toBeInTheDocument()
    const families = screen.getByRole('list', {
      name: /supported model families/i,
    })
    for (const name of ['OpenAI', 'Claude', 'DeepSeek', 'Qwen', 'Google']) {
      expect(within(families).getByText(name)).toBeInTheDocument()
    }
  })

  it('shows the quoted USD rate and recalculates estimated spend for the selected model', () => {
    render(<Home />)

    const quotedRates = screen.getByRole('table', {
      name: /quoted text rates/i,
    })
    const astra = within(quotedRates).getByRole('row', {
      name: /gpt-6.2 astra/i,
    })
    expect(within(astra).getByText('$0.9313')).toBeInTheDocument()
    expect(within(astra).getByText('$4.6567')).toBeInTheDocument()
    expect(within(astra).getByText('$40.00')).toBeInTheDocument()
    expect(
      screen.getByLabelText(/openai standard monthly spend/i)
    ).toHaveTextContent('$1,600.00')
    expect(
      screen.getByLabelText(/estimated monthly savings/i)
    ).toHaveTextContent('$1,413.73')
    expect(screen.getByText('88.4% lower')).toBeInTheDocument()
    expect(screen.getByLabelText(/estimated monthly spend/i)).toHaveTextContent(
      '$186.27'
    )
    fireEvent.click(screen.getByRole('radio', { name: /gpt-6.2 sol/i }))
    fireEvent.change(
      screen.getByRole('spinbutton', { name: /monthly input/i }),
      { target: { value: '10' } }
    )
    expect(screen.getByLabelText(/estimated monthly spend/i)).toHaveTextContent(
      '$25.61'
    )
  })

  it('loads a sample workload into the existing monthly estimator', () => {
    render(<Home />)

    fireEvent.click(
      screen.getByRole('link', { name: 'Estimate spend for consumer apps' })
    )

    expect(screen.getByRole('radio', { name: 'GPT-6.2 Sol' })).toBeChecked()
    expect(
      screen.getByRole('spinbutton', { name: /monthly input/i })
    ).toHaveValue(300)
    expect(
      screen.getByRole('spinbutton', { name: /monthly output/i })
    ).toHaveValue(60)
    expect(
      screen.getByLabelText('HyperEdge estimated monthly spend')
    ).toHaveTextContent('$139.70')
  })
})
