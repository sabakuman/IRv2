import React, { useEffect, useState } from 'react';
import { MockService } from '../services/mockService';
import { AuditLog } from '../types';
import { Card } from '../components/ui/LayoutComponents';
import { format } from 'date-fns';
import { Activity, Search } from 'lucide-react';

export default function AdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const data = await MockService.getAuditLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-serif font-bold text-primary-dark">System Logs</h1>
        <p className="text-muted-foreground">Audit trail of all user activities and security events.</p>
      </div>

      <Card>
         <div className="p-4 border-b flex items-center gap-4 bg-gray-50/50">
            <Search className="text-gray-400" size={18} />
            <input placeholder="Filter logs..." className="bg-transparent outline-none flex-1 text-sm" />
         </div>
         <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                     <th className="p-4 font-semibold text-gray-600">Timestamp</th>
                     <th className="p-4 font-semibold text-gray-600">User</th>
                     <th className="p-4 font-semibold text-gray-600">Action</th>
                     <th className="p-4 font-semibold text-gray-600">Details</th>
                  </tr>
               </thead>
               <tbody className="divide-y">
                  {logs.map(log => (
                     <tr key={log.id} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-500 whitespace-nowrap font-mono text-xs">
                           {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                        </td>
                        <td className="p-4 font-medium">{log.user}</td>
                        <td className="p-4">
                           <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                              log.action === 'LOGIN' ? 'bg-blue-100 text-blue-700' :
                              log.action === 'REPORT_CREATE' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                           }`}>
                              {log.action}
                           </span>
                        </td>
                        <td className="p-4 text-gray-600">{log.details}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
}