export default function DayCard({ day }) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "16px",
        borderRadius: "10px",
        marginBottom: "16px",
      }}
    >
      <h2>
        {day.day} - {day.date}
      </h2>
      <h3>{day.title}</h3>

      <ul>
        {day.activities.map((act, index) => (
          <li key={index}>
            <strong>{act.time}</strong> - {act.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
