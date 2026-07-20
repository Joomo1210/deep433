import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import BlogIndex from './BlogIndex.jsx'
import BlogPost from './BlogPost.jsx'
import AdminNewPost from './AdminNewPost.jsx'
import AdminEditPost from './AdminEditPost.jsx'
import AdminReviewSubmissions from './AdminReviewSubmissions.jsx'
import SubmitTake from './SubmitTake.jsx'
import AdminGate from './AdminGate.jsx'

function Router() {
  const path = window.location.pathname;
  if (path === '/blog' || path === '/blog/') {
    return <BlogIndex />;
  }
  if (path.startsWith('/blog/')) {
    return <BlogPost />;
  }
  if (path === '/submit' || path === '/submit/') {
    return <SubmitTake />;
  }
  if (path === '/admin/new-post') {
    return <AdminGate><AdminNewPost /></AdminGate>;
  }
  if (path === '/admin/edit-post') {
    return <AdminGate><AdminEditPost /></AdminGate>;
  }
  if (path === '/admin/review-submissions') {
    return <AdminGate><AdminReviewSubmissions /></AdminGate>;
  }
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router />
  </StrictMode>
)
