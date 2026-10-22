const basePath = import.meta.env.BASE_URL.replace(/\/+$/, '')

export function withBase(path: string): string {
  const pathname = `/${path.replace(/^\/+/, '')}`

  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    return pathname === basePath ? `${basePath}/` : pathname
  }

  return `${basePath}${pathname}`
}

export function getRoutePath(path: string): string {
  const pathname = withBase(path)
  const route = basePath ? pathname.slice(basePath.length) : pathname
  return route.replace(/\/+$/, '') || '/'
}
