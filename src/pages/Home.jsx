import { useState } from 'react'
import Hero from '../components/Hero'
import Grid from '../components/Grid'
import SpaceModal from '../components/SpaceModal'
import PurchaseFlow from '../components/PurchaseFlow'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'

export default function Home() {
  const [selectedSpace, setSelectedSpace]     = useState(null) // occupied space → info modal
  const [purchaseSpace, setPurchaseSpace]     = useState(null) // available space → buy modal
  const [showPurchase, setShowPurchase]       = useState(false)

  function openBuy(space) {
    setSelectedSpace(null)
    setPurchaseSpace(space)
    setShowPurchase(true)
  }

  function openInfo(space) {
    setSelectedSpace(space)
  }

  return (
    <>
      <Hero onCTA={() => document.getElementById('grid-section')?.scrollIntoView({ behavior: 'smooth' })} />
      <Grid onSelectAvailable={openBuy} onSelectOccupied={openInfo} />
      <FAQ />
      <Footer />

      {selectedSpace && (
        <SpaceModal
          space={selectedSpace}
          onClose={() => setSelectedSpace(null)}
          onBuy={openBuy}
        />
      )}

      {showPurchase && (
        <PurchaseFlow
          space={purchaseSpace}
          onClose={() => { setShowPurchase(false); setPurchaseSpace(null) }}
        />
      )}
    </>
  )
}
