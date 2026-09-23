import type { Metadata } from "next";
import { MANAGEMENT_NAME } from "@/lib/constants/app";

/**
 * Segment parent de /management : un gabarit de titre défini dans la mise en
 * page d'un segment ne s'applique pas aux pages de ce même segment, il doit
 * donc vivre un niveau au-dessus.
 */
export const metadata: Metadata = {
  title: { default: MANAGEMENT_NAME, template: `%s · ${MANAGEMENT_NAME}` },
  robots: { index: false, follow: false },
};

export default function ManagementGroupLayout({ children }: LayoutProps<"/">) {
  return children;
}
