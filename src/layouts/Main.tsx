import { Outlet } from 'react-router-dom'

import Header from './Header'
import Footer from './Footer'
import Aside from './Aside'
import useSidebar from '../hooks/useSidebar'
import { useEffect } from 'react'
import { OffCanvas } from '../components/OffCanvas'

export default function Main() {
  const { setHasSidebar, activeSidebar, setActiveSidebar } = useSidebar()

  useEffect(() => {
    setHasSidebar(true)
    return () => setHasSidebar(false)
  }, [setHasSidebar])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex flex-1 max-w-7xl mx-auto w-full">
        <div className="hidden lg:block">
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
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
