import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Profile() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">View your account details and shortcuts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Name</p>
            <p className="text-sm font-medium mt-1">{user?.name || 'Unknown user'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Email</p>
            <p className="text-sm mt-1">{user?.email || 'Not available'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Role</p>
            <Badge variant="secondary" className="mt-1">{user?.role || 'user'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link to="/settings"><Button variant="outline">Open Settings</Button></Link>
          <Link to="/reminders"><Button variant="outline">Open Reminders</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}

