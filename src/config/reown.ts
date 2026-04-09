import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum, AppKitNetwork } from '@reown/appkit/networks'

// 1. Get projectId from https://cloud.reown.com
export const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || 'b5681e42341851a79573fbc2a297610d'

// 2. Create a metadata object
const metadata = {
  name: 'Verse Scavenger Hunt',
  description: 'Join the ultimate adventure platform',
  url: 'https://verse.app',
  icons: ['https://i.ibb.co/DHd07RDx/logo.png']
}

// 3. Create the networks
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum]

// 4. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
})

// 5. Create modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: []
  }
})
