import type { ReactNode } from "react";

export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone-frame">
      <div className="phone-notch" />
      <div className="phone-screen">{children}</div>
    </div>
  );
}
