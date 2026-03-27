import { AppHeader } from '@web-tools/ui'

function HashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4"  y1="9"  x2="20" y2="9" />
      <line x1="4"  y1="15" x2="20" y2="15" />
      <line x1="10" y1="3"  x2="8"  y2="21" />
      <line x1="16" y1="3"  x2="14" y2="21" />
    </svg>
  )
}

export function Header() {
  return <AppHeader toolName="Hash Pro Tool" toolIcon={<HashIcon />} />
}
