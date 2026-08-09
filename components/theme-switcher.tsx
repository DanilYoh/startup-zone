"use client";

import {
  ActionIcon,
  type MantineColorScheme,
  Menu,
  MenuDropdown,
  MenuItem,
  MenuTarget,
  useMantineColorScheme,
} from "@mantine/core";
import { Check, Laptop, Moon, Sun, SunMoon } from "lucide-react";
import styles from "./theme-switcher.module.css";

const themes: ReadonlyArray<{
  value: MantineColorScheme;
  label: string;
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "auto", label: "System", icon: Laptop },
];

const ThemeSwitcher = () => {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Menu position="bottom-end" shadow="md" width={160}>
      <MenuTarget>
        <ActionIcon
          variant="subtle"
          size="lg"
          className={styles.darkSurfaceControl}
          aria-label="Choose color theme"
        >
          <SunMoon size={18} aria-hidden="true" />
        </ActionIcon>
      </MenuTarget>
      <MenuDropdown>
        {themes.map(({ value, label, icon: Icon }) => (
          <MenuItem
            key={value}
            leftSection={<Icon size={16} aria-hidden="true" />}
            rightSection={
              colorScheme === value ? <Check size={14} aria-hidden="true" /> : undefined
            }
            role="menuitemradio"
            aria-checked={colorScheme === value}
            onClick={() => setColorScheme(value)}
          >
            {label}
          </MenuItem>
        ))}
      </MenuDropdown>
    </Menu>
  );
};

export { ThemeSwitcher };
