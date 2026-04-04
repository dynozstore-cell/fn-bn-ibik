import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { MapPin, Users, ArrowRight } from 'lucide-react';

const EventSection = () => {
  const events = [
    {
      id: 1,
      title: 'Tech Conference 2026',
      description: 'Konferensi teknologi terbesar di Indonesia dengan pembicara internasional dan workshop intensif.',
      date: '15 Mar 2026',
      location: 'Jakarta Convention Center',
      attendees: 500,
      image: 'https://images.unsplash.com/photo-1505373876077-705f7919a43b?w=800&q=80',
      category: 'Teknologi',
    },
    {
      id: 2,
      title: 'Music Festival Summer',
      description: 'Festival musik musim panas dengan artis lokal dan internasional dari berbagai genre.',
      date: '22 Apr 2026',
      location: 'Bali Beach Park',
      attendees: 2000,
      image: 'https://images.unsplash.com/photo-1459749381174-1c12b6c8a877?w=800&q=80',
      category: 'Musik',
    },
    {
      id: 3,
      title: 'Design Workshop',
      description: 'Workshop desain UI/UX bersama para expert industri kreatif tanah air.',
      date: '10 May 2026',
      location: 'Bandung Digital Hub',
      attendees: 150,
      image: 'https://images.unsplash.com/photo-1558403198-6d838d2c9b10?w=800&q=80',
      category: 'Desain',
    },
    {
      id: 4,
      title: 'Startup Summit',
      description: 'Summit tahunan untuk startup dan entrepreneur dengan networking session eksklusif.',
      date: '28 May 2026',
      location: 'Surabaya Convention Hall',
      attendees: 800,
      image: 'https://images.unsplash.com/photo-1515187029133-18d056d81577?w=800&q=80',
      category: 'Bisnis',
    },
    {
      id: 5,
      title: 'Food & Culinary Fest',
      description: 'Festival kuliner terbesar dengan berbagai hidangan dari seluruh Indonesia.',
      date: '5 Jun 2026',
      location: 'Yogyakarta City Square',
      attendees: 3000,
      image: 'https://images.unsplash.com/photo-1555939594-5a3f9c28d881?w=800&q=80',
      category: 'Kuliner',
    },
    {
      id: 6,
      title: 'Sports Championship',
      description: 'Kejuaraan olahraga nasional dengan berbagai cabang olahraga kompetitif.',
      date: '20 Jun 2026',
      location: 'Stadion Gelora Bung Karno',
      attendees: 5000,
      image: 'https://images.unsplash.com/photo-1461896856934-fffffffff?w=800&q=80',
      category: 'Olahraga',
    },
  ];

  return (
    <section className="event-section" id="events">
      <Container>
        <div className="section-title">
          <h2>Event Mendatang</h2>
        </div>
        <Row className="g-4">
          {events.map((event) => (
            <Col key={event.id} lg={4} md={6}>
              <Card className="event-card">
                <div style={{ position: 'relative' }}>
                  <Card.Img variant="top" src={event.image} alt={event.title} />
                  <span 
                    style={{ 
                      position: 'absolute', 
                      top: '1rem', 
                      left: '1rem',
                      background: 'rgba(255,255,255,0.95)',
                      color: '#6B46C1',
                      padding: '0.3rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}
                  >
                    {event.category}
                  </span>
                </div>
                <Card.Body className="event-card-body">
                  <span className="event-date">{event.date}</span>
                  <Card.Title className="event-card-title">{event.title}</Card.Title>
                  <Card.Text className="event-card-text">{event.description}</Card.Text>
                  <div className="event-meta">
                    <span>
                      <MapPin size={14} /> {event.location.split(' ')[0]}
                    </span>
                    <span>
                      <Users size={14} /> {event.attendees.toLocaleString()}+
                    </span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-center mt-5">
          <Button className="btn-purple btn-lg">
            Lihat Semua Event <ArrowRight size={18} className="ms-2" />
          </Button>
        </div>
      </Container>
    </section>
  );
};

export default EventSection;
