// Temporary fix - the home components are misplaced in pages/api/home/
// They should be moved out of the api folder, but for now we'll create a simple page

import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated and redirect appropriately
    // For now, just show the page
  }, []);
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      backgroundColor: '#000',
      color: '#fff'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Loading Amplify...</h1>
        <p>Redirecting to chat interface...</p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
        'promptbar',
        'settings',
      ])),
    },
  };
};