'use client'

import { useState, useEffect, useRef } from 'react'
import { isOnline } from '@/utils/offlineSync'
import { PRODUCTIVE_QUOTES, REFLECTION_QUOTES, type Quote } from '@/lib/trackerQuotes'

interface HourTrackerProps {
  date: Date
  entries: { [hour: number]: { tags: string[]; details?: string } }
  reflection: {
    outputTitle: string | null
    outputContent: string | null
    learningTitle: string | null
    learningContent: string | null
  }
  onSave: (hour: number, tags: string[], details?: string) => Promise<void>
  onSaveReflection: (payload: {
    outputTitle?: string | null
    outputContent?: string | null
    learningTitle?: string | null
    learningContent?: string | null
  }) => Promise<void>
  onOpenDate: (date: Date) => Promise<void> | void
  userPredefinedTags: string[]
  onAddUserPredefinedTag: (tag: string) => Promise<void>
  onDeleteUserPredefinedTag: (tag: string) => Promise<void>
  onClose: () => void
}

type ReflectionKind = 'output' | 'learning'

const PREDEFINED_TAGS = ['Sleep', 'Daily Task', 'Study', 'Phone Scrolling', 'With Friends', 'Fun', 'Work']
const DAY_TITLE_TAGS = ['Happy', 'Average', 'Sad', 'Best', 'Focused', 'Grateful', 'Challenging', 'Productive']

function normalizeTag(tag: string) {
  return tag.trim().replace(/\s+/g, ' ')
}

function hasTag(tags: string[], target: string) {
  return tags.some((tag) => tag.toLowerCase() === target.toLowerCase())
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function toEditorHtml(value: string | null | undefined) {
  if (!value) return ''
  return value
}

function QuoteCard({ quote }: { quote: Quote }) {
  return (
    <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-3">
      <p className="text-sm text-zinc-800">&quot;{quote.text}&quot;</p>
      <p className="mt-2 text-xs font-semibold text-zinc-600">- {quote.author}</p>
    </div>
  )
}

export default function HourTracker({
  date,
  entries,
  reflection,
  onSave,
  onSaveReflection,
  onOpenDate,
  userPredefinedTags,
  onAddUserPredefinedTag,
  onDeleteUserPredefinedTag,
  onClose
}: HourTrackerProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [oneTimeCustomTag, setOneTimeCustomTag] = useState('')
  const [predefinedCustomTag, setPredefinedCustomTag] = useState('')
  const [details, setDetails] = useState('')
  const [saving, setSaving] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [addingPredefinedTag, setAddingPredefinedTag] = useState(false)
  const [deletingTag, setDeletingTag] = useState<string | null>(null)
  const [isManagingSavedTags, setIsManagingSavedTags] = useState(false)
  const [activeReflectionModal, setActiveReflectionModal] = useState<ReflectionKind | null>(null)
  const [reflectionTitle, setReflectionTitle] = useState('')
  const [customReflectionTitle, setCustomReflectionTitle] = useState('')
  const [reflectionSaving, setReflectionSaving] = useState(false)
  const [reflectionQuoteIndex, setReflectionQuoteIndex] = useState(0)
  const [planningQuoteIndex, setPlanningQuoteIndex] = useState(0)
  const [showNextDayPlannerPrompt, setShowNextDayPlannerPrompt] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggeredRef = useRef(false)
  const reflectionEditorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setIsOffline(!isOnline())

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  const handleHourClick = (hour: number) => {
    setSelectedHour(hour)
    const entry = entries[hour]
    setSelectedTags(entry?.tags || [])
    setDetails(entry?.details || '')
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const addOneTimeCustomTag = () => {
    const normalizedTag = normalizeTag(oneTimeCustomTag)

    if (!normalizedTag) {
      return
    }

    if (!hasTag(selectedTags, normalizedTag)) {
      setSelectedTags((prev) => [...prev, normalizedTag])
    }

    setOneTimeCustomTag('')
  }

  const addPredefinedCustomTag = async () => {
    const normalizedTag = normalizeTag(predefinedCustomTag)

    if (!normalizedTag) {
      return
    }

    if (!hasTag(selectedTags, normalizedTag)) {
      setSelectedTags((prev) => [...prev, normalizedTag])
    }

    setAddingPredefinedTag(true)
    try {
      await onAddUserPredefinedTag(normalizedTag)
      setPredefinedCustomTag('')
    } finally {
      setAddingPredefinedTag(false)
    }
  }

  const startLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }

    longPressTriggeredRef.current = false
    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true
      setIsManagingSavedTags(true)
    }, 500)
  }

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleSavedTagClick = (tag: string) => {
    if (longPressTriggeredRef.current || isManagingSavedTags) {
      longPressTriggeredRef.current = false
      return
    }

    toggleTag(tag)
  }

  const handleDeleteSavedTag = async (tag: string) => {
    setDeletingTag(tag)
    try {
      await onDeleteUserPredefinedTag(tag)
    } finally {
      setDeletingTag(null)
    }
  }

  const handleSave = async () => {
    if (selectedHour === null) return
    setSaving(true)
    await onSave(selectedHour, selectedTags, details)
    setSaving(false)
    setSelectedHour(null)
    setSelectedTags([])
    setDetails('')

    if (selectedHour === 23) {
      setPlanningQuoteIndex(Math.floor(Math.random() * PRODUCTIVE_QUOTES.length))
      setShowNextDayPlannerPrompt(true)
    }
  }

  const openReflectionModal = (kind: ReflectionKind) => {
    setActiveReflectionModal(kind)
    setReflectionQuoteIndex(Math.floor(Math.random() * REFLECTION_QUOTES.length))

    if (kind === 'output') {
      setReflectionTitle(reflection.outputTitle || '')
      setCustomReflectionTitle(
        reflection.outputTitle && !DAY_TITLE_TAGS.includes(reflection.outputTitle) ? reflection.outputTitle : ''
      )
      if (reflectionEditorRef.current) {
        reflectionEditorRef.current.innerHTML = toEditorHtml(reflection.outputContent)
      }
    } else {
      setReflectionTitle(reflection.learningTitle || '')
      setCustomReflectionTitle(
        reflection.learningTitle && !DAY_TITLE_TAGS.includes(reflection.learningTitle) ? reflection.learningTitle : ''
      )
      if (reflectionEditorRef.current) {
        reflectionEditorRef.current.innerHTML = toEditorHtml(reflection.learningContent)
      }
    }
  }

  useEffect(() => {
    if (!activeReflectionModal || !reflectionEditorRef.current) return
    if (activeReflectionModal === 'output') {
      reflectionEditorRef.current.innerHTML = toEditorHtml(reflection.outputContent)
    } else {
      reflectionEditorRef.current.innerHTML = toEditorHtml(reflection.learningContent)
    }
  }, [activeReflectionModal, reflection.learningContent, reflection.outputContent])

  const applyTextFormat = (command: 'bold' | 'italic' | 'hiliteColor') => {
    if (!reflectionEditorRef.current) return
    reflectionEditorRef.current.focus()
    if (command === 'hiliteColor') {
      document.execCommand('hiliteColor', false, '#fde047')
      return
    }
    document.execCommand(command, false)
  }

  const handleSaveReflection = async () => {
    if (!activeReflectionModal || !reflectionEditorRef.current) return

    const finalTitle = normalizeTag(customReflectionTitle || reflectionTitle)
    const contentHtml = reflectionEditorRef.current.innerHTML
    const plainText = stripHtml(contentHtml)

    setReflectionSaving(true)
    try {
      if (activeReflectionModal === 'output') {
        await onSaveReflection({
          outputTitle: finalTitle || null,
          outputContent: plainText ? contentHtml : null
        })
      } else {
        await onSaveReflection({
          learningTitle: finalTitle || null,
          learningContent: plainText ? contentHtml : null
        })
      }
      setActiveReflectionModal(null)
      setReflectionTitle('')
      setCustomReflectionTitle('')
    } finally {
      setReflectionSaving(false)
    }
  }

  const openNextDayPlanner = async () => {
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    await onOpenDate(nextDay)
    setShowNextDayPlannerPrompt(false)
  }

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const activeReflectionLabel = activeReflectionModal === 'output' ? 'Output of Today' : 'Learning / Advice'
  const selectedPlanningQuote = PRODUCTIVE_QUOTES[planningQuoteIndex]
  const selectedReflectionQuote = REFLECTION_QUOTES[reflectionQuoteIndex]
  const existingOutput = stripHtml(reflection.outputContent || '')
  const existingLearning = stripHtml(reflection.learningContent || '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
        <div className="flex items-center justify-between border-b-2 border-zinc-900 bg-zinc-200 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-xl font-bold text-zinc-900 truncate pr-2">
              {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            {isOffline && (
              <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
                </svg>
                Offline
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-2xl font-bold text-zinc-900 hover:text-red-600 flex-shrink-0">
            x
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(90vh-80px)]">
          <div className="w-full md:w-1/3 overflow-y-auto border-r-2 border-zinc-900 bg-zinc-50">
            <div className="p-2">
              {hours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => handleHourClick(hour)}
                  className={`w-full mb-2 p-2 sm:p-3 rounded-lg border-2 border-zinc-900 text-left font-semibold transition-all ${
                    selectedHour === hour
                      ? 'bg-zinc-900 text-white'
                      : entries[hour]?.tags?.length
                        ? 'bg-green-100 text-zinc-900 hover:bg-green-200'
                        : 'bg-white text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm sm:text-base whitespace-nowrap">
                      {hour.toString().padStart(2, '0')}:00 - {((hour + 1) % 24).toString().padStart(2, '0')}:00
                    </span>
                    {entries[hour]?.tags?.length > 0 && (
                      <span className="text-[10px] sm:text-xs bg-zinc-900 text-white px-1.5 sm:px-2 py-1 rounded truncate flex-shrink min-w-0">
                        {entries[hour].tags.length === 1
                          ? entries[hour].tags[0]
                          : entries[hour].tags.length === 2
                            ? `${entries[hour].tags[0]}, ${entries[hour].tags[1]}`
                            : `${entries[hour].tags[0]} +...`}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="border-t-2 border-zinc-900 p-3 space-y-3 bg-white">
              <p className="text-sm font-bold text-zinc-900">Daily Reflection</p>
              <button
                onClick={() => openReflectionModal('output')}
                className="w-full rounded-lg border-2 border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Add Output of Today
              </button>
              <button
                onClick={() => openReflectionModal('learning')}
                className="w-full rounded-lg border-2 border-zinc-900 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
              >
                Add Learning / Advice
              </button>
              {(existingOutput || existingLearning) && (
                <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-3 text-xs text-zinc-700 space-y-2">
                  {existingOutput && <p className="line-clamp-2"><span className="font-semibold">Output:</span> {existingOutput}</p>}
                  {existingLearning && <p className="line-clamp-2"><span className="font-semibold">Learning:</span> {existingLearning}</p>}
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-2/3 overflow-y-auto p-4">
            {selectedHour !== null ? (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900">
                  Select activities for {selectedHour.toString().padStart(2, '0')}:00
                </h3>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-600">Predefined Tags:</p>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-lg border-2 border-zinc-900 font-medium transition-all ${
                          selectedTags.includes(tag) ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900 hover:bg-zinc-100'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-600">One Time Custome Tag:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={oneTimeCustomTag}
                      onChange={(e) => setOneTimeCustomTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addOneTimeCustomTag()
                        }
                      }}
                      placeholder="Enter one-time tag"
                      className="flex-1 h-10 rounded-lg border-2 border-zinc-900 bg-white px-3 text-sm font-medium text-zinc-900 outline-none"
                    />
                    <button
                      onClick={addOneTimeCustomTag}
                      className="px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white font-semibold text-zinc-900 hover:bg-zinc-100"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-600">Add a Predefined Custom Tag:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={predefinedCustomTag}
                      onChange={(e) => setPredefinedCustomTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void addPredefinedCustomTag()
                        }
                      }}
                      placeholder="Enter reusable tag"
                      className="flex-1 h-10 rounded-lg border-2 border-zinc-900 bg-white px-3 text-sm font-medium text-zinc-900 outline-none"
                    />
                    <button
                      onClick={() => void addPredefinedCustomTag()}
                      disabled={addingPredefinedTag}
                      className="px-4 py-2 rounded-lg border-2 border-zinc-900 bg-white font-semibold text-zinc-900 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingPredefinedTag ? 'Saving...' : 'Save Tag'}
                    </button>
                  </div>
                </div>

                {userPredefinedTags.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-zinc-600">Your Saved Tags:</p>
                      {isManagingSavedTags ? (
                        <button onClick={() => setIsManagingSavedTags(false)} className="text-xs font-semibold text-zinc-700 hover:text-zinc-900">
                          Done
                        </button>
                      ) : (
                        <p className="text-xs text-zinc-500">Long press a tag to delete it</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {userPredefinedTags.map((tag) => (
                        <div key={tag} className="relative">
                          <button
                            onClick={() => handleSavedTagClick(tag)}
                            onMouseDown={startLongPress}
                            onMouseUp={clearLongPress}
                            onMouseLeave={clearLongPress}
                            onTouchStart={startLongPress}
                            onTouchEnd={clearLongPress}
                            onTouchCancel={clearLongPress}
                            className={`px-4 py-2 rounded-lg border-2 border-zinc-900 font-medium transition-all ${
                              selectedTags.includes(tag) ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900 hover:bg-zinc-100'
                            } ${isManagingSavedTags ? 'pr-8' : ''}`}
                          >
                            {tag}
                          </button>

                          {isManagingSavedTags && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                void handleDeleteSavedTag(tag)
                              }}
                              disabled={deletingTag === tag}
                              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-zinc-900 bg-red-500 text-sm font-bold text-white shadow-[2px_2px_0_0_#323232] disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Delete ${tag}`}
                            >
                              x
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-zinc-600">Selected Tags:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-zinc-900 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                        >
                          {tag}
                          <button onClick={() => toggleTag(tag)} className="text-red-400 hover:text-red-600 font-bold">
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-600">Additional Details (Optional):</p>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Add any additional details..."
                    rows={3}
                    className="w-full rounded-lg border-2 border-zinc-900 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving || selectedTags.length === 0}
                  className="w-full py-3 rounded-lg border-2 border-zinc-900 bg-zinc-900 text-white font-bold hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : isOffline ? 'Save Locally (Will Sync Later)' : 'Save Entry'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-400">
                <p className="text-center">Select an hour from the left to add or edit activities</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeReflectionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl max-h-[92vh] overflow-auto rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
            <div className="flex items-center justify-between border-b-2 border-zinc-900 bg-zinc-200 p-4">
              <h3 className="text-lg font-bold text-zinc-900">{activeReflectionLabel}</h3>
              <button
                onClick={() => setActiveReflectionModal(null)}
                className="text-xl font-bold text-zinc-900 hover:text-red-600"
              >
                x
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-700">Give this day a title</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {DAY_TITLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setReflectionTitle(tag)
                        setCustomReflectionTitle('')
                      }}
                      className={`rounded-full border-2 border-zinc-900 px-3 py-1 text-xs font-semibold ${
                        reflectionTitle === tag ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900 hover:bg-zinc-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customReflectionTitle}
                  onChange={(e) => {
                    setCustomReflectionTitle(e.target.value)
                    if (e.target.value.trim()) {
                      setReflectionTitle('')
                    }
                  }}
                  placeholder="Or write your own title"
                  className="w-full rounded-lg border-2 border-zinc-900 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-700">Write your note</p>
                <div className="mb-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => applyTextFormat('bold')}
                    className="rounded-lg border-2 border-zinc-900 bg-white px-3 py-1 text-sm font-bold text-zinc-900 hover:bg-zinc-100"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTextFormat('italic')}
                    className="rounded-lg border-2 border-zinc-900 bg-white px-3 py-1 text-sm italic text-zinc-900 hover:bg-zinc-100"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTextFormat('hiliteColor')}
                    className="rounded-lg border-2 border-zinc-900 bg-yellow-200 px-3 py-1 text-sm font-semibold text-zinc-900 hover:bg-yellow-300"
                  >
                    Highlight
                  </button>
                </div>
                <div
                  ref={reflectionEditorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-40 w-full rounded-lg border-2 border-zinc-900 bg-white px-3 py-2 text-sm text-zinc-900 outline-none"
                />
              </div>

              <div className="rounded-lg border-2 border-zinc-900 bg-zinc-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-zinc-900">Inspiring Quote</p>
                  <button
                    onClick={() => setReflectionQuoteIndex((prev) => (prev + 1) % REFLECTION_QUOTES.length)}
                    className="rounded-lg border-2 border-zinc-900 bg-white px-2 py-1 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                  >
                    Next quote
                  </button>
                </div>
                <QuoteCard quote={selectedReflectionQuote} />
              </div>

              <button
                onClick={() => void handleSaveReflection()}
                disabled={reflectionSaving}
                className="w-full rounded-lg border-2 border-zinc-900 bg-zinc-900 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reflectionSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showNextDayPlannerPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232]">
            <div className="border-b-2 border-zinc-900 bg-zinc-200 p-4">
              <h3 className="text-lg font-bold text-zinc-900">Lets plan a productive day for tomorrow</h3>
            </div>
            <div className="space-y-4 p-4">
              <p className="text-sm text-zinc-700">
                You have completed 23:00 - 00:00. Plan your next day now so you can compare planned hours with actual work.
              </p>
              <div className="rounded-lg border-2 border-zinc-900 bg-zinc-100 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-zinc-900">Productive Quote</p>
                  <button
                    onClick={() => setPlanningQuoteIndex((prev) => (prev + 1) % PRODUCTIVE_QUOTES.length)}
                    className="rounded-lg border-2 border-zinc-900 bg-white px-2 py-1 text-xs font-semibold text-zinc-900 hover:bg-zinc-100"
                  >
                    Next quote
                  </button>
                </div>
                <QuoteCard quote={selectedPlanningQuote} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => void openNextDayPlanner()}
                  className="rounded-lg border-2 border-zinc-900 bg-zinc-900 px-4 py-3 text-sm font-bold text-white hover:bg-zinc-800"
                >
                  Lets Add
                </button>
                <button
                  onClick={() => setShowNextDayPlannerPrompt(false)}
                  className="rounded-lg border-2 border-zinc-900 bg-white px-4 py-3 text-sm font-bold text-zinc-900 hover:bg-zinc-100"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
