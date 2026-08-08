"use client";

import { Button, type ButtonProps } from "@mantine/core";
import Link from "next/link";

type LinkButtonProps = ButtonProps & {
  href: string;
};

export function LinkButton({ href, ...props }: LinkButtonProps) {
  return <Button component={Link} href={href} {...props} />;
}
