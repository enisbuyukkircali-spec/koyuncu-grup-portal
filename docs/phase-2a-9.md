# Phase 2A-9 — Corporate Communications, Brand Center, Email Signature

Scope: existing koyuncu-grup-portal / phase-2a-1 Preview only. No production/DNS change, email provider, notification rewrite or new dependency.

## Data and screens

- `/corporate-communications` reuses the existing authorized dashboard content projection for current announcements/news/upcoming events. Existing per-content permissions and audience filters remain. New announcement category `İnsan & Organizasyon` supplements the seven requested categories already present. No automatic HR announcements or second CMS.
- `/brand-center` shows current authorized assets, search/category/company/file type/photo-tag filters, 20-item pagination and lazy thumbnails. Detail contains usage note, description, type, version, publication/update dates and uploader. No sample business assets seeded.
- Eight initial editable categories: Koyuncu Grup Logoları; Şirket Logoları; PowerPoint Şablonları; E-posta İmza Şablonları; Antetli Kağıt & Doküman Şablonları; Kurumsal Sunumlar; Brandbook / Kurumsal Kimlik Kılavuzları; Onaylı Şirket Fotoğrafları.
- `/admin/brand-center` manages metadata/categories, draft upload, new immutable file versions, current selection and archive. A partial unique index allows one current version per asset. Publication archives the prior current version in the existing transaction/app lock. Versions are never overwritten/deleted; a DB trigger protects original bytes and metadata. Managers can download older versions with download permission.
- Audience is intentionally simple: all employees or asset's existing Company. Ordinary users cannot list, search, inspect or download another company's restricted asset. Admin management requires `brand_center.manage`; download permission is also checked separately.

## Storage and security

Uses existing Neon inline base64 file storage; no provider or paid service added. Each original file <=200,000 bytes, thumbnail <=40,000 bytes. Originals are absent from list/detail payloads and fetched only from authenticated download endpoint.
Supported: PNG/JPG/WebP (byte signatures), PDF, restricted static SVG geometry, macro-free PPTX/DOCX containers. SVG rejects scripts, events, style, external links, entities and foreignObject; it is never rendered inline or previewed. Office ZIP directory is bounded and rejects traversal, macros/ActiveX/embedded executables and excessive expanded size. This is format validation, not antivirus or an Office-document certification service.
Downloads send attachment disposition with encoded filename, nosniff, private/no-store and sandbox CSP. File paths never become filesystem paths. Optional previews use validated raster thumbnails; unsupported previews show file type and download instead.
Large presentations, full brandbooks and high-resolution galleries will often exceed the existing 200 KB limit. A production storage decision is required before large-file use; no silent provider switch or purchase was made.

## Signatures

- `/brand-center/email-signature` reads only currentUser's existing name/email/phone/extension/company/job title. No second employee record and no arbitrary user ID parameter.
- `/admin/brand-center/email-signatures` configures fixed-layout templates with company, raster logo, corporate text, HTTPS website, optional plain-text footer and active flag. Activating a template deactivates the prior one for the same company; partial unique indexes also enforce it.
- Company-specific active template > active group default. Logo uses template logo, otherwise existing company logo. Missing personal/contact fields are omitted, not replaced with invented data.
- Built-in group template is seeded; authorized communications administrators can configure the approved company template. Font/color/layout are fixed. Server-generated HTML escapes every text value; no free HTML/JS editor.
- Copy uses HTML + plain text ClipboardItem; falls back to plain text/manual select if browser clipboard support/permission is unavailable. No mailbox connection, automatic Outlook installation or email send.
- Inline base64 logo compatibility varies across email clients. User should verify paste in their email client's signature editor and add the approved logo there manually if necessary. No publicly exposed private-download route was added to solve email image hosting.

## Model / permissions / performance

Migration `db/009_brand_center.sql`: `brand_categories`, `brand_assets`, `brand_asset_versions`, `email_signature_templates`; existing User/Company/AuditLog remain authoritative. Existing migration runner runs 009 then seed on Vercel build.
Permissions: `corporate_communications.view`, `brand_center.view`, `brand_center.download`, `brand_center.manage`, `email_signature.use`, `email_signature.manage`.
Employees receive own/view/download/use; CONTENT_ADMIN receives both management grants; ADMIN/SUPER_ADMIN retain full grants. Only newly inserted permissions receive default grants; user overrides and deliberately removed role grants survive reseeding. Management routes accept their specific management permission, including user override grants.
Admin navigation adds one Corporate Communications group through shared ContentNav. Existing CMS links are not duplicated. MASTER dashboard only changes its existing Corporate Communications destination.
Global Search adds at most four current, audience-authorized asset title results in the existing single SQL query. No archived assets, files, private signatures or descriptions are searched.
Brand list and signature each use one query. Filters/options load outside the list's critical server render; no per-card queries, no original-file eager loading. Existing session/auth/cache/performance approach unchanged.

## Validation

286 total tests passed (26 new Brand Center tests including suite parent), including Phases 1–8. Covers roles/overrides, current/draft/archive audience, authenticated download, immutable history, unique current version, rollback on bad file, active SVG denial, Office container validation, bounded metadata-only list/search, currentUser signature, template selection/fallback, missing fields, escaped HTML and audit payload minimization.
Typecheck and production build successful. Preview UI smoke checks are performed after deployment; no test business asset is created in the live database.
No new environment variable required. Configure company templates/logo/website in admin; upload approved assets within current storage limit and explicitly mark their desired version current.
Stop after Phase 2A-9. Phase 2A-10 is not started.
