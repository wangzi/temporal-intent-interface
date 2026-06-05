// SSR site footer. Server component — renders as part of the SSR'd HTML.

export function Footer(_props: {
  entryCount?: number;
  updatedISO?: string | null;
}) {
  return (
    <footer className="site-footer mono" aria-label="Site footer">
      <span className="site-footer-est">Est. 2021</span>
    </footer>
  );
}
