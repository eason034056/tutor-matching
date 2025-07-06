'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SolverTestPage() {
  const [testResults, setTestResults] = useState<any>({});

  const testAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const data = await response.json();
      return { success: response.ok, data, status: response.status };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const runTests = async () => {
    const results: any = {};

    // 測試 Thread 列表 API
    console.log('Testing threads API...');
    results.threads = await testAPI('/api/solver/threads?userId=test-user');

    // 測試主要解題 API
    console.log('Testing solver API...');
    results.solver = await testAPI('/api/solver', 'POST', {
      message: '測試問題',
      userId: 'test-user',
      isNewThread: true
    });

    // 如果有 threadId，測試訊息 API
    if (results.solver.success && results.solver.data.threadId) {
      console.log('Testing messages API...');
      results.messages = await testAPI(`/api/solver/threads/${results.solver.data.threadId}/messages?userId=test-user`);
    }

    setTestResults(results);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Solver API 測試頁面</h1>
        
        <Button onClick={runTests} className="mb-8">
          運行測試
        </Button>

        <div className="space-y-6">
          {Object.entries(testResults).map(([testName, result]: [string, any]) => (
            <Card key={testName}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{testName.toUpperCase()} API</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? '成功' : '失敗'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>

        {Object.keys(testResults).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              點擊「運行測試」按鈕開始測試 API
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 