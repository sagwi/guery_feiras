export default function Placeholder({ titulo }: { titulo: string }) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="rounded-lg border border-marca-roxo/20 bg-white px-8 py-6 text-center shadow-sm">
        <p className="text-marca-roxo font-semibold">Em breve — {titulo}</p>
      </div>
    </div>
  )
}
