import { Outlet } from 'react-router-dom'

import Header from './Header'
import Footer from './Footer'
import Aside from './Aside'
import useSidebar from '../hooks/useSidebar'
import { useEffect } from 'react'
import { OffCanvas } from '../components/OffCanvas'
import useApi from '../hooks/useApi'
import { authService } from '../services/cookiexpend'

export default function Main() {
  const { setHasSidebar, activeSidebar, setActiveSidebar } = useSidebar()
  const { request } = useApi()

  useEffect(() => {
    setHasSidebar(true)
    return () => setHasSidebar(false)
  }, [setHasSidebar])

  useEffect(() => {
    request(authService.me())
  }, [request])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex flex-1 max-w-7xl mx-auto w-full">
        <div className="hidden lg:block w-72">
          <Aside />
        </div>
        <div className="lg:hidden">
          <OffCanvas
            isOpen={activeSidebar == "navigation"}
            onClose={() => setActiveSidebar(null)}
            position="l"
            title="Navegación"
          >
            <Aside closeCanvas={() => setActiveSidebar(null)} />
          </OffCanvas>
        </div>
        <div className="flex flex-col w-full">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
