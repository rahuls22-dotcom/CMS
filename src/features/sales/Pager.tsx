import { useEffect, useState } from 'react'

export const SALES_PAGE_SIZE = 10

/** Paging for the sales lists. `resetKey` is whatever the filters are — when it
 *  changes the list goes back to page 1, so a filter never lands on an empty page. */
export function usePager<T>(rows: T[], resetKey: string) {
  const [page, setPage] = useState(1)
  useEffect(() => { setPage(1) }, [resetKey])

  const pages = Math.max(1, Math.ceil(rows.length / SALES_PAGE_SIZE))
  const current = Math.min(page, pages)
  const start = (current - 1) * SALES_PAGE_SIZE
  return {
    current,
    pages,
    setPage,
    slice: rows.slice(start, start + SALES_PAGE_SIZE),
    from: rows.length ? start + 1 : 0,
    to: Math.min(start + SALES_PAGE_SIZE, rows.length),
  }
}

export function Pager({
  current, pages, total, from, to, noun, onPage, children,
}: {
  current: number
  pages: number
  total: number
  from: number
  to: number
  noun: string
  onPage: (p: number) => void
  children?: React.ReactNode
}) {
  return (
    <div className="row gap12" style={{ padding: '10px 14px', borderTop: '1px solid var(--divider)', flexWrap: 'wrap' }}>
      {children}
      <span className="spacer" />
      <span className="muted">
        {total ? <>Showing <b>{from}–{to}</b> of {total} {noun}</> : <>No {noun}</>}
        {pages > 1 ? <> · page {current} of {pages}</> : null}
      </span>
      <button className="btn" disabled={current <= 1} onClick={() => onPage(current - 1)}>Prev</button>
      <button className="btn" disabled={current >= pages} onClick={() => onPage(current + 1)}>Next</button>
    </div>
  )
}
