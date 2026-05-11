"""
Injects a JSON-LD <script> block into index.html before </head>.
Run by the GitHub Actions deploy workflow — never committed to the repo,
so forks stay clean and the schema only appears on the canonical deployment.

If you forked this project and want to deploy it, update the JSONLD dict
below with your own details before deploying.
"""

import json
import sys

JSONLD = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Hedron Contrast Checker",
    "url": "https://contrastchecker.hedron.it",
    "description": (
        "Dependency-free color contrast checker. "
        "WCAG 2.2 AA/AAA + APCA, divergence detection, "
        "conformant color suggestions. Zero build step."
    ),
    "applicationCategory": "DeveloperApplication",
    "applicationSubCategory": "Accessibility",
    "operatingSystem": "Web Browser",
    "inLanguage": "en",
    "isAccessibleForFree": True,
    "author": [
        {
            "@type": "Person",
            "name": "Giacomo Bosio",
            "url": "https://giacomobosio.com",
            "sameAs": [
                "https://orcid.org/0009-0008-0670-2245",
                "https://it.linkedin.com/in/giacomobosio/",
                "https://github.com/giacomobosio"
            ]
        },
        {
            "@type": "Person",
            "name": "Edoardo D'Amore",
            "sameAs": [
                "https://www.linkedin.com/in/edoardodamore/",
                "https://github.com/EdoardoDamore"
            ]
        },
        {
            "@type": "Person",
            "name": "Nicoletta Bruno",
            "sameAs": [
                "https://www.linkedin.com/in/nicoletta-bruno-0602b925/",
                "https://github.com/Nicohed"
            ]
        }
    ],
    "publisher": {
        "@type": "Organization",
        "name": "Hedron",
        "url": "https://hedron.it",
        "logo": {
            "@type": "ImageObject",
            "url": "https://hedron.it/assets/img/logo-hedron.svg"
        }
    },
    "sameAs": "https://github.com/hedronit/hedron-contrast-checker",
    "license": "https://www.gnu.org/licenses/gpl-3.0.html",
    "keywords": [
        "contrast checker",
        "WCAG 2.2",
        "APCA",
        "color accessibility",
        "web accessibility",
        "a11y"
    ]
}

TARGET_FILE = "index.html"
PLACEHOLDER = "</head>"

script_block = (
    '\n  <script type="application/ld+json">\n'
    + json.dumps(JSONLD, indent=2, ensure_ascii=False)
    + '\n  </script>\n'
)

with open(TARGET_FILE, "r", encoding="utf-8") as f:
    content = f.read()

if PLACEHOLDER not in content:
    print(f"ERROR: '{PLACEHOLDER}' not found in {TARGET_FILE}.", file=sys.stderr)
    sys.exit(1)

if '"@type": "WebApplication"' in content:
    print("WARNING: JSON-LD already present in index.html — skipping injection.")
    sys.exit(0)

modified = content.replace(PLACEHOLDER, f"{script_block}{PLACEHOLDER}", 1)

with open(TARGET_FILE, "w", encoding="utf-8") as f:
    f.write(modified)

print(f"JSON-LD injected successfully into {TARGET_FILE}.")
