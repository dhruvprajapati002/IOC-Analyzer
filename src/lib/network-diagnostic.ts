// /**
//  * Network Diagnostic Utility
//  * Helps diagnose fetch failures and connection issues
//  */

// interface TestResult {
//   url: string;
//   success: boolean;
//   status: number | null;
//   responseTime: number;
//   error: string | null;
//   headers: Record<string, string>;
//   retryAttempts: number;
// }

// interface FetchOptions extends RequestInit {
//   headers?: Record<string, string>;
// }

// export class NetworkDiagnostic {
//   static async testEndpoint(url: string, options: FetchOptions = {}): Promise<TestResult> {
//     const startTime = Date.now();
//     const results: TestResult = {
//       url,
//       success: false,
//       status: null,
//       responseTime: 0,
//       error: null,
//       headers: {},
//       retryAttempts: 0
//     };

//     try {
//       console.log(`🔍 Testing endpoint: ${url}`);
      
//       const controller = new AbortController();
//       const timeoutId = setTimeout(() => controller.abort(), 15000);
      
//       const response = await fetch(url, {
//         ...options,
//         signal: controller.signal,
//         headers: {
//           'Content-Type': 'application/json',
//           ...(options.headers || {})
//         }
//       });
      
//       clearTimeout(timeoutId);
      
//       results.success = response.ok;
//       results.status = response.status;
//       results.responseTime = Date.now() - startTime;
      
//       // Collect response headers
//       response.headers.forEach((value, key) => {
//         results.headers[key] = value;
//       });
      
//       if (response.ok) {
//         console.log(`✅ ${url} - ${response.status} (${results.responseTime}ms)`);
//       } else {
//         console.warn(`⚠️ ${url} - ${response.status} ${response.statusText} (${results.responseTime}ms)`);
//       }
      
//     } catch (error) {
//       const err = error as Error;
//       results.error = err.message;
//       results.responseTime = Date.now() - startTime;
      
//       if (err.name === 'AbortError') {
//         console.error(`⏰ ${url} - Timeout after 15s`);
//       } else {
//         console.error(`❌ ${url} - ${err.message} (${results.responseTime}ms)`);
//       }
//     }
    
//     return results;
//   }

//   static async diagnoseEndpoints() {
//     console.log('🏥 Running Network Diagnostics...');
    
//     const endpoints = [
//       { url: '/api/dashboard-v2?range=weekly', method: 'GET' },
//       { url: '/api/history-v2?page=1&pageSize=10', method: 'GET' },
//       { url: '/api/auth/user', method: 'GET' }
//     ];
    
//     const results = [];
    
//     for (const endpoint of endpoints) {
//       const result = await this.testEndpoint(endpoint.url, { method: endpoint.method });
//       results.push(result);
      
//       // Small delay between tests
//       await new Promise(resolve => setTimeout(resolve, 500));
//     }
    
//     // Summary report
//     console.log('\n📊 Diagnostic Summary:');
//     console.log('='.repeat(50));
    
//     results.forEach(result => {
//       const status = result.success ? '✅' : '❌';
//       const time = result.responseTime.toFixed(0);
//       console.log(`${status} ${result.url} - ${result.status || 'FAILED'} (${time}ms)`);
      
//       if (result.error) {
//         console.log(`   Error: ${result.error}`);
//       }
//     });
    
//     const successCount = results.filter(r => r.success).length;
//     const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
//     console.log(`\n📈 Success Rate: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(1)}%)`);
//     console.log(`⏱️ Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    
//     if (successCount < results.length) {
//       console.log('\n🔧 Troubleshooting Tips:');
//       console.log('• Check if the development server is running');
//       console.log('• Verify MongoDB connection in server logs');
//       console.log('• Check browser network tab for detailed errors');
//       console.log('• Try refreshing the page or clearing browser cache');
//     }
    
//     return results;
//   }

//   static async retryFetch(url: string, options: FetchOptions = {}, maxRetries = 3): Promise<Response> {
//     let lastError: Error | null = null;
    
//     for (let attempt = 1; attempt <= maxRetries; attempt++) {
//       try {
//         console.log(`🔄 Fetch attempt ${attempt}/${maxRetries}: ${url}`);
        
//         const controller = new AbortController();
//         const timeoutId = setTimeout(() => controller.abort(), 10000);
        
//         const response = await fetch(url, {
//           ...options,
//           signal: controller.signal,
//           headers: {
//             'Content-Type': 'application/json',
//             'Cache-Control': 'no-cache',
//             ...(options.headers || {})
//           }
//         });
        
//         clearTimeout(timeoutId);
        
//         if (response.ok) {
//           console.log(`✅ Success on attempt ${attempt}`);
//           return response;
//         } else {
//           throw new Error(`HTTP ${response.status}: ${response.statusText}`);
//         }
        
//       } catch (error) {
//         lastError = error as Error;
//         console.warn(`⚠️ Attempt ${attempt} failed: ${lastError.message}`);
        
//         if (attempt < maxRetries) {
//           const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
//           console.log(`⏳ Retrying in ${delay}ms...`);
//           await new Promise(resolve => setTimeout(resolve, delay));
//         }
//       }
//     }
    
//     console.error(`❌ All ${maxRetries} attempts failed for ${url}`);
//     throw lastError || new Error('Max retries exceeded');
//   }
// }

// // Global diagnostic function for easy access
// declare global {
//   interface Window {
//     networkDiag: typeof NetworkDiagnostic;
//   }
// }

// if (typeof window !== 'undefined') {
//   window.networkDiag = NetworkDiagnostic;
//   console.log('🔧 Network diagnostics available: window.networkDiag.diagnoseEndpoints()');
// }
