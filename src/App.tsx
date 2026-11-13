import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageTransition from './components/PageTransition';
import BotanicalDecor from './components/BotanicalDecor';
import Home from './pages/Home';
import Grants from './pages/Grants';
import Stories from './pages/Stories';
import Demo from './pages/Demo';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import styles from './App.module.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.page}>
        <BotanicalDecor />
        <Navbar />
        <main className={styles.main}>
          <PageTransition>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/grants" element={<Grants />} />
              <Route path="/stories" element={<Stories />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
