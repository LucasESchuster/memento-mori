"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const VALID_ID = /^[a-z0-9]+$/;

// Pages that carry a secret token in the URL (e.g. /edit?token=<unsubscribeToken>).
// Session-replay tools capture the full page URL, including query strings, so
// loading Clarity here would ship a password-equivalent token (edit + cancel +
// delete capability) to a third party. Never load analytics on these routes.
const TOKENIZED_PATHS = ["/edit"];

export default function Clarity() {
  const pathname = usePathname();
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  if (!projectId || !VALID_ID.test(projectId)) {
    return null;
  }

  const onTokenizedPath = TOKENIZED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (onTokenizedPath) {
    return null;
  }

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${projectId}");`}
    </Script>
  );
}
