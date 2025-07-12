# Chat Attachments Migration - 2025-07-11

## Overview
Implementarea sistemului de fișiere pentru chat-ul din aplicația Fleetopia prin adăugarea unei noi tabele `chat_attachments` în baza de date.

## Fișiere Modificate

### 1. Migration File
**Fișier:** `database/migrations/2025-07-11_add_chat_attachments_table.sql`

```sql
CREATE TABLE chat_attachments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Scopul Migration-ului

### Ce Face Tabela `chat_attachments`:

1. **Stocarea Referințelor Fișierelor**
   - Nu stochează fișierele în sine în baza de date
   - Păstrează doar referințele către fișierele din S3/storage cloud

2. **Structura Tabelei:**
   - `id` - cheia primară unică pentru fiecare attachment
   - `user_id` - leagă fișierul de utilizatorul care l-a uploadat
   - `filename` - numele original al fișierului (pentru afișare)
   - `s3_key` - path-ul exact în sistemul de storage (pentru descărcare)
   - `created_at` - timestamp-ul când a fost uploadat

3. **Relațiile Database:**
   - `user_id` → `users(id)` (Foreign Key)
   - Fiecare fișier aparține unui utilizator specific

## Procesul de Implementare

### Pas 1: Crearea Migration-ului
```bash
# Creat fișierul migration
database/migrations/2025-07-11_add_chat_attachments_table.sql
```

### Pas 2: Git Operations
```bash
git add database/migrations/2025-07-11_add_chat_attachments_table.sql
git commit -m "Add chat attachments table migration"
git push -u origin feature/marketplace-fleet
```

### Pas 3: Deploy & Migration
- Railway va detecta automat noul fișier de migration
- La deploy, va executa `CREATE TABLE chat_attachments`
- Tabela va fi disponibilă pentru următoarea fază de dezvoltare

## Următorii Pași

1. **Backend Implementation:**
   - API endpoints pentru upload/download fișiere
   - Integrare cu S3 pentru storage
   - Validare fișiere (tip, mărime)

2. **Frontend Implementation:**
   - Componente pentru drag-and-drop upload
   - Preview fișiere în chat
   - Download links

3. **Securitate:**
   - Autorizare pe fișiere (doar owner-ul poate accesa)
   - Validare tipuri de fișiere permise
   - Limitări de mărime per fișier/user

## Benefits

- **Performance:** Fișierele nu încarcă baza de date
- **Scalabilitate:** S3 handle-ază storage-ul eficient
- **Flexibilitate:** Suport pentru orice tip de fișier
- **Auditability:** Tracking complet al fișierelor uploadate

## Issues Encountered & Fixed

### Docker Build Issue
**Problem:** Railway build failed due to inconsistent use of `npm` vs `pnpm` in Dockerfile.
- Dependencies installed with `pnpm` but build tried to use `npm`
- **Fix:** Modified Dockerfile to use `pnpm run build` for consistency

**Commit Fix:** `12cec79 - Fix Dockerfile to use pnpm for build consistency`

## Status
✅ **Migration Created & Pushed**  
✅ **Dockerfile Build Issue Fixed**  
⏳ **Awaiting Railway Deployment**  
⏳ **Next: API Implementation**

---
*Creat: 2025-07-11*  
*Branch: feature/marketplace-fleet*  
*Migration Commit: 3e08685*  
*Dockerfile Fix: 12cec79* 