# Skunkworks Academy Learning Catalogue

Canonical, structured catalogue for on-demand labs, cloud sandboxes and
instructor-led practical labs — published as a browsable catalogue at
**https://skunkworks-academy.github.io/labs-catalog/**.

Every learning item is classified across five dimensions so learners and
instructors can route straight to what matters:

| Dimension | Source | Examples |
|-----------|--------|----------|
| **Job role** | `taxonomy.jobRoles` | Network Engineer, VoIP Engineer, Cloud Engineer, Security Analyst |
| **Complexity** | `taxonomy.complexityLevels` | Beginner → Intermediate → Advanced → Expert |
| **Duration** | `durationMinutes` (banded) | Short, Standard, Extended, Pathway |
| **Industry** | `taxonomy.industries` | Telecommunications, Financial Services, Healthcare, Public Sector |
| **Specialization** | `taxonomy.specializations` | VoIP, Linux, Networking, Cloud, DevOps, Cybersecurity, API Integration, Data |

## Structure

```
labs-catalog/
├── index.html                       # Browsable, filterable catalogue (GitHub Pages landing page)
├── data/
│   ├── taxonomy.json                # Controlled vocabularies for every dimension
│   ├── catalog.json                 # The catalogue entries (this is the source of truth)
│   └── labs.json                    # Legacy minimal lab list (retained for back-compat)
├── schema/
│   ├── catalog-entry.schema.json    # JSON Schema for a single catalogue entry
│   └── lab.schema.json              # Legacy lab schema
└── scripts/
    └── validate-catalog.mjs         # Dependency-free validator (run in CI)
```

## Adding or editing an entry

1. Edit `data/catalog.json`. Each entry must match `schema/catalog-entry.schema.json`:

   ```json
   {
     "id": "NET-101",
     "title": "Networking Essentials: IP, Subnetting & Routing",
     "summary": "Build a confident mental model of addressing, subnetting and routing.",
     "jobRoles": ["network-engineer", "support-technician"],
     "complexity": "beginner",
     "durationMinutes": 120,
     "industries": ["cross-industry"],
     "specializations": ["networking"],
     "status": "published"
   }
   ```

2. Reference only ids that exist in `data/taxonomy.json`. To introduce a new
   role, industry or specialization, add it to the taxonomy first.
3. Validate locally:

   ```bash
   node scripts/validate-catalog.mjs
   ```

   The validator checks required fields, id format and uniqueness, the `status`
   enum, and that every role/complexity/industry/specialization reference
   resolves against the taxonomy. It exits non-zero on any error so it can gate CI.

## Landing page

`index.html` is a single, dependency-free page that reuses the Skunkworks
Academy theme, favicon, brand logo and global navigation bar. It fetches
`data/taxonomy.json` and `data/catalog.json` at runtime, renders filter
controls for all five dimensions plus free-text search, and keeps the active
filter set in the URL so a view can be shared. It degrades gracefully with a
clear message if the data files cannot be loaded.
