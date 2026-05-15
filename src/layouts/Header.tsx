import { Button, ThemeButton } from "../components/Button";
import { User2, Menu } from "lucide-react"
import useSidebar from "../hooks/useSidebar";

export default function Header() {
  const { hasSidebar, setActiveSidebar, activeSidebar } = useSidebar()

  return (
    <header className="sticky top-0 flex flex-col">
      <section className="border-b mx-auto flex w-full max-w-7xl items-center justify-between p-1 h-header-h">
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
      </section>
    </header>
  )
}

function Profile() {
  return (
    <Button className="flex flex-row gap-2">
      <User2 />
      {"{username}"}
    </Button>
  )
}
