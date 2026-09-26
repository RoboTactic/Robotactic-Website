export default function CTA({ title, children }) {
  return (
    <section className="cta">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
