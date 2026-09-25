'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import StaggeredMenu from '@/components/StaggeredMenu'
import Loader from '@/components/Loader'
import FeedbackForm from '@/components/FeedbackForm'

interface TagStats {
  tag: string
  count: number
  hours: number
  minutes: number
  percentage: number
}

interface HourEntry {
  id: string
  date: string
  hour: number
  tags: string[]
  details: string | null
}

type TimePeriod = 'today' | 'last7days' | 'last30days' | 'custom' | 'all'

function StatsPage() {
  const [loading, setLoading] = useState(true)
  const [tagStats, setTagStats] = useState<TagStats[]>([])
  const [totalEntries, setTotalEntries] = useState(0)
  const [daysTracked, setDaysTracked] = useState(0)
  const [avgHoursPerDay, setAvgHoursPerDay] = useState(0)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [rawEntries, setRawEntries] = useState<HourEntry[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDateRange = useCallback((period: TimePeriod): { startDate: string; endDate: string } | null => {
    const today = new Date()
    const endDate = formatLocalDate(today)
    let startDate: string

    switch (period) {
      case 'today':
        startDate = endDate
        break
      case 'last7days': {
        const weekAgo = new Date(today)
        weekAgo.setDate(today.getDate() - 6)
        startDate = formatLocalDate(weekAgo)
        break
      }
      case 'last30days': {
        const monthAgo = new Date(today)
        monthAgo.setDate(today.getDate() - 29)
        startDate = formatLocalDate(monthAgo)
        break
      }
      case 'custom':
        if (customStartDate && customEndDate) {
          return { startDate: customStartDate, endDate: customEndDate }
        }
        return null
      case 'all':
      default:
        return null
    }

    return { startDate, endDate }
  }, [customStartDate, customEndDate])

  const loadStats = useCallback(async (uid: string, period: TimePeriod) => {
    setIsRefreshing(true)

    let query = supabase
      .from('hour_entries')
      .select('*')
      .eq('user_id', uid)
      .order('date', { ascending: false })
      .order('hour', { ascending: true })

    const dateRange = getDateRange(period)
    if (dateRange) {
      query = query.gte('date', dateRange.startDate).lte('date', dateRange.endDate)
    }

    const { data, error } = await query

    if (!error && data) {
      setRawEntries(data as HourEntry[])
      setTotalEntries(data.length)

      const uniqueDays = new Set(data.map(e => e.date))
      setDaysTracked(uniqueDays.size)
      setAvgHoursPerDay(uniqueDays.size > 0 ? Math.round((data.length / uniqueDays.size) * 10) / 10 : 0)

      const tagCounts: { [tag: string]: number } = {}
      data.forEach(entry => {
        if (entry.tags && Array.isArray(entry.tags) && entry.tags.length > 0) {
          const fractionalHour = 1 / entry.tags.length
          entry.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + fractionalHour
          })
        }
      })

      const totalTagHours = Object.values(tagCounts).reduce((a, b) => a + b, 0)
      const stats: TagStats[] = Object.entries(tagCounts)
        .map(([tag, hours]) => {
          const h = Math.floor(hours)
          const m = Math.round((hours - h) * 60)
          return {
            tag,
            count: hours,
            hours: h,
            minutes: m,
            percentage: totalTagHours > 0 ? Math.round((hours / totalTagHours) * 100) : 0
          }
        })
        .sort((a, b) => b.count - a.count)

      setTagStats(stats)
    } else {
      console.error('Error loading stats:', error)
      setRawEntries([])
      setTotalEntries(0)
      setDaysTracked(0)
      setAvgHoursPerDay(0)
      setTagStats([])
    }

    setIsRefreshing(false)
  }, [supabase, getDateRange])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      setIsAdmin(user.email === 'amusman9705@gmail.com')

      const today = formatLocalDate(new Date())
      setCustomStartDate(today)
      setCustomEndDate(today)

      await loadStats(user.id, timePeriod)
      setLoading(false)
    }
    getUser()
  }, [router, supabase, loadStats, timePeriod])

  useEffect(() => {
    if (userId && !loading) {
      if (timePeriod === 'custom' && (!customStartDate || !customEndDate)) return
      loadStats(userId, timePeriod)
    }
  }, [timePeriod, userId, loadStats, loading, customStartDate, customEndDate])

  const handleRefresh = async () => {
    if (userId) await loadStats(userId, timePeriod)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-surface)]">
        <Loader />
      </div>
    )
  }

  const menuItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Statistics', href: '/stats' },
    ...(isAdmin ? [{ label: 'Attendance', href: '/attendance' }] : []),
    { label: 'Settings', href: '/settings' },
    { label: 'Feedback', onClick: () => setShowFeedbackForm(true) },
    { label: 'Sign Out', onClick: handleSignOut }
  ]

  const periodLabels: Record<TimePeriod, string> = {
    today: 'Today',
    last7days: 'Last 7 Days',
    last30days: 'Last 30 Days',
    custom: 'Custom Range',
    all: 'All Time'
  }

  const handleSpecificDateFilter = (date: string) => {
    setCustomStartDate(date)
    setCustomEndDate(date)
    setTimePeriod('custom')
  }

  const getPeriodDescription = () => {
    const range = getDateRange(timePeriod)
    if (range) return `${range.startDate} to ${range.endDate}`
    return 'All recorded data'
  }

  return (
    <div className="min-h-screen bg-[var(--app-surface)] text-zinc-950">
      <StaggeredMenu items={menuItems} position="left" />

      <main className="px-4 pb-12 pt-24 md:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--app-accent)]">Time intelligence</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">Statistics</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                A focused read on logged hours, active days, and where your time actually went.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-900 bg-zinc-950 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(24,24,27,0.18)] transition hover:-translate-y-0.5 hover:bg-zinc-800 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing' : 'Refresh'}
            </button>
          </div>

          <section className="mb-6 rounded-[1.5rem] border border-zinc-200 bg-white/85 p-4 shadow-[0_18px_60px_rgba(24,24,27,0.08)] backdrop-blur sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[220px_1fr] lg:items-start">
              <div>
                <p className="text-sm font-bold text-zinc-950">Time period</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">Showing: {getPeriodDescription()}</p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold text-zinc-600">Quick date filter</span>
                    <input
                      type="date"
                      onChange={(e) => handleSpecificDateFilter(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/10"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['today', 'last7days', 'last30days', 'custom', 'all'] as TimePeriod[]).map((period) => (
                      <button
                        key={period}
                        onClick={() => setTimePeriod(period)}
                        className={`rounded-full border px-4 py-2 text-sm font-bold transition active:scale-[0.98] ${
                          timePeriod === period
                            ? 'border-zinc-950 bg-zinc-950 text-white shadow-[0_8px_20px_rgba(24,24,27,0.18)]'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:text-zinc-950'
                        }`}
                      >
                        {periodLabels[period]}
                      </button>
                    ))}
                  </div>
                </div>

                {timePeriod === 'custom' && (
                  <div className="grid gap-3 rounded-2xl bg-zinc-50 p-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-zinc-600">Start date</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold text-zinc-600">End date</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-900 outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              ['Total hours logged', totalEntries, 'hour entries in database'],
              ['Days tracked', daysTracked, 'unique days with entries'],
              ['Avg hours/day', avgHoursPerDay, 'average per tracked day']
            ].map(([label, value, helper]) => (
              <div key={label} className="rounded-[1.35rem] border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(24,24,27,0.07)]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
                <p className="mt-3 font-mono text-4xl font-black tracking-tight text-zinc-950">{value}</p>
                <p className="mt-2 text-xs text-zinc-500">{helper}</p>
              </div>
            ))}
          </section>

          <section className="mb-6 rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.08)] sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-black tracking-tight text-zinc-950">Activity distribution</h2>
                <p className="mt-1 text-sm text-zinc-600">{periodLabels[timePeriod]} breakdown by tag.</p>
              </div>
              <p className="max-w-md rounded-2xl bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-600">
                Hours with multiple tags are split evenly across each tag, so shared work stays proportionate.
              </p>
            </div>

            {tagStats.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center">
                <p className="font-semibold text-zinc-900">No data for this period.</p>
                <p className="mt-1 text-sm text-zinc-500">Start logging hours to see your time distribution.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {tagStats.map((stat) => {
                  const timeDisplay = stat.hours > 0 ? `${stat.hours}h ${stat.minutes}m` : `${stat.minutes}m`

                  return (
                    <div key={stat.tag} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-zinc-950">{stat.tag}</span>
                        <span className="font-mono text-sm text-zinc-500">{timeDisplay} / {stat.percentage}%</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full bg-[var(--app-accent)] transition-all duration-500"
                          style={{ width: `${stat.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-[0_18px_60px_rgba(24,24,27,0.08)] sm:p-6">
            <h2 className="text-xl font-black tracking-tight text-zinc-950">Recent entries</h2>
            <p className="mt-1 text-sm text-zinc-600">Showing {rawEntries.length} total entries for the selected period.</p>

            {rawEntries.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-500">
                No entries found for this period.
              </div>
            ) : (
              <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
                {rawEntries.slice(0, 20).map((entry) => (
                  <div
                    key={entry.id}
                    className="grid gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 sm:grid-cols-[160px_1fr] sm:items-center"
                  >
                    <div className="font-mono text-sm font-bold text-zinc-900">
                      {entry.date} <span className="text-zinc-400">/</span> {String(entry.hour).padStart(2, '0')}:00
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:justify-end">
                      {entry.tags?.map((tag, i) => (
                        <span key={i} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {rawEntries.length > 20 && (
                  <p className="text-center text-sm text-zinc-500">and {rawEntries.length - 20} more entries</p>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {showFeedbackForm && <FeedbackForm onClose={() => setShowFeedbackForm(false)} />}
    </div>
  )
}

export default dynamic(() => Promise.resolve(StatsPage), { ssr: false })
