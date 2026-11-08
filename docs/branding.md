# Branding and political symbols

## Manifesto Tracker

The application logo and favicon use the artwork supplied by the project owner:

- `ManifestoTrackerLogo.png`: full logo, used in desktop navigation.
- `favicon.png`: compact mark, used for mobile navigation and browser/app icons.

The web assets in `public/branding/` remove transparent outer margins and are resized for the interface. The artwork and its colours are preserved. Browser icons live in `src/app/favicon.ico`, `src/app/icon.png` and `src/app/apple-icon.png`; Next.js adds the icon metadata automatically.

## Party and coalition logos

Party and coalition profiles use the registered symbols mapped in `src/lib/entity-logos.ts`. Politicians use verified portraits where available, with initials as the fallback. Add a logo mapping when introducing another party or coalition.

Source: [Suruhanjaya Pilihan Raya Malaysia — registered party symbols](https://www.spr.gov.my/parti-parti-yang-berdaftar/), listed as updated 11 July 2026. Retrieved 8 November 2026. The files below are unmodified copies of the images published by SPR and are served locally so visitors do not depend on external image hosts.

Party names and emblems belong to their respective organisations. They identify the subjects of the tracker and do not imply endorsement or affiliation. These third-party marks are not covered by any licence for this repository's application code.

| Profile | Local image | SPR image source |
| --- | --- | --- |
| Barisan Nasional | `/logos/barisan-nasional.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/logo-parti-barisan-nasional-BN-1.webp) |
| Gabungan Parti Sarawak | `/logos/gabungan-parti-sarawak.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/Group-72.webp) |
| Gabungan Rakyat Sabah | `/logos/gabungan-rakyat-sabah.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/grs.webp) |
| Pakatan Harapan | `/logos/pakatan-harapan.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/Group-89.webp) |
| Perikatan Nasional | `/logos/perikatan-nasional.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/Mask-group-11.webp) |
| Democratic Action Party | `/logos/dap.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/logo-parti-Parti-Tindakan-Demokratik-DAP.webp) |
| Malaysian Chinese Association | `/logos/mca.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/logo-parti-Parti-Persatuan-Cina-Malaysia-MCA.webp) |
| Parti Amanah Negara | `/logos/amanah.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/logo-parti-Parti-Amanah-Negara-AMANAH-1-1.webp) |
| Parti Islam Se-Malaysia | `/logos/pas.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/logo-parti-Parti-Islam-Se-Malaysia-PAS.webp) |
| Parti Keadilan Rakyat | `/logos/pkr.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/Group-78.webp) |
| Parti Pesaka Bumiputera Bersatu | `/logos/pbb.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/Group-112.webp) |
| Parti Pribumi Bersatu Malaysia | `/logos/bersatu.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/Group-111.webp) |
| Parti Wawasan Negara | `/logos/wawasan.png` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/PARTI-WAWASAN-NEGARA.png) |
| United Malays National Organisation | `/logos/umno.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/logo-parti-Parti-Pertubuhan-Kebangsaan-Melayu-Bersatu-UMNO.webp) |
| Progressive Democratic Party | `/logos/pdp.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/Mask-group-1.webp) |
| Parti Rakyat Sarawak | `/logos/prs.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/logo-parti-Parti-Rakyat-Sarawak-PRS.webp) |
| Parti Bersatu Rakyat Sabah | `/logos/pbrs.webp` | [Original](https://spr.gov.my/wp-content/uploads/2024/10/Group-115.webp) |

PDP, PRS and PBRS symbols were retrieved from the same SPR register on 9 November 2026 for CAB-0008, CAB-0009 and CAB-0014 respectively.
