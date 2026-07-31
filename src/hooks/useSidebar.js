import { useState } from "react";
import { getSavedSidebarState, saveSidebarState } from "../utils/storage.js";

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(getSavedSidebarState());
  const [mobileOpen, setMobileOpen] = useState(false); // overlay drawer, phone widths

  function toggle() {
    setCollapsed(c => { const next = !c; saveSidebarState(next); return next; });
  }

  function toggleMobile() { setMobileOpen(o => !o); }
  function closeMobile()  { setMobileOpen(false); }

  return { collapsed, toggle, mobileOpen, toggleMobile, closeMobile };
}
