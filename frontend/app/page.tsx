'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Root() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('token')
    router.push(token ? '/dashboard' : '/login')
  }, [router])
  return <div className="flex items-center justify-center h-full text-gray-400">Carregando...</div>
}
