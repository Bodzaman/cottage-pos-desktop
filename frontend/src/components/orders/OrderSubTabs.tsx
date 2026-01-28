interface SubTab {
  value: string;
  label: string;
}

interface OrderSubTabsProps {
  tabs: SubTab[];
  activeTab: string;
  onChange: (value: string) => void;
}

export function OrderSubTabs({ tabs, activeTab, onChange }: OrderSubTabsProps) {
  return (
    <div className="flex gap-1.5 mt-2">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeTab === tab.value
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-gray-400 hover:text-gray-300 hover:bg-white/5 border border-transparent'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
