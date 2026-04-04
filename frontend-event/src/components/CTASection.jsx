import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { ArrowRight } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="cta-section" id="about">
      <Container>
        <h2>Siap Untuk Bergabung?</h2>
        <p>
          Daftarkan diri Anda sekarang dan dapatkan akses ke ribuan event menarik. 
          Jangan lewatkan kesempatan untuk mengembangkan diri dan memperluas jaringan Anda.
        </p>
        <div className="d-flex gap-3 justify-content-center flex-wrap">
          <Button className="btn-purple btn-lg">
            Daftar Sekarang <ArrowRight size={18} className="ms-2" />
          </Button>
          <Button variant="outline-secondary" className="btn-lg" style={{ borderRadius: '50px' }}>
            Pelajari Lebih Lanjut
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default CTASection;
