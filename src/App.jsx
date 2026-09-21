import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import Statement from './components/Statement/Statement';
import Gallery from './components/Gallery/Gallery';
import Sponsors from './components/Sponsors/Sponsors';
import Program from './components/Program/Program';
import Contact from './components/Contact/Contact';
import BackToTop from './components/BackToTop/BackToTop';
import Footer from './components/Footer/Footer';
import SiteGridLines from './components/SiteGridLines/SiteGridLines';

function App() {
  return (
    <>
      <Header />
      <Hero />
      <div className="site-grid">
        <SiteGridLines />
        <main>
          <Statement />
          <Gallery />
          <Sponsors />
          <div className="red-gradient-wrap">
            <Program />
            <Contact />
          </div>
        </main>
        <BackToTop />
        <Footer />
      </div>
    </>
  );
}

export default App;
