import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Icon } from "@astryxdesign/core/Icon";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { m } from "@/paraglide/messages";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu
      button={{
        label: m.theme_toggle(),
        icon: <Icon icon={theme === "dark" ? Moon : Sun} />,
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
