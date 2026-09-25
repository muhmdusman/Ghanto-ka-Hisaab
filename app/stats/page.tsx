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
    return year + '-' + month + '-' + day
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

      if (uniqueDays.size > 0) {
        setAvgHoursPerDay(Math.round((data.length / uniqueDays.size) * 10) / 10)
      } else {
        setAvgHoursPerDay(0)
      }

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
      if (timePeriod === 'custom' && (!customStartDate || !customEndDate)) {
        return
      }
      loadStats(userId, timePeriod)
    }
  }, [timePeriod, userId, loadStats, loading, customStartDate, customEndDate])

  const handleRefresh = async () => {
    if (userId) {
      await loadStats(userId, timePeriod)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
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
    if (range) {
      return range.startDate + ' to ' + range.endDate
    }
    return 'All recorded data'
  }

  return (
    <div className="min-h-screen bg-white">
      <StaggeredMenu items={menuItems} position="left" />

      <main className="p-4 pt-20 md:p-8 md:pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Statistics</h1>
              <p className="text-sm text-zinc-600 mt-1">
                Overview of your time tracking data
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-lg border-2 border-teal-900 bg-teal-50 font-semibold text-teal-950 hover:-translate-y-0.5 hover:bg-teal-100 transition-all shadow-[2px_2px_0_0_#0f766e] disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isRefreshing ? '...' : 'Refresh'}
            </button>
          </div>

          <div className="mb-8 p-4 rounded-lg border-2 border-zinc-900 bg-zinc-100 shadow-[3px_3px_0_0_#323232]">
            <p className="text-sm font-semibold text-zinc-900 mb-3">Time Period</p>

            <div className="mb-4 p-3 bg-white rounded-lg border-2 border-zinc-900">
              <label className="block text-xs font-semibold text-zinc-700 mb-2">Quick Date Filter</label>
              <input
                type="date"
                onChange={(e) => handleSpecificDateFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900 font-medium focus:border-teal-700 focus:outline-none"
                placeholder="Select a specific date"
              />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {(['today', 'last7days', 'last30days', 'custom', 'all'] as TimePeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={
                    'px-4 py-2 rounded-lg border-2 border-zinc-900 font-semibold transition-all shadow-[2px_2px_0_0_#323232] hover:-translate-y-0.5 ' +
                    (timePeriod === period
                      ? 'bg-teal-900 text-white hover:bg-teal-800'
                      : 'bg-white text-zinc-900 hover:bg-teal-50 hover:border-teal-800')
                  }
                >
                  {periodLabels[period]}
                </button>
              ))}
            </div>

            {timePeriod === 'custom' && (
              <div className="flex flex-wrap gap-4 mt-4 p-4 bg-white rounded-lg border-2 border-zinc-900">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900 font-medium focus:border-teal-700 focus:outline-none"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-zinc-900 bg-white text-zinc-900 font-medium focus:border-teal-700 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-zinc-500 mt-2">
              Showing: {getPeriodDescription()}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-6 rounded-lg border-2 border-zinc-900 bg-teal-50 shadow-[4px_4px_0_0_#0f766e] transition-all hover:-translate-y-0.5">
              <p className="text-sm font-semibold text-teal-900">Total Hours Logged</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2">{totalEntries}</p>
              <p className="text-xs text-zinc-500 mt-1">hour entries in database</p>
            </div>
            <div className="p-6 rounded-lg border-2 border-zinc-900 bg-sky-50 shadow-[4px_4px_0_0_#0369a1] transition-all hover:-translate-y-0.5">
              <p className="text-sm font-semibold text-sky-900">Days Tracked</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2">{daysTracked}</p>
              <p className="text-xs text-zinc-500 mt-1">unique days with entries</p>
            </div>
            <div className="p-6 rounded-lg border-2 border-zinc-900 bg-amber-50 shadow-[4px_4px_0_0_#b45309] transition-all hover:-translate-y-0.5">
              <p className="text-sm font-semibold text-amber-900">Avg Hours/Day</p>
              <p className="text-3xl font-bold text-zinc-900 mt-2">{avgHoursPerDay}</p>
              <p className="text-xs text-zinc-500 mt-1">average per tracked day</p>
            </div>
          </div>

          <div className="p-6 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232] mb-8">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              Activity Distribution - {periodLabels[timePeriod]}
            </h2>
            <p className="text-xs text-zinc-600 mb-4 p-3 bg-sky-50 rounded-lg border border-sky-200">
              <span className="font-semibold text-sky-950">How time is divided:</span> If you add multiple tags to one hour, that hour is divided equally across those tags.
            </p>

            {tagStats.length === 0 ? (
              <p className="text-zinc-600 text-center py-8">
                No data for this period. Start tracking your hours to see statistics.
              </p>
            ) : (
              <div className="space-y-4">
                {tagStats.map((stat) => {
                  const timeDisplay = stat.hours > 0
                    ? stat.hours + 'h ' + stat.minutes + 'm'
                    : stat.minutes + 'm'

                  return (
                    <div key={stat.tag} className="space-y-2 rounded-lg p-2 transition-colors hover:bg-teal-50">
                      <div className="flex justify-between items-center gap-3">
                        <span className="font-semibold text-zinc-900">{stat.tag}</span>
                        <span className="text-sm text-zinc-600 whitespace-nowrap">
                          {timeDisplay} ({stat.percentage}%)
                        </span>
                      </div>
                      <div className="h-4 bg-zinc-200 rounded-full border-2 border-zinc-900 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-700 to-sky-600 transition-all duration-500"
                          style={{ width: stat.percentage + '%' }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="p-6 rounded-lg border-2 border-zinc-900 bg-zinc-50 shadow-[4px_4px_0_0_#323232]">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              Recent Entries ({rawEntries.length} total)
            </h2>

            {rawEntries.length === 0 ? (
              <p className="text-zinc-600 text-center py-4">
                No entries found for this period.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {rawEntries.slice(0, 20).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-zinc-300 transition-all hover:-translate-y-0.5 hover:border-teal-700 hover:bg-teal-50"
                  >
                    <div>
                      <span className="font-semibold text-zinc-900">{entry.date}</span>
                      <span className="text-zinc-500 mx-2">|</span>
                      <span className="text-zinc-700">{entry.hour}:00</span>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {entry.tags?.map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-sky-100 text-sky-900 text-xs rounded-full border border-sky-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {rawEntries.length > 20 && (
                  <p className="text-center text-zinc-500 text-sm pt-2">
                    ... and {rawEntries.length - 20} more entries
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {showFeedbackForm && (
        <FeedbackForm onClose={() => setShowFeedbackForm(false)} />
      )}
    </div>
  )
}

export default dynamic(() => Promise.resolve(StatsPage), { ssr: false })
