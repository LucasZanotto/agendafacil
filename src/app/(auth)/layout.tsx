import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-lg font-bold">
          <Image src="/logo.svg" alt="" width={36} height={36} className="h-9 w-9" /> AgendaFácil
        </Link>
        {children}
      </div>
    </div>
  )
}
