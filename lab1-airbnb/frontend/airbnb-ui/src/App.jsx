import { Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SearchModal from './components/SearchModal'
import { useAuth } from './store'
import './index.css'

export default function App(){
  const [openSearch, setOpenSearch] = useState(false)
  const navigate = useNavigate()
  const me = useAuth(s => s.me)

  useEffect(()=>{ me().catch(()=>{}) },[])

  function handleSearch(params){
    setOpenSearch(false)
    const q = new URLSearchParams(params).toString()
    navigate(`/search?${q}`)
  }

  // Beige background + black text applied here
  return (
    <div className="min-h-screen bg-[#F7F3EE] text-black">
      <Navbar onOpenSearch={()=>setOpenSearch(true)} />
      <SearchModal open={openSearch} onClose={()=>setOpenSearch(false)} onSearch={handleSearch} />
      <main className="min-h-[60vh]">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
