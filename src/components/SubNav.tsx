import type { LucideIcon } from "lucide-react";

interface Tab {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  right?: React.ReactNode;
}

export function SubNav({ tabs, active, onChange, right }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-border -mx-6 px-6 mb-6">
      <div className="flex items-center gap-0.5">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
              active === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  );
}
