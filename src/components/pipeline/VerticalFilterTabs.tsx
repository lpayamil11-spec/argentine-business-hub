import { useCrmStore } from "@/store/useCrmStore";

interface Props {
  value: string | null;
  onChange: (v: string | null) => void;
}

export function VerticalFilterTabs({ value, onChange }: Props) {
  const verticals = useCrmStore((s) => s.verticals);
  const leads = useCrmStore((s) => s.leads);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 text-sm rounded-full border whitespace-nowrap transition-colors ${
          value === null ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-accent"
        }`}
      >
        Todas <span className="opacity-60 ml-1">{leads.length}</span>
      </button>
      {verticals.map((v) => {
        const count = leads.filter((l) => l.verticalId === v.id).length;
        const active = value === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onChange(v.id)}
            className={`px-3 py-1.5 text-sm rounded-full border whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              active ? "border-primary" : "border-border hover:bg-accent"
            }`}
            style={active ? { backgroundColor: `${v.color}25`, color: v.color, borderColor: v.color } : undefined}
          >
            <span>{v.icon}</span>
            <span>{v.name}</span>
            <span className="opacity-60">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
