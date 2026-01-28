import { RouterProvider } from "react-router-dom";
import { Head } from "./internal-components/Head";
import { OuterErrorBoundary } from "./prod-components/OuterErrorBoundary";
import { router } from "./router";
import { ThemeProvider } from "./internal-components/ThemeProvider";
import { DEFAULT_THEME } from "./constants/default-theme";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import { OfflineNotice } from "./components/OfflineNotice";


export const AppWrapper = () => {
  return (
    <OuterErrorBoundary>
      <ThemeProvider defaultTheme={DEFAULT_THEME}>
        <OfflineNotice />
        <RouterProvider router={router} />
        <Head />
        <CookieConsentBanner />
      </ThemeProvider>
    </OuterErrorBoundary>
  );
};