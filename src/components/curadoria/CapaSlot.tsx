import { useRef, useState } from 'react'
import { ImageIcon } from 'lucide-react'

/** Slot de capa (visual do image-slot do handoff). Persistência via URL http(s) ou data URL curta. */
export default function CapaSlot({
  value,
  onChange,
  placeholder = 'Arraste a imagem de capa da feira ou clique para escolher',
  height = 150,
  className = '',
}: {
  value: string | null | undefined
  onChange: (url: string | null) => void
  placeholder?: string
  height?: number
  className?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function ingest(file: File | null) {
    setErro(null)
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/avif'].includes(file.type)) {
      setErro('Use PNG, JPEG, WebP ou AVIF.')
      return
    }
    if (file.size > 1_500_000) {
      // ponytail: storage Supabase ainda não; data URL grande estoura o banco — limitar ~1.5MB
      setErro('Imagem muito grande (máx. 1,5 MB). Comprima ou use uma URL.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => setErro('Não foi possível ler a imagem.')
    reader.readAsDataURL(file)
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[14px] ${className}`}
      style={{ height }}
      onDragEnter={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragOver={(e) => {
        e.preventDefault()
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        ingest(e.dataTransfer.files?.[0] ?? null)
      }}
    >
      {value ? (
        <img src={value} alt="" className="h-full w-full object-cover" />
      ) : (
        <button
          type="button"
          className={`flex h-full w-full flex-col items-center justify-center gap-1.5 border-[1.5px] border-dashed px-4 text-center transition ${
            over
              ? 'border-[#c96442] bg-[rgba(201,100,66,.10)]'
              : 'border-black/25 bg-black/[.04]'
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <ImageIcon className="h-7 w-7 text-black/40" />
          <span className="max-w-[90%] text-[13px] font-medium text-black/55">{placeholder}</span>
          <span className="text-[11px] text-black/45">
            ou <u className="underline-offset-2">browse files</u>
          </span>
        </button>
      )}
      {value && (
        <div className="absolute right-2 top-2 flex gap-1.5">
          <button
            type="button"
            className="rounded-md bg-black/65 px-2.5 py-1 text-[11px] text-white backdrop-blur"
            onClick={() => inputRef.current?.click()}
          >
            Trocar
          </button>
          <button
            type="button"
            className="rounded-md bg-black/65 px-2.5 py-1 text-[11px] text-white backdrop-blur"
            onClick={() => onChange(null)}
          >
            Remover
          </button>
        </div>
      )}
      {erro && (
        <p className="absolute bottom-2 left-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[11px] text-[#b3261e]">
          {erro}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          ingest(e.target.files?.[0] ?? null)
          e.target.value = ''
        }}
      />
    </div>
  )
}
