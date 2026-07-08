"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useConsent } from "@/components/ConsentProvider";

const VALID_ID = /^[a-z0-9]+$/;
const SCRIPT_ID = "ms-clarity";

// Pages that carry a secret token in the URL (e.g. /edit?token=<unsubscribeToken>).
// Session-replay tools capture the full page URL, including query strings, so
// loading Clarity here would ship a password-equivalent token (edit + cancel +
// delete capability) to a third party. Never load analytics on these routes.
const TOKENIZED_PATHS = ["/edit"];

export default function Clarity() {
  const pathname = usePathname();
  const { consent } = useConsent();
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  const onTokenizedPath = TOKENIZED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Inject the Clarity loader imperatively once consent is granted. We don't use
  // next/script here: its afterInteractive strategy is unreliable for a tag that
  // only mounts after a client-side state change (the LGPD consent click), so the
  // script could silently never load. A DOM injection keyed on consent is
  // deterministic and only ever runs after an explicit opt-in.
  useEffect(() => {
    if (!projectId || !VALID_ID.test(projectId)) return;
    if (consent !== "granted") return;
    if (onTokenizedPath) return;
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "text/javascript";
    script.innerHTML = `(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${projectId}");`;
    document.head.appendChild(script);
  }, [projectId, consent, onTokenizedPath]);

  return null;
}
