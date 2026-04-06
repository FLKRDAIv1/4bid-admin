import { Inter } from "next/font/google";
import "./globals.css";
import AdminLayoutClient from "@/components/AdminLayoutClient";
import { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

/*
560 FILES WERE SEARCHED.

*   **Login Page Repair**: Fixed a syntax error in `admin/src/app/login/page.tsx` where an `<input>` tag was accidentally broken during localization.
*   **Users Page Repair**: Fixed a syntax error in `admin/src/app/users/page.tsx` where functions were incorrectly nested due to missing braces.

---

#### **0. Phase 16.0: Layout Refactoring**
*   **Metadata Fix**: Successfully refactored the `layout.tsx` to separate Server and Client logic.
    *   **Server Side**: `layout.tsx` is now a Server Component that handles metadata and SEO.
    *   **Client Side**: Created `AdminLayoutClient.tsx` to handle the sidebar, header, authentication persistence, and RTL/localization.
*   **Performance**: Improved hydration by moving hook-heavy logic into its own component.

---

#### **0. Phase 17.0: Advanced Admin Security**
*   **Two-Step Authentication**:
    *   **Step 1**: Login restricted to `flkrdstudio@gmail.com` / `121212148790`.
    *   **Step 2**: Mandatory security question: "What is your favorite color?" (Answer: `red and white`).
*   **Refresh Protection**:
    *   Implemented a custom security overlay that triggers on every page refresh.
    *   Requires PIN `1186` to unlock the dashboard.
*   **Session Persistence**:
    *   The primary login session is stored in `localStorage`, so users won't be logged out, but the PIN is always required for visual access after a refresh.

---

#### **0. Phase 18.0: Logistics & User Extension**
*   **Enhanced User Creation**: The "Add User" form in the admin panel now includes fields for **Email**, **Full Name**, **Username**, **Phone Number**, and **City (Location)**.
*   **Professional Map Integration**:
    *   Replaced the placeholder in the Orders page with a live **OpenStreetMap** view.
    *   Applied a professional dark-mode style to the map for a premium admin feel.
    *   Integrated dynamic markers that bounce and display the user's phone number above their location.

---

#### **0. Phase 19.0: Approval & Paste Fixes**
*   **Robust Paste Support**:
    *   **Admin PIN**: You can now copy and paste the `1186` PIN even with accidental leading/trailing spaces. The field now auto-verifies upon pasting.
    *   **Security Question**: The "Favorite Color" answer (`red and white`) now handles spaces and cases more gracefully during paste.
*   **Order Approval Improvements**:
    *   Updated the "Finish Order" button label to **"Approve & Paid (فەرمانی تەواو)"** for better clarity in the logistics flow.
*   **iOS OTP Optimization**:
    *   Enhanced the 8-digit OTP field in the app with `textContentType(.oneTimeCode)` to support iOS "Paste" and "Auto-fill from SMS" more reliably.
*/
export const metadata: Metadata = {
  title: "4bid Admin Panel",
  description: "Live Auction & E-Commerce Dashboard",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.jpg", sizes: "180x180", type: "image/jpeg" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ku" dir="rtl" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0F1115] text-white`} suppressHydrationWarning>
        <AdminLayoutClient>
          {children}
        </AdminLayoutClient>
      </body>
    </html>
  );
}
