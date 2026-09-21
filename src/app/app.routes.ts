import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.HomeComponent),
    title: 'Blitzpool',
  },
  {
    path: 'network',
    loadComponent: () => import('./features/network/network').then((m) => m.NetworkComponent),
    title: 'Network · Blitzpool',
  },
  {
    path: 'groups',
    loadComponent: () =>
      import('./features/groups/group-list').then((m) => m.GroupListComponent),
    title: 'Groups · Blitzpool',
  },
  {
    path: 'groups/new',
    loadComponent: () =>
      import('./features/groups/group-create').then((m) => m.GroupCreateComponent),
    title: 'New group · Blitzpool',
  },
  {
    path: 'groups/:id',
    loadComponent: () =>
      import('./features/groups/group-detail').then((m) => m.GroupDetailComponent),
    title: 'Group · Blitzpool',
  },
  {
    path: 'invite/:token',
    loadComponent: () => import('./features/invite/invite').then((m) => m.InviteComponent),
    title: 'Group invite · Blitzpool',
  },
  {
    path: 'blockparty/join/:token',
    loadComponent: () =>
      import('./features/blockparty/blockparty-join').then((m) => m.BlockpartyJoinComponent),
    title: 'Join blockparty · Blitzpool',
  },
  {
    path: 'blockparty/new',
    loadComponent: () =>
      import('./features/blockparty/blockparty-create').then(
        (m) => m.BlockpartyCreateComponent,
      ),
    title: 'New blockparty · Blitzpool',
  },
  {
    path: 'blockparty/:id',
    loadComponent: () =>
      import('./features/blockparty/blockparty-detail').then(
        (m) => m.BlockpartyDetailComponent,
      ),
    title: 'Blockparty · Blitzpool',
  },
  {
    path: 'email/verify/:token',
    loadComponent: () =>
      import('./features/email-verify/email-verify').then((m) => m.EmailVerifyComponent),
    title: 'Verify email · Blitzpool',
  },
  {
    path: 'leaderboard',
    loadComponent: () =>
      import('./features/leaderboard/leaderboard').then((m) => m.LeaderboardComponent),
    title: 'Top difficulties · Blitzpool',
  },
  {
    path: 'address/:address',
    loadComponent: () =>
      import('./features/address/address-shell').then((m) => m.AddressShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        loadComponent: () =>
          import('./features/address/overview').then((m) => m.AddressOverviewComponent),
        title: 'Miner · Blitzpool',
      },
      {
        path: 'stats',
        loadComponent: () =>
          import('./features/address/stats').then((m) => m.AddressStatsComponent),
        title: 'Miner stats · Blitzpool',
      },
      {
        path: 'pplns',
        loadComponent: () =>
          import('./features/address/pplns').then((m) => m.AddressPplnsComponent),
        title: 'PPLNS · Blitzpool',
      },
      {
        path: 'groups',
        loadComponent: () =>
          import('./features/address/groups').then((m) => m.AddressGroupsComponent),
        title: 'Memberships · Blitzpool',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/address/settings').then((m) => m.AddressSettingsComponent),
        title: 'Miner settings · Blitzpool',
      },
      {
        path: 'worker/:worker',
        loadComponent: () =>
          import('./features/worker/worker').then((m) => m.WorkerComponent),
        title: 'Worker · Blitzpool',
      },
      {
        path: 'worker/:worker/:session',
        loadComponent: () =>
          import('./features/worker/session').then((m) => m.SessionComponent),
        title: 'Session · Blitzpool',
      },
    ],
  },
  { path: 'app/:address', redirectTo: 'address/:address' },
  { path: 'app/:address/settings', redirectTo: 'address/:address/settings' },
  { path: 'app/:address/:worker', redirectTo: 'address/:address/worker/:worker' },
  {
    path: 'app/:address/:worker/:session',
    redirectTo: 'address/:address/worker/:worker/:session',
  },
  { path: '**', redirectTo: '' },
];
