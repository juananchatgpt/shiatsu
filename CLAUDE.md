# APSE · Gestión de socios — instrucciones del proyecto

## Objetivo

Una aplicación independiente para gestionar socios APSE. Es la fuente única de cuentas,
membresías, directorio y eventos; WordPress solo incrusta widgets públicos.

## Stack obligatorio

- Next.js 16, React 19, TypeScript, Tailwind.
- PostgreSQL directo con `DATABASE_URL` y queries parametrizadas (`$1`, `$2`).
- Auth propia: `users`, `sessions`, bcryptjs y cookie `apse_session` `httpOnly`.
- SMTP mediante nodemailer. No Supabase, NextAuth, Resend ni Vercel.
- GitHub → VPS/Easypanel con Docker standalone.

## Reglas de negocio críticas

- Tipos: alumno, profesional y escuela. Docente se normaliza a profesional.
- Solo se aprueba el alta; después el socio edita sus datos sin moderación.
- Los alumnos nunca son públicos.
- Profesional/escuela solo aparecen si `status=active` y `directory_opt_in=true`.
- Solo profesional/escuela activos crean eventos; siempre pasan por moderación.
- Editar un evento aprobado lo devuelve a `pending_review` y deja de ser público.
- Escuela: cuenta propia, vinculada a un profesional activo; máximo una escuela por profesional.
- Pagos, GoCardless y envíos masivos están fuera de fase 1.

## Datos sensibles

- Nunca versionar `.env.local`, `DATOS.txt`, audio/DOCX, export CSV ni documentos de socios.
- Nunca exponer DNI/NIE, datos privados, estados internos, notas o `legacy_data` en APIs públicas.
- El export WordPress solo se importa con autorización y tras `npm run wp:inspect`.
- Los hashes WordPress no se reutilizan: los importados requieren restablecer contraseña.

## Validación obligatoria

`npm test` → `npm run typecheck` → `npm run build`. Con infraestructura real: `npm run db:test`,
`npm run db:apply`, prueba SMTP y QA de permisos/listados/fichas antes de desplegar.

## Contrato

`.claude/PRPs/PRP-001-gestion-socios-apse.md` es el contrato activo. Registrar allí aprendizajes.
