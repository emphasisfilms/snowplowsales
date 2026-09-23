# Homepage content checklist

Every slot on the new homepage is either **static** (lives in the code, changes rarely) or
**admin-managed** (edited in Admin → Homepage, stored in `site_settings.home_content`).
Nothing on the page is a placeholder once every row below is checked.

Legend: ✅ real content in place · 🟡 real but should be reviewed/replaced · ⬜ needs Robert

## Hero
| Slot | Status | Source | How it's maintained |
|---|---|---|---|
| Background photo | ✅ | Own photo (Fisher lineup on the lot) | Admin → Homepage → Hero (upload to swap for a seasonal shot) |
| Headline / subheadline | ✅ | Written | Admin → Homepage → Hero |
| Two buttons | ✅ | Link to Fisher page and Services | Admin → Homepage → Hero |
| Promo tag (top right) | 🟡 | "Pre-season plow specials" | Admin → Homepage → Hero (toggle off when no promo) |

## Brand cards (Fisher / Toro / STIHL) + Salt Flap strip
| Slot | Status | Source | Maintained |
|---|---|---|---|
| Fisher logo | ✅ | Existing site asset | Static |
| Toro logo | ✅ | Existing site asset | Static |
| STIHL logo | ✅ | Official SVG from stihlusa.com | Static (`assets/images/brands/stihl/stihl-logo.svg`) |
| Salt Flap logo | ✅ | saltflap.com | Static (`assets/images/brands/saltflap/logo.webp`) |
| Card copy | ✅ | Written | Static (edit in HTML) |

## Browse-by-category tiles
| Tile | Status | Photo |
|---|---|---|
| Snow Plows | ✅ | Fisher XV2 studio shot (fisherplows.com) |
| Spreaders | ✅ | Fisher Poly-Caster (fisherplows.com) |
| Snow Blowers | ✅ | Toro Power Max (toro.com) |
| Mowers | ✅ | Toro TimeCutter (toro.com) |
| Chainsaws & Trimmers | ✅ | STIHL chainsaw category image (stihlusa.com) |
| Parts & Accessories | ✅ | STIHL saw chains (stihlusa.com). Optional: swap for a photo of your parts counter. |

## Welcome block
| Slot | Status | Notes |
|---|---|---|
| Aerial photo | ✅ | Own photo |
| Copy + 4 checkmarks | ✅ | Written; review wording |
| Optional crew photo | ⬜ | One photo of the team in front of the sign would make this section noticeably warmer |

## Services strip
✅ Written. Static. Confirm "pre-season check-ups" is something you offer.

## Manufacturer promotion banner
| Slot | Status | Notes |
|---|---|---|
| Artwork | ✅ | Toro "Built for Winter" banner (toro.com). Admin-managed: swap in the current Fisher/Toro/STIHL promo a few times a year. |
| Tag / title / text / link | ✅ | Admin → Homepage → Promotion. Toggle off when nothing is running. |

## News cards (3)
| Card | Status | Photo |
|---|---|---|
| Now an authorized STIHL dealer | ✅ | Your own photo of the STIHL wall in the store (Sept 2026) |
| Now carrying Salt Flap | ✅ | Salt Flap installed (saltflap.com) |
| Fisher pre-season install slots | 🟡 | Fisher HS on truck (fisherplows.com). Update the text/date each season. |
All three are admin-managed.

## Video
| Slot | Status | Notes |
|---|---|---|
| YouTube link | ⬜ | Section stays hidden until a link is entered in Admin → Homepage → Video. A phone timelapse of a plow install is perfect. |

## Instagram
| Slot | Status | Notes |
|---|---|---|
| Handle link | ✅ | @snowplowsalesllc |
| 8 photos | 🟡 | One row: 8 on wide screens, 6 / 4 / 3 as the browser narrows (never a second row). Defaults are lot and brand photos; upload recent posts in Admin → Homepage → Instagram. |

## Customer reviews (3)
| Slot | Status | Notes |
|---|---|---|
| Quotes | ✅ | Three real 5-star Google reviews (Stephen K., Morgan B., William M.), lightly trimmed. Swap any time in Admin → Homepage → Reviews. Alternates worth rotating in: Clide Q. ("didn't want to sell me something I didn't need"), Steve ("Saturday lift cylinder, after-hours pickup"), Jeff T. ("looked factory installed"), Shane M. ("customer for life"). |
| "View all" link | ✅ | Google listing (maps?cid=2771468949835565661) |
| "Leave a review" link | ✅ | Direct review form: https://g.page/r/CV1K-XRTPHYmEBM/review |

## Location block
✅ Address, phone, map are real. Hours come from Admin → Store Hours, and the "Open now" badge is computed from them.

## Brand pages
✅ Lineups on the Fisher, Toro and STIHL pages are built into the site (not admin-managed). When a manufacturer adds or drops a model, ask for the page to be updated.

## Brand partners strip
✅ Fisher, Toro, STIHL (official logo), Salt Flap. Add BackRack logo if you want it shown (currently text).

## Footer
✅ Real. Links wire up when the redesign is ported to the live pages.

---

## Image sources pulled (dealer-authorized)
- Fisher: fisherplows.com product studio shots → `assets/images/brands/fisher/`
- Toro: toro.com category cutouts and banners → `assets/images/brands/toro/`
- STIHL: stihlusa.com category images, MS 162 / MS 251, official logo → `assets/images/brands/stihl/`
- Salt Flap: saltflap.com product photos and logo → `assets/images/brands/saltflap/`

## Keeping it current (the routine)
- **Weekly (2 min):** glance at the promo banner and news cards in Admin → Homepage. Toggle off anything stale.
- **Each season:** swap the hero photo and promo artwork (manufacturer promo art comes from the Fisher / Toro / STIHL dealer portals).
- **Whenever you get a good review or a good photo:** paste it into Reviews or Instagram in admin. Takes a minute.
- **Alert banner** (already built) still handles storm closures and one-off notices.
