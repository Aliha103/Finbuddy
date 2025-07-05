/* main.jsx */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

import './index.css'
import App from './App.jsx'
import { AppInitService } from './services/app-init'

// Initialize global error handlers
AppInitService.setupGlobalErrorHandlers()

// Initialize application services
AppInitService.initialize().then(() => {
  console.log('🚀 FinBuddy services initialized')
}).catch(error => {
  console.error('Failed to initialize services:', error)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RecoilRoot>
      <BrowserRouter basename="/Finbuddy">
        <App />
      </BrowserRouter>
    </RecoilRoot>
  </StrictMode>,
)
