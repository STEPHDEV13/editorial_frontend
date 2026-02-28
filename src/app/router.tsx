import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import DashboardPage      from '../pages/DashboardPage';
import ArticlesPage       from '../pages/ArticlesPage';
import ArticleFormPage    from '../pages/ArticleFormPage';
import CategoriesPage     from '../pages/CategoriesPage';
import NetworksPage       from '../pages/NetworksPage';
import NotificationsPage  from '../pages/NotificationsPage';
import ImportPage         from '../pages/ImportPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true,                      element: <DashboardPage /> },
      { path: 'articles',                 element: <ArticlesPage /> },
      { path: 'articles/new',             element: <ArticleFormPage /> },
      { path: 'articles/:id/edit',        element: <ArticleFormPage /> },
      { path: 'categories',               element: <CategoriesPage /> },
      { path: 'networks',                 element: <NetworksPage /> },
      { path: 'notifications',            element: <NotificationsPage /> },
      { path: 'import',                   element: <ImportPage /> },
    ],
  },
]);

export default function Router() {
  return <RouterProvider router={router} />;
}
