export default function DayTotals({ totals, goals, embed }) {
  if (!totals) return null;
  const hasAny = totals.calories > 0 || totals.protein > 0 || totals.carbs > 0 || totals.fat > 0;
  if (!hasAny) return null;

  const hasGoals = goals && (goals.goal_calories != null || goals.goal_protein != null || goals.goal_carbs != null || goals.goal_fat != null);

  const renderMacro = (key, value, label, unit = 'g', goal = null) => {
    const displayValue = key === 'calories' ? Math.round(value) : value.toFixed(1);
    const displayGoal = goal != null ? (key === 'calories' ? Math.round(goal) : goal) : null;
    return (
      <div key={key} className={`macro-item ${key}`}>
        <div className="value">
          {displayValue}{key !== 'calories' ? unit : ''}
          {displayGoal != null && (
            <span className="macro-goal"> / {displayGoal}{key !== 'calories' ? unit : ''}</span>
          )}
        </div>
        <div className="label">{label}</div>
      </div>
    );
  };

  const grid = (
    <div className="macro-grid">
      {renderMacro('calories', totals.calories, 'Calories', '', goals?.goal_calories)}
      {renderMacro('protein', totals.protein, 'Protein', 'g', goals?.goal_protein)}
      {renderMacro('carbs', totals.carbs, 'Carbs', 'g', goals?.goal_carbs)}
      {renderMacro('fat', totals.fat, 'Fat', 'g', goals?.goal_fat)}
      <div className="macro-item fiber">
        <div className="value">{totals.fiber.toFixed(1)}g</div>
        <div className="label">Fiber</div>
      </div>
    </div>
  );

  if (embed) return grid;
  return (
    <div className="card">
      <div className="card-header">
        <h2>Totals for the day{hasGoals ? ' vs goals' : ''}</h2>
      </div>
      {grid}
    </div>
  );
}
