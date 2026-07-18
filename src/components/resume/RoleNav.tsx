// Role-view switcher. Deliberately a set of plain <a> links, not a client
// component: the whole adaptive layer is server-rendered, so it works with
// JavaScript disabled, is crawlable, and needs no hydration.
//
// The labels are generated navigation text, not claims about the person —
// hence data-text-origin="generated". Everything they filter is canonical.

import { ROLE_LIST, type RoleId } from "@/lib/resume/roles";

export function RoleNav({ active }: { active: RoleId | null }) {
  return (
    <nav className="resume-roles" aria-label="Filter this resume by focus">
      <span className="resume-roles-label mono" data-text-origin="generated">
        Read as
      </span>
      <ul className="resume-roles-list">
        <li>
          <a
            className="resume-role-link mono"
            href="/resume"
            aria-current={active === null ? "page" : undefined}
            data-text-origin="generated"
          >
            Full record
          </a>
        </li>
        {ROLE_LIST.map((view) => (
          <li key={view.id}>
            <a
              className="resume-role-link mono"
              href={`/resume?role=${view.id}`}
              aria-current={active === view.id ? "page" : undefined}
              data-text-origin="generated"
            >
              {view.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
