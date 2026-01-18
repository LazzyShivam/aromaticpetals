# Aromatic Petals E-commerce Platform

A full-featured e-commerce platform built with Next.js, Express, Supabase, and Razorpay.

## Features

- **Storefront**: Browse products, search, and filter by category.
- **Shopping Cart**: Client-side cart with persistence.
- **Checkout**: Integrated Razorpay payment gateway.
- **Authentication**: User login/signup using NextAuth and Supabase.
- **Admin Dashboard**: Manage products and view orders.
- **User Profile**: View order history.

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, Lucide React
- **Backend**: Express.js (deployed as Vercel Serverless Function)
- **Database**: Supabase (PostgreSQL)
- **Auth**: NextAuth.js + Supabase Adapter
- **Payments**: Razorpay

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.local` and fill in your credentials:
   - Supabase URL & Keys
   - Razorpay Keys
   - NextAuth Secret

3. **Database Setup**:
   The migrations are in `supabase/migrations`. Apply them to your Supabase project.
   The initial migration creates tables and RLS policies.
   The second migration seeds sample product data.

4. **Run Locally**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Deployment

The project is configured for Vercel deployment using Next.js App Router route handlers under `src/app/api`.

## Project Structure

- `src/app`: Next.js App Router pages
- `src/components`: React components
- `src/hooks`: Custom hooks (useCart)
- `src/lib`: Utilities and clients (Supabase, Auth)
- `supabase`: Database migrations
