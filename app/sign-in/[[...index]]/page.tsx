import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a]">
      <SignIn />
    </div>
  )
}