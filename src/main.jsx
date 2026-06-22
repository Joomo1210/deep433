import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import BlogIndex from './BlogIndex.jsx'
import BlogPost from './BlogPost.jsx'
import AdminNewPost from './AdminNewPost.jsx'

function Router() {
  const path = window.location.pathname;

  if (path === '/blog' || path === '/blog/') {
    return <BlogIndex />;
  }
  if (path.startsWith('/blog/')) {
    return <BlogPost />;
  }
  if (path === '/admin/new-post') {
    return <AdminNewPost />;
  }
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>
)
