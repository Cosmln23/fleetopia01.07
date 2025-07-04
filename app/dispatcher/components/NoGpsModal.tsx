// app/dispatcher/components/NoGpsModal.tsx
'use client'

import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { useDispatcherStore } from '../state/store'

interface NoGpsModalProps {
  isOpen: boolean
  onClose: () => void
  onContinueWithoutGps: () => void
}

export default function NoGpsModal({ 
  isOpen, 
  onClose, 
  onContinueWithoutGps 
}: NoGpsModalProps) {
  const router = useRouter()
  const { setGpsFallbackAllowed } = useDispatcherStore()

  const handleContinueWithoutGps = () => {
    setGpsFallbackAllowed(true)
    onContinueWithoutGps()
    onClose()
  }

  const handleAddLocation = () => {
    onClose()
    router.push('/fleet')
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1a1a1a] border border-[#363636] rounded-xl p-6 w-full max-w-md z-50 shadow-2xl">
          <Dialog.Title className="text-white text-lg font-bold mb-2">
            No GPS found
          </Dialog.Title>
          
          <Dialog.Description className="text-[#adadad] text-sm mb-6">
            You have no active vehicle location. The Agent can still work but route optimization will be limited.
          </Dialog.Description>

          <div className="flex gap-3">
            <button
              onClick={handleContinueWithoutGps}
              className="flex-1 bg-[#363636] hover:bg-[#4a4a4a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Continue without GPS
            </button>
            
            <button
              onClick={handleAddLocation}
              className="flex-1 bg-white hover:bg-gray-100 text-black px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add location
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-[#adadad] hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none">
                <path
                  d="m11.7816 4.03157c.0824-.07446.0824-.19618 0-.27064L11.4659 3.444c-.0746-.08243-.1962-.08243-.2708 0L7.5 7.1896 3.8047 3.444c-.0746-.08243-.1962-.08243-.2708 0L3.2184 3.76096c-.0824.07446-.0824.19618 0 .27064L7.2289 7.5 3.2184 11.4694c-.0824.0744-.0824.1961 0 .2706l.3155.3165c.0746.0824.1962.0824.2708 0L7.5 8.8104l3.6953 3.7456c.0746.0824.1962.0824.2708 0l.3155-.3165c.0824-.0745.0824-.1962 0-.2706L8.7711 7.5 11.7816 4.03157Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}