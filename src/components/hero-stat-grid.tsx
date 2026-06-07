type HeroStat = {
  accentClassName: string;
  label: string;
  value: string | number;
};

type HeroStatGridProps = {
  stats: HeroStat[];
};

export function HeroStatGrid({ stats }: HeroStatGridProps) {
  return (
    <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(8.75rem,1fr))] gap-4">
      {stats.map((stat) => (
        <div className={`min-w-0 border-l-2 pl-4 ${stat.accentClassName}`} key={stat.label}>
          <p className="text-2xl font-black leading-tight">{stat.value}</p>
          <p className="mt-1 text-sm leading-5 text-[#c8d8d0]">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
