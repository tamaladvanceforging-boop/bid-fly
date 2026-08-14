import type { BidFlyAPI } from '../preload/preload'

declare global {
  interface Window {
    bidfly: BidFlyAPI
  }
}

export {}
