import React, { useState } from "react"

import factoryManagerMD from "../../assets/user_manual/factory_manager.md?raw"
import storeManagerMD from "../../assets/user_manual/store_manager.md?raw"

import loginMD from "../../assets/user_manual/common/login.md?raw"
import profileInfoMD from "../../assets/user_manual/common/profile_info.md?raw"
import recoverAccountMD from "../../assets/user_manual/common/recover_account.md?raw"
import generalNavigation from "../../assets/user_manual/common/general_navigation.md?raw"
import massive from "../../assets/user_manual/common/massive.md?raw"
import exportData from "../../assets/user_manual/common/export_data.md?raw"

const images = import.meta.glob(
  "../../assets/user_manual/imgs/*",
  { 
    eager: true,
    import: "default"
  }
) as Record<string, string>

import useAuth from "../../hooks/useAuth"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

const allManuals: Record<string, string> = {
  "factory_manager": factoryManagerMD,
  "store_manager": storeManagerMD,
  "general_navigation": generalNavigation,
  "login": loginMD,
  "profile_info": profileInfoMD,
  "recover_account": recoverAccountMD,
  "massive": massive,
  "export_data": exportData,
}

export default function UserManual() {
  const { user } = useAuth()
  const currentRole = user?.role || ""

  const defaultKey = currentRole == "Factory manager" ? "factory_manager" : "store_manager"
  const [selectedManual, setSelectedManual] = useState<string>(defaultKey)

  const displayHomeButton = selectedManual != defaultKey && (
    <div className="mb-4 pb-2 border-b flex gap-4">
      <button 
        onClick={() => setSelectedManual(defaultKey)}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        Volver al inicio del manual
      </button>
    </div>
  )

  const content = allManuals[selectedManual] || "# Bienvenido\nNo se encontró el manual solicitado."

  return (
    <div className="p-6 w-full rounded-lg shadow-md bg-white/90">      
      {displayHomeButton}
      <article className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: renderHeading("h1"),
            h2: renderHeading("h2"),
            h3: renderHeading("h3"),
            h4: renderHeading("h4"),
            h5: renderHeading("h5"),
            h6: renderHeading("h6"),
            img: ({ node, src, alt, ...props }) => {
              const imageName = src?.split("/").pop()              
              const matchedKey = Object.keys(images).find(key => key.endsWith(imageName || ""))
              const finalSrc = matchedKey ? images[matchedKey] : src

              return (
                <img 
                  src={finalSrc} 
                  alt={alt} 
                  {...props} 
                  className="rounded-lg shadow-md max-w-full h-auto my-4 border dark:border-gray-700" 
                />
              )
            },
            a: ({ node, href, children, ...props }) => {
              if (href?.endsWith(".md")) {
                return (
                  <a 
                    href={href}
                    onClick={(e) => {
                      e.preventDefault()
                      const cleanName = href.split("/").pop()?.replace(".md", "")
                      if (cleanName && allManuals[cleanName]) {
                        setSelectedManual(cleanName)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      } else {
                        console.warn("El manual no existe en el registro:", cleanName)
                      }
                    }}
                    {...props}
                    className="text-blue-500 underline cursor-pointer font-medium"
                  >
                    {children}
                  </a>
                )
              }

              if (href?.startsWith("#")) {
                return (
                  <a 
                    href={href}
                    onClick={(e) => {
                      e.preventDefault()
                      const element = document.querySelector(href)
                      if (element) {
                        const navHeight = 64
                        const elementPosition = element.getBoundingClientRect().top + window.scrollY

                        window.scrollTo({ 
                          top: elementPosition - navHeight, 
                          behavior: "smooth" 
                        })
                      }
                    }}
                    {...props}
                    className="text-blue-500 underline cursor-pointer"
                  >
                    {children}
                  </a>
                )
              }

              return (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              )
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </div>
  )
}

const extractText = (node: React.ReactNode): string => {
  if (typeof node == "string") return node
  if (typeof node == "number") return node.toString()
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    return extractText(element.props.children)
  }
  return ""
}

const cleanReactNodes = (node: React.ReactNode): React.ReactNode => {
  if (typeof node == "string") {
    return node.replace(/<!--[\s\S]*?-->/g, "")
  }
  if (Array.isArray(node)) {
    return node.map(cleanReactNodes)
  }
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<{ children?: React.ReactNode }>
    return React.cloneElement(
      element,
      element.props,
      cleanReactNodes(element.props.children)
    )
  }
  return node
}

const generateId = (node: React.ReactNode) => {
  const text = extractText(node).replace(/<!--[\s\S]*?-->/g, "").trim()
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
}

const renderHeading = (Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => {
  return ({ children, ...props }: { children?: React.ReactNode }) => {
    return (
      <Tag id={generateId(children)} {...props}>
        {cleanReactNodes(children)}
      </Tag>
    )
  }
}
