# Identité visuelle FJCS / CTNI

Logos officiels (PNG ronds, fond transparent, 1080 px) :

- `public/assets/logo-fjcs.png` - Foyer des Jeunes et de la Culture de Sangalkam
- `public/assets/logo-ctni.png` - Commission Transformation Numérique et Innovation

Utilisation via `components/shared/logo.tsx` : `<Logo org="fjcs|ctni" variant="emblem|wordmark" />`.
`wordmark` = logo rond + nom en texte (toujours lisible, même à 40 px) ; `emblem` = logo rond seul.

## Palette

| Rôle | Hex | Usage |
|---|---|---|
| Bleu FJCS (primaire) | `#1a0d90` | boutons, titres, sidebar |
| Cyan FJCS (accent) | `#76c7ce` | accents, badges |
| Vert FJCS (succès) | `#41792f` | états de succès |
| Palette graphiques (validée contraste / daltonisme) | `#4a45c4 #0e94a8 #4f9a3c #8c7ae6 #c2410c` | Recharts, PDF |

Les échelles complètes (`brand-*`, `cyan-*`, `green-*`) sont définies dans `app/globals.css`.
