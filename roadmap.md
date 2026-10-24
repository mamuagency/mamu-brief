# MAMU Brief — Targeted Update Roadmap

- [ ] Enable Lovable Cloud (storage for reference image uploads, submission records)
- [ ] brief.ts: phone + products required; conditional website/social URLs for established/rebrand; logoLang "other" + specify input; 24 attributes; styles multi-select max 2 (13 options); applications grouped categories; budget 3 non-numeric options; remove deliveryDate; keep launch/deadline; reference images field
- [ ] i18n.ts: all new AR/EN labels, English digits everywhere (fix Arabic-Indic digits in heroMeta/budget)
- [ ] fields.tsx: multi-select with max+disable, collapsible category groups, image upload component (drag-drop, previews, remove, 5MB/5 files, real type validation)
- [ ] BriefForm.tsx: conditional validation, uploads, updated review screen
- [ ] index.tsx: rocket launch animation on CTA (700–1100ms, reduced-motion fallback, no re-trigger on steps)
- [ ] submit-brief.functions.ts: server-side validation of all new rules, store submission + images
- [ ] QA: both languages, both themes, validation rules, uploads, animation
- [ ] Report: what changed, what tested, what still needs config (email delivery)
