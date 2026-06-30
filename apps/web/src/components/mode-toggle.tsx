import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Icon } from "@astryxdesign/core/Icon";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { m } from "@/paraglide/messages";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const SunIcon = () => <Sun className="h-5 w-5" />;
  const MoonIcon = () => <Moon className="h-5 w-5" />;
  const ThemeIcon = theme === "dark" ? MoonIcon : SunIcon;

  return (
    <DropdownMenu
      button={{
        label: m.theme_system(),
        icon: <Icon icon={ThemeIcon} />,
        variant: "ghost",
        isIconOnly: true,
      }}
      hasChevron={false}
      items={[
        { label: m.theme_light(), onClick: () => setTheme("light") },
        { label: m.theme_dark(), onClick: () => setTheme("dark") },
        { label: m.theme_system(), onClick: () => setTheme("system") },
      ]}
    />
  );
}
