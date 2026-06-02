'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Root() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('token')
    router.push(token ? '/dashboard' : '/landing')
  }, [router])
  return <div className="flex items-center justify-center h-full" style={{ color: '#64748b', fontSize: 14 }}>Carregando...</div>
}
