import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - B2B Vegetable',
  description: 'Terms of Service for B2B Vegetable platform',
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 