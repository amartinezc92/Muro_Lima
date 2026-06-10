# El Muro de Lima · MVP

Directorio visual interactivo donde negocios independientes de Lima compran espacios en una grilla digital.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno)
- **DB**: Supabase PostgreSQL
- **Pagos**: Stripe Checkout
- **Email**: Brevo
- **Storage**: Supabase Storage
- **Deploy**: Vercel + Supabase

## Setup local (4 pasos)

### 1. Supabase

1. Crear proyecto en supabase.com
2. Ir a SQL Editor → ejecutar `database/schema.sql`
3. Ir a Storage → crear bucket `spaces` con acceso público ON
4. Copiar Project URL y anon key al `.env.local`

### 2. Variables de entorno

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx
```

### 3. Correr localmente

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Deploy Edge Functions (Supabase)

```bash
supabase link --project-ref TU_PROJECT_REF
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxx
supabase secrets set BREVO_API_KEY=xxxx
supabase functions deploy create-checkout
supabase functions deploy stripe-webhook
```

## Deploy Frontend (Vercel)

1. Push a GitHub
2. Importar en vercel.com
3. Agregar variables VITE_* en Vercel Settings
4. Deploy automático

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Home con grilla 20×15 |
| `/dashboard` | Dashboard vendedor |
| `/admin` | Panel admin |
| `/success` | Confirmación de pago |

## Admin MVP

Email: `admin@murodlima.com` · Password: `MuroAdmin2024!`

## Precios

| Plan | Precio | Tamaño |
|------|--------|--------|
| Básico | S/99 | 2×2 |
| Premium | S/299 | 4×2 |
| Ultra | S/799 | 6×4 |

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
