export default function Faq({ items }) {
  if (!items?.length) return null

  return (
    <div className="fr-faq">
      {items.map((item) => (
        <details className="fr-faq-item" key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
