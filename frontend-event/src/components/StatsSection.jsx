import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Calendar, Users, MapPin, Award } from 'lucide-react';

const StatsSection = () => {
  const stats = [
    { icon: Calendar, number: '500+', label: 'Event Tersedia' },
    { icon: Users, number: '50K+', label: 'Peserta Aktif' },
    { icon: MapPin, number: '100+', label: 'Kota di Indonesia' },
    { icon: Award, number: '98%', label: 'Kepuasan Pengguna' },
  ];

  return (
    <section className="stats-section">
      <Container>
        <Row>
          {stats.map((stat, index) => (
            <Col key={index} lg={3} md={6} sm={6}>
              <div className="stat-item">
                <stat.icon size={40} style={{ marginBottom: '1rem', opacity: 0.9 }} />
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default StatsSection;
