import Sidebar from './Sidebar'

function Layout({ children, dark, setDark }) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar dark={dark} setDark={setDark} />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}

export default Layout