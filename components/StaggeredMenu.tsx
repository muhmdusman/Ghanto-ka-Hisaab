'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuItem {
  label: string
  href?: string
  onClick?: () => void
}

interface StaggeredMenuProps {
  items: MenuItem[]
  position?: 'left' | 'right'
  colors?: string[]
  menuButtonColor?: string
  accentColor?: string
}

export default function StaggeredMenu({
  items,
  position = 'right',
  colors = ['#f8fafc', '#e7edf3', '#111827'],
  menuButtonColor = '#111827',
  accentColor = '#0f766e'
}: StaggeredMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const overlayRefs = useRef<HTMLDivElement[]>([])
  const menuItemsRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (isOpen) {
      gsap.to(overlayRefs.current, {
        x: 0,
        duration: 0.34,
        stagger: 0.045,
        ease: 'power3.out'
      })

      if (menuItemsRef.current) {
        gsap.fromTo(
          menuItemsRef.current.children,
          { y: 24, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.26, stagger: 0.045, delay: 0.12, ease: 'power2.out' }
        )
      }
    } else {
      gsap.to(overlayRefs.current, {
        x: position === 'right' ? '100%' : '-100%',
        duration: 0.24,
        stagger: { each: 0.03, from: 'end' },
        ease: 'power3.in'
      })
    }
  }, [isOpen, position])

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsOpen(false)
      prevPathname.current = pathname
    }
  }, [pathname])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      const timer = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 100)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return (
    <>
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="fixed left-4 top-4 z-[60] inline-flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 shadow-[0_14px_40px_rgba(24,24,27,0.14)] backdrop-blur transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white active:translate-y-0"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <span className="grid size-9 place-items-center overflow-hidden rounded-xl bg-zinc-950">
          <Image src="/logo.png" alt="" width={28} height={28} className="size-7 object-contain" priority />
        </span>
        <span className="hidden text-sm font-black tracking-tight text-zinc-950 sm:inline">Menu</span>
        <span className="flex h-5 w-5 flex-col justify-center gap-1.5" aria-hidden="true">
          <span
            className={`block h-0.5 w-5 rounded-full transition-all duration-300 ${isOpen ? 'translate-y-2 rotate-45' : ''}`}
            style={{ backgroundColor: menuButtonColor }}
          />
          <span
            className={`block h-0.5 w-5 rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}
            style={{ backgroundColor: menuButtonColor }}
          />
          <span
            className={`block h-0.5 w-5 rounded-full transition-all duration-300 ${isOpen ? '-translate-y-2 -rotate-45' : ''}`}
            style={{ backgroundColor: menuButtonColor }}
          />
        </span>
      </button>

      <div
        ref={menuRef}
        className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`}
        style={{ display: isOpen ? 'block' : 'none' }}
      >
        {colors.map((color, index) => (
          <div
            key={index}
            ref={(el) => {
              if (el) overlayRefs.current[index] = el
            }}
            className={`absolute inset-0 ${position === 'right' ? 'translate-x-full' : '-translate-x-full'}`}
            style={{ backgroundColor: color, zIndex: 50 + index, willChange: 'transform' }}
          />
        ))}

        <div
          className={`absolute inset-0 flex flex-col px-6 pb-8 pt-28 sm:px-10 md:px-16 ${
            isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
          }`}
          style={{ zIndex: 50 + colors.length }}
        >
          <div className="mb-10 flex items-center gap-4">
            <div className="grid size-14 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
              <Image src="/logo.png" alt="Ghanto ka Hisaab" width={44} height={44} className="size-11 object-contain" priority />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">Ghanto ka Hisaab</p>
              <p className="mt-1 text-sm font-medium text-zinc-300">Choose a workspace</p>
            </div>
          </div>

          <nav ref={menuItemsRef} className="space-y-1">
            {items.map((item, index) => {
              const isActive = item.href === pathname
              const row = (
                <div className="group flex items-center gap-4 rounded-2xl px-1 py-2 transition hover:bg-white/5 sm:gap-5 sm:px-3">
                  <span className="w-8 font-mono text-xs font-bold text-zinc-500 sm:w-10">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-3xl font-black tracking-tight transition-colors duration-200 sm:text-5xl ${
                      isActive ? 'text-white' : 'text-zinc-400 group-hover:text-white'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <span
                      className="ml-auto hidden h-2.5 w-2.5 rounded-full sm:block"
                      style={{ backgroundColor: accentColor, boxShadow: `0 0 24px ${accentColor}` }}
                    />
                  )}
                </div>
              )

              if (item.href) {
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block ${isOpen ? 'visible' : 'invisible'}`}
                  >
                    {row}
                  </Link>
                )
              }

              return (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick?.()
                    setIsOpen(false)
                  }}
                  className={`block w-full text-left ${isOpen ? 'visible' : 'invisible'}`}
                >
                  {row}
                </button>
              )
            })}
          </nav>

          <div className={`mt-auto border-t border-white/10 pt-6 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'} transition-opacity delay-300 duration-300`}>
            <p className="max-w-sm text-sm leading-6 text-zinc-400">
              A calmer workspace for hours, attendance, and daily review.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
