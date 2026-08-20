import { useEffect, useState } from "react";

function diff(target: string) {
  const ms = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: ms === 0,
  };
}

export function Countdown({ target, compact }: { target: string; compact?: boolean }) {
  const [time, setTime] = useState(() => diff(target));

  useEffect(() => {
    setTime(diff(target));
    const id = setInterval(() => setTime(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Minutes", value: time.minutes },
    { label: "Seconds", value: time.seconds },
  ];

  if (compact) {
    return (
      <span className="font-display text-gold-deep font-semibold tabular-nums">
        {time.days}d : {String(time.hours).padStart(2, "0")}h :{" "}
        {String(time.minutes).padStart(2, "0")}m : {String(time.seconds).padStart(2, "0")}s
      </span>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {cells.map((cell) => (
        <div
          key={cell.label}
          className="border-gold/40 min-w-[4.5rem] rounded-xl border bg-primary-foreground/10 px-4 py-3 text-center backdrop-blur"
        >
          <div className="font-display text-gold-light text-2xl font-bold tabular-nums sm:text-3xl">
            {String(cell.value).padStart(2, "0")}
          </div>
          <div className="text-[0.65rem] tracking-widest text-primary-foreground/70 uppercase">
            {cell.label}
          </div>
        </div>
      ))}
    </div>
  );
}