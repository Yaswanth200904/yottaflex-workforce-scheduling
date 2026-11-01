import { Link } from 'react-router-dom'
import { buttonStyles } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-[560px] flex-col items-center justify-center text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/45">404 · Page not found</p>
      <h1 className="mt-1 text-[20px] font-semibold">This page is not part of WorkforceOS</h1>
      <p className="mt-1 max-w-[380px] text-[11.5px] leading-5 text-ink/55">The address may be outdated, or the page may have moved.</p>
      <Link to="/" className={buttonStyles({ variant: 'primary', className: 'mt-4' })}>Return to overview</Link>
    </div>
  )
}
