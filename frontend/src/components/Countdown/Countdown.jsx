export default function Countdown({ targetDate }) {
  if (!targetDate) {
    return (
      <section className="countdown">
        <h2>العد التنازلي</h2>
        <p>يُحدَّد تاريخ الفعالية لاحقًا.</p>
      </section>
    );
  }

  // Countdown logic can be connected once the official event date is confirmed.
  return (
    <section className="countdown">
      <h2>العد التنازلي</h2>
      <p>{targetDate}</p>
    </section>
  );
}
