const SIZE = 132;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GoalRing({ minutes, goal }: { minutes: number; goal: number }) {
  const progress = Math.min(minutes / goal, 1);

  return (
    <div className="flex items-center gap-5 rounded-2xl border border-border bg-card p-5">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          role="img"
          aria-label={`${minutes} of ${goal} minutes spoken today`}
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-muted"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            className="stroke-primary transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-3xl font-bold leading-none">{minutes}</p>
            <p className="mt-1 text-xs text-muted-foreground">of {goal} min</p>
          </div>
        </div>
      </div>
      <div>
        <h2 className="font-semibold">Daily goal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Minutes you&apos;ve spoken Chinese today.
        </p>
      </div>
    </div>
  );
}
