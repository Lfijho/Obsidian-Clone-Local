import { AuthGuard } from '@/components/AuthGuard';
import { MainApp } from '@/components/MainApp';

const Index = () => {
  return (
    <AuthGuard>
      <MainApp />
    </AuthGuard>
  );
};

export default Index;
