import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Activity, 
  Clock, 
  TrendingUp, 
  Smartphone, 
  Eye,
  RefreshCw,
  UserCheck,
  MousePointer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnlineUser {
  user_id: string;
  device_id: string;
  status: string;
  last_seen_at: string;
  current_activity: string | null;
  display_name: string | null;
  avatar_url: string | null;
  user_type: string;
  is_pwa_installed: boolean;
}

interface ActivityLog {
  id: string;
  user_id: string | null;
  activity_type: string;
  activity_category: string;
  created_at: string;
  metadata: any;
  entity_id: string | null;
  entity_type: string | null;
}

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  todayActiveUsers: number;
  newRegistrationsToday: number;
  pwaInstalls: number;
  totalActivities: number;
}

export default function AdminAnalyticsDashboard() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    onlineUsers: 0,
    todayActiveUsers: 0,
    newRegistrationsToday: 0,
    pwaInstalls: 0,
    totalActivities: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Subscribe to real-time presence updates
  useEffect(() => {
    const channel = supabase
      .channel('online-users')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'user_presence' },
        () => {
          fetchOnlineUsers();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Subscribe to real-time activity updates
  useEffect(() => {
    const channel = supabase
      .channel('activity-logs')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          const newActivity = payload.new as ActivityLog;
          setRecentActivities(prev => [newActivity, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Fetch data
  const fetchData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchOnlineUsers(),
        fetchRecentActivities(),
      ]);
    } catch (error) {
      toast({
        title: 'Error fetching analytics',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Online users
    const { count: onlineUsers } = await supabase
      .from('user_presence')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'online');

    // Today's active users (unique)
    const { data: todayActive } = await supabase
      .from('activity_logs')
      .select('user_id')
      .gte('created_at', `${today}T00:00:00`)
      .not('user_id', 'is', null);
    
    const todayActiveUsers = new Set(todayActive?.map(a => a.user_id)).size;

    // New registrations today
    const { count: newRegistrations } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true })
      .eq('activity_type', 'register')
      .gte('created_at', `${today}T00:00:00`);

    // PWA installs
    const { count: pwaInstalls } = await supabase
      .from('user_devices')
      .select('*', { count: 'exact', head: true })
      .eq('is_pwa_installed', true);

    // Total activities
    const { count: totalActivities } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact', head: true });

    setStats({
      totalUsers: totalUsers || 0,
      onlineUsers: onlineUsers || 0,
      todayActiveUsers,
      newRegistrationsToday: newRegistrations || 0,
      pwaInstalls: pwaInstalls || 0,
      totalActivities: totalActivities || 0,
    });
  };

  const fetchOnlineUsers = async () => {
    const { data, error } = await supabase
      .from('online_users')
      .select('*')
      .order('last_seen_at', { ascending: false });

    if (!error && data) {
      setOnlineUsers(data as OnlineUser[]);
    }
  };

  const fetchRecentActivities = async () => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setRecentActivities(data as ActivityLog[]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (category: string) => {
    switch (category) {
      case 'auth': return <UserCheck className="w-4 h-4" />;
      case 'content': return <MousePointer className="w-4 h-4" />;
      case 'interaction': return <Activity className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'همین الان';
    if (minutes < 60) return `${minutes} دقیقه پیش`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ساعت پیش`;
    return `${Math.floor(hours / 24)} روز پیش`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">داشبورد تحلیل‌ها</h1>
          <p className="text-muted-foreground">آمار و اطلاعات کاربران در لحظه</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchData}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${refreshing ? 'animate-spin' : ''}`} />
          بروزرسانی
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">کاربران آنلاین</CardTitle>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onlineUsers}</div>
            <p className="text-xs text-muted-foreground">
              از {stats.totalUsers} کاربر کل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">فعال امروز</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayActiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              کاربر یکتا
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ثبت‌نام امروز</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newRegistrationsToday}</div>
            <p className="text-xs text-muted-foreground">
              کاربر جدید
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">نصب PWA</CardTitle>
            <Smartphone className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pwaInstalls}</div>
            <p className="text-xs text-muted-foreground">
              نصب فعال
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">کل فعالیت‌ها</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ثبت شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">نرخ حضور</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers > 0 
                ? `${Math.round((stats.onlineUsers / stats.totalUsers) * 100)}%` 
                : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              کاربران آنلاین
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="online" className="space-y-4">
        <TabsList>
          <TabsTrigger value="online">
            <UserCheck className="w-4 h-4 ml-2" />
            آنلاین ({onlineUsers.length})
          </TabsTrigger>
          <TabsTrigger value="activities">
            <Activity className="w-4 h-4 ml-2" />
            فعالیت‌ها
          </TabsTrigger>
        </TabsList>

        <TabsContent value="online" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>کاربران آنلاین</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {onlineUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    هیچ کاربر آنلاینی یافت نشد
                  </p>
                ) : (
                  onlineUsers.map((user) => (
                    <div 
                      key={user.user_id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {user.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt="" 
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-bold">
                                {user.display_name?.charAt(0) || '?'}
                              </span>
                            </div>
                          )}
                          <div 
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{user.display_name || 'کاربر ناشناس'}</p>
                          <p className="text-sm text-muted-foreground">
                            {user.current_activity || 'فعالیت نامشخص'} • {formatRelativeTime(user.last_seen_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.is_pwa_installed && (
                          <Badge variant="secondary" className="text-xs">
                            PWA
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {user.user_type}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>فعالیت‌های اخیر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {recentActivities.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    هیچ فعالیتی ثبت نشده
                  </p>
                ) : (
                  recentActivities.map((activity) => (
                    <div 
                      key={activity.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">
                          {getActivityIcon(activity.activity_category)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {activity.activity_type}
                          </p>
                          {activity.entity_type && (
                            <p className="text-xs text-muted-foreground">
                              {activity.entity_type}: {activity.entity_id?.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(activity.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
