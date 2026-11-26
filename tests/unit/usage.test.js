import { describe, expect, it } from 'vitest'
import {
  dayInTimeZone,
  isDay,
  isoDaysAgo,
  json,
  reportEmail,
  safeEqual,
  sameOrigin,
  tokenFrom,
  validateEvent,
  visitorHash,
} from '../../functions/_lib.js'

describe('dayInTimeZone', () => {
  it('rolls to the next IST day after 18:30 UTC', () => {
    expect(dayInTimeZone(new Date('2026-11-25T18:35:00Z'))).toBe('2026-11-26')
  })

  it('keeps the same day before the IST midnight', () => {
    expect(dayInTimeZone(new Date('2026-11-25T18:20:00Z'))).toBe('2026-11-25')
    expect(dayInTimeZone(new Date('2026-11-25T00:00:00Z'))).toBe('2026-11-25')
  })
})

describe('isoDaysAgo', () => {
  it('subtracts days across a month boundary', () => {
    expect(isoDaysAgo('2026-03-01', 1)).toBe('2026-02-28')
  })

  it('subtracts across a year boundary', () => {
    expect(isoDaysAgo('2026-01-01', 1)).toBe('2025-12-31')
  })
})

describe('isDay', () => {
  it('accepts real dates and rejects impossible ones', () => {
    expect(isDay('2026-11-25')).toBe(true)
    expect(isDay('2026-02-30')).toBe(false)
    expect(isDay('25-11-2026')).toBe(false)
    expect(isDay('')).toBe(false)
  })
})

describe('validateEvent', () => {
  it('accepts a public path', () => {
    expect(validateEvent({ type: 'page', path: '/image-compressor' })).toEqual({
      type: 'page',
      path: '/image-compressor',
    })
  })

  it('rejects the private report and the API', () => {
    expect(validateEvent({ type: 'page', path: '/usage' })).toBeNull()
    expect(validateEvent({ type: 'page', path: '/usage/' })).toBeNull()
    expect(validateEvent({ type: 'page', path: '/api/track' })).toBeNull()
  })

  it('rejects paths that are not site paths', () => {
    expect(validateEvent({ type: 'page', path: 'https://example.com/' })).toBeNull()
    expect(validateEvent({ type: 'page', path: '' })).toBeNull()
    expect(validateEvent({ type: 'page', path: 42 })).toBeNull()
  })

  it('accepts tool ids and rejects unsafe ones', () => {
    expect(validateEvent({ type: 'tool', tool: 'image-compressor' })).toEqual({
      type: 'tool',
      tool: 'image-compressor',
    })
    expect(validateEvent({ type: 'tool', tool: 'Image Compressor' })).toBeNull()
    expect(validateEvent({ type: 'tool', tool: '<script>' })).toBeNull()
    expect(validateEvent({ type: 'tool', tool: `a${'b'.repeat(60)}` })).toBeNull()
  })

  it('rejects unknown event types and empty bodies', () => {
    expect(validateEvent({ type: 'click' })).toBeNull()
    expect(validateEvent(null)).toBeNull()
  })
})

describe('visitorHash', () => {
  it('is stable for the same day, address and agent', async () => {
    const input = { day: '2026-11-25', ip: '203.0.113.7', userAgent: 'test-agent', salt: 'salt' }
    const first = await visitorHash(input)
    const second = await visitorHash(input)
    expect(first).toBe(second)
    expect(first).toMatch(/^[0-9a-f]{32}$/)
  })

  it('changes with the day, the salt and the address', async () => {
    const base = { day: '2026-11-25', ip: '203.0.113.7', userAgent: 'test-agent', salt: 'salt' }
    const hash = await visitorHash(base)
    expect(await visitorHash({ ...base, day: '2026-11-26' })).not.toBe(hash)
    expect(await visitorHash({ ...base, salt: 'other' })).not.toBe(hash)
    expect(await visitorHash({ ...base, ip: '203.0.113.8' })).not.toBe(hash)
  })
})

describe('sameOrigin', () => {
  it('allows requests without an Origin and same-host origins', () => {
    expect(sameOrigin(new Request('https://filevra.app/api/track'))).toBe(true)
    expect(
      sameOrigin(
        new Request('https://filevra.app/api/track', { headers: { Origin: 'https://filevra.app' } }),
      ),
    ).toBe(true)
  })

  it('rejects other hosts and malformed origins', () => {
    expect(
      sameOrigin(
        new Request('https://filevra.app/api/track', { headers: { Origin: 'https://example.com' } }),
      ),
    ).toBe(false)
    expect(
      sameOrigin(new Request('https://filevra.app/api/track', { headers: { Origin: 'not a url' } })),
    ).toBe(false)
  })
})

describe('tokenFrom', () => {
  it('reads the header, the bearer token and the query parameter in that order', () => {
    expect(
      tokenFrom(
        new Request('https://filevra.app/api/usage?token=query', { headers: { 'X-Usage-Token': 'header' } }),
      ),
    ).toBe('header')
    expect(
      tokenFrom(
        new Request('https://filevra.app/api/usage?token=query', {
          headers: { Authorization: 'Bearer bearer-value' },
        }),
      ),
    ).toBe('bearer-value')
    expect(tokenFrom(new Request('https://filevra.app/api/usage?token=query'))).toBe('query')
  })
})

describe('safeEqual', () => {
  it('compares equal strings and rejects different or empty ones', () => {
    expect(safeEqual('abc', 'abc')).toBe(true)
    expect(safeEqual('abc', 'abd')).toBe(false)
    expect(safeEqual('abc', 'abcd')).toBe(false)
    expect(safeEqual('', '')).toBe(false)
    expect(safeEqual(undefined, 'abc')).toBe(false)
  })
})

describe('reportEmail', () => {
  it('describes an empty day honestly', () => {
    const email = reportEmail({ day: '2026-11-25', stats: undefined })
    expect(email.subject).toContain('2026-11-25')
    expect(email.text).toContain('Unique visitors: 0')
    expect(email.text).toContain('No visits were recorded for this day.')
    expect(email.html).toContain('No visits were recorded for this day.')
  })

  it('lists tools and pages with grouped numbers', () => {
    const email = reportEmail({
      day: '2026-11-25',
      stats: { visitors: 1234, page_views: 2345, tool_runs: 99 },
      tools: [{ tool: 'image-compressor', runs: 42 }],
      pages: [{ path: '/image-compressor', views: 1200 }],
    })
    expect(email.text).toContain('Unique visitors: 1,234')
    expect(email.text).toContain('- image-compressor: 42')
    expect(email.text).toContain('- /image-compressor: 1,200')
    expect(email.html).toContain('image-compressor')
  })

  it('escapes HTML in reported values', () => {
    const email = reportEmail({
      day: '2026-11-25',
      stats: { visitors: 1, page_views: 1, tool_runs: 1 },
      tools: [{ tool: '<script>alert(1)</script>', runs: 1 }],
      pages: [],
    })
    expect(email.html).not.toContain('<script>alert(1)</script>')
    expect(email.html).toContain('&lt;script&gt;')
  })
})

describe('json', () => {
  it('returns JSON with no-store caching', async () => {
    const response = json({ ok: true }, 201)
    expect(response.status).toBe(201)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(await response.json()).toEqual({ ok: true })
  })
})
