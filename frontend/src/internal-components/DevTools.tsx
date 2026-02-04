import { useEffect } from "react";
// Dev components were removed - creating stubs
// import { MessageEmitter } from "../dev-components/Beacon";
// import { InternalErrorBoundary } from "../dev-components/InternalErrorBoundary";
// import { UserErrorBoundary } from "../dev-components/UserErrorBoundary";

// Stubs for removed components
const MessageEmitter = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const InternalErrorBoundary = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const UserErrorBoundary = ({ children }: { children: React.ReactNode }) => <>{children}</>;

interface Props {
  children: React.ReactNode;
  shouldRender: boolean;
}

function logReason(event: PromiseRejectionEvent) {
  console.error(event?.reason);
}

/**
 * Render extra dev tools around the app when in dev mode,
 * but only render the app itself in prod mode
 */
export const DevTools = ({ children, shouldRender }: Props) => {
  useEffect(() => {
    if (shouldRender) {
      window.addEventListener("unhandledrejection", logReason);

      return () => {
        window.removeEventListener("unhandledrejection", logReason);
      };
    }
  }, [shouldRender]);

  if (shouldRender) {
    return (
      <InternalErrorBoundary>
        <UserErrorBoundary>
          <MessageEmitter>{children}</MessageEmitter>
        </UserErrorBoundary>
      </InternalErrorBoundary>
    );
  }

  return <>{children}</>;
};
