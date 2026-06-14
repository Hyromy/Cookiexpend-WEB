import { Button, ThemeButton } from "../components/Button";
import { User2, Menu } from "lucide-react"
import useSidebar from "../hooks/useSidebar";
import useAuth from "../hooks/useAuth";

export default function Header() {
  const { hasSidebar, setActiveSidebar, activeSidebar } = useSidebar()

  return (
    <header className="sticky top-0 flex flex-col bg-card">
      <section className="border-b border-muted p-1 h-header-h">
        <div className="flex mx-auto w-full max-w-7xl items-center justify-between">
          <div>
            {hasSidebar && (
              <Button
                className="lg:hidden p-1 -ml-1 rounded-md"
                onClick={() => setActiveSidebar(activeSidebar != "navigation" ? "navigation" : null)}
              >
                <Menu />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Profile />
            <ThemeButton />
          </div>
        </div>
      </section>
    </header>
  )
}

function Profile() {
  const { user } = useAuth()
  return (
    <Button className="flex flex-row gap-2">
      <User2 />
      {user?.username}
    </Button>
  )
}
