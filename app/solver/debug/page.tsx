'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
  const { user, loading, login, logout } = useAuth();

  const handleTestLogin = async () => {
    try {
      await login('test@example.com', 'password123');
    } catch (error) {
      console.error('Test login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">認證狀態調試頁面</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>認證狀態</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>載入狀態:</strong> {loading ? '載入中...' : '完成'}
                </div>
                <div>
                  <strong>用戶狀態:</strong> {user ? '已登入' : '未登入'}
                </div>
                {user && (
                  <div>
                    <strong>用戶 ID:</strong> {user.uid}
                  </div>
                )}
                {user && (
                  <div>
                    <strong>電子郵件:</strong> {user.email}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={handleTestLogin} className="w-full">
                  測試登入
                </Button>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  登出
                </Button>
                <Button 
                  onClick={() => window.location.href = '/solver'} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  前往 Solver 頁面
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>詳細資訊</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify({ user, loading }, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 